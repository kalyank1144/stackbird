import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { AiderSession } from "./aider";
import { WorkspaceManager } from "./workspace";
import { BuildManager } from "./buildManager";
import { getTemplateById, getAllTemplates } from "./templates";
import { emitToUser, getUserSocketEmitter } from "./_core/socket";
import { executeCode } from "./executor";
import { GitHubIntegration } from "./github";
import { hasEnoughCredits, deductCredits, getUserCredits, PLANS, canCreateProject } from "./subscription";
import { getModelById, canUseModel, getDefaultModel } from "./models";
import { ENV } from "./_core/env";

export const projectRouter = router({
  templates: publicProcedure.query(() => {
    return getAllTemplates();
  }),
  
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      description: z.string().optional(),
      templateId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check project limit
      const userProjects = await db.getUserProjects(ctx.user.id);
      const canCreate = await canCreateProject(ctx.user.id, userProjects.length);
      if (!canCreate) {
        const userCredits = await getUserCredits(ctx.user.id);
        const plan = userCredits.plan as "free" | "pro";
        const planConfig = PLANS[plan];
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `You've reached your project limit (${planConfig.maxProjects} projects). Upgrade to Pro for ${PLANS.pro.maxProjects} projects!`,
        });
      }

      const projectId = await db.createProject(ctx.user.id, input.name, input.description);
      
      // Initialize workspace directory
      const projectPath = WorkspaceManager.getProjectPath(projectId);
      
      // Apply template if specified
      if (input.templateId) {
        const template = getTemplateById(input.templateId);
        if (template) {
          for (const file of template.files) {
            await WorkspaceManager.writeFile(projectId, file.path, file.content);
          }
          // Commit template files to git
          await WorkspaceManager.commitTemplateFiles(projectId, template.name);
        }
      }
      
      return { projectId };
    }),

  list: protectedProcedure
    .query(async ({ ctx }) => {
      return await db.getUserProjects(ctx.user.id);
    }),

  get: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const project = await db.getProjectById(input.projectId);
      
      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }
      
      if (project.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }
      
      return project;
    }),

  delete: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const project = await db.getProjectById(input.projectId);
      
      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }
      
      if (project.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }
      
      await db.deleteProject(input.projectId);
      
      // Delete workspace directory
      await WorkspaceManager.deleteWorkspace(input.projectId);
      
      return { success: true };
    }),
});

export const chatRouter = router({
  send: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      conversationId: z.number().optional(),
      message: z.string().min(1),
      modelId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Determine which model to use
      const userCredits = await getUserCredits(ctx.user.id);
      const userPlan = userCredits.plan as "free" | "pro";
      const requestedModelId = input.modelId || getDefaultModel(userPlan).id;
      
      // Check if user can use this model
      if (!canUseModel(userPlan, requestedModelId)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This model is only available for Pro users. Upgrade to access all models!",
        });
      }
      
      const model = getModelById(requestedModelId);
      if (!model) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid model selected",
        });
      }
      
      // Check if user has enough tokens for this model
      const hasCredits = await hasEnoughCredits(ctx.user.id, model.tokenCost);
      if (!hasCredits) {
        const planConfig = PLANS[userPlan];
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Not enough tokens! You need ${model.tokenCost} tokens but only have ${userCredits.remaining} left. ${userPlan === "free" ? "Upgrade to Pro for 5,000 tokens/month!" : `Resets ${planConfig.resetPeriod === "daily" ? "tomorrow" : "next month"}.`}`,
        });
      }

      // Verify project ownership
      const project = await db.getProjectById(input.projectId);
      if (!project || project.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      // Create or get conversation
      let conversationId = input.conversationId;
      if (!conversationId) {
        conversationId = await db.createConversation(
          input.projectId,
          input.message.substring(0, 50) // Use first 50 chars as title
        );
      }

      // Save user message
      await db.createMessage(conversationId, "user", input.message);

      // Load previous conversation messages for context (limit to last 50)
      const previousMessages = await db.getConversationMessages(conversationId);
      const contextMessages = previousMessages
        .slice(-51) // Get last 51 messages (50 previous + 1 current)
        .slice(0, -1) // Remove the current message we just added
        .map(m => `${m.role}: ${m.content}`)
        .join('\n\n');
      
      console.log(`[Chat] Loaded ${previousMessages.length - 1} previous messages for context`);

      // Initialize workspace if it doesn't exist
      const workspaceExists = await WorkspaceManager.workspaceExists(input.projectId);
      if (!workspaceExists) {
        await WorkspaceManager.initializeWorkspace(input.projectId);
      }

      // Get workspace path
      const projectPath = WorkspaceManager.getProjectPath(input.projectId);
      
      // List all files in workspace to add to Aider context
      const workspaceFiles = await WorkspaceManager.listFiles(input.projectId);
      console.log(`[Chat] Found ${workspaceFiles.length} files in workspace`);

      // Skip Aider execution in test mode
      if (process.env.NODE_ENV === "test" || process.env.VITEST) {
        const mockResponse = "[Test Mode] AI code generation would happen here.";
        await db.createMessage(conversationId, "assistant", mockResponse);
        return {
          conversationId,
          response: mockResponse,
        };
      }

      try {
        // Determine which API key to use based on model provider
        let apiKey = ENV.forgeApiKey; // Default to built-in API key
        if (model.provider === "google") {
          apiKey = process.env.GEMINI_API_KEY || ENV.forgeApiKey;
        } else if (model.provider === "anthropic") {
          apiKey = process.env.ANTHROPIC_API_KEY || ENV.forgeApiKey;
        }
        
        // Create Aider session with selected model
        const aider = new AiderSession({
          projectPath,
          model: model.aiderModelName, // Use the Aider-compatible model name
          apiKey, // Use appropriate API key
        });

        let aiResponse = "";
        
        // Emit streaming start event
        emitToUser(ctx.user.id, "ai:stream:start", {
          conversationId,
          projectId: input.projectId,
        });
        
        // Collect output from Aider and stream to user
        aider.on("output", (data: string) => {
          // Filter out noise from Aider output
          const shouldSkip = 
            data.includes("Skipping") ||
            data.includes("node_modules") ||
            data.includes("matches gitignore spec") ||
            data.includes("Warning: it's best to only add files") ||
            data.trim().startsWith("────────");
          
          if (!shouldSkip) {
            aiResponse += data;
            
            // Stream chunk to user via WebSocket (only meaningful content)
            emitToUser(ctx.user.id, "ai:stream:chunk", {
              conversationId,
              chunk: data,
            });
          }
        });
        
        // Listen to stderr to capture any errors
        aider.on("stderr", (data: string) => {
          console.warn("[Chat] Aider stderr:", data);
          aiResponse += "\n[Error] " + data;
        });

        // Start Aider and send message asynchronously
        // Don't await - let it process in background to avoid stream timeout
        (async () => {
          try {
            // Start Aider with all workspace files in context
            await aider.start(workspaceFiles);
            console.log("[Chat] Aider started with files, sending message");
            
            // Prepend conversation context if exists
            let messageWithContext = input.message;
            if (contextMessages) {
              messageWithContext = `Previous conversation context:\n${contextMessages}\n\n---\n\nCurrent request: ${input.message}`;
              console.log("[Chat] Added conversation context to message");
            }
            
            await aider.sendMessage(messageWithContext);
            
            // Wait for aider to finish processing (30 seconds max)
            await new Promise((resolve) => setTimeout(resolve, 30000));
            
            // Clean up the initial response
            const cleanResponse = aiResponse.trim() || "Code generation completed. Check your project files.";
            
            // Save initial AI response
            await db.createMessage(conversationId, "assistant", cleanResponse);
            
            // Deduct tokens based on model cost
            await deductCredits(ctx.user.id, model.tokenCost, "ai_message", {
              projectId: input.projectId,
              conversationId,
            });
            
            // Emit streaming end event
            emitToUser(ctx.user.id, "ai:stream:end", {
              conversationId,
              response: cleanResponse,
            });
            
            // Auto-build React projects after code generation
            console.log("[Chat] Checking if project needs building...");
            const isNodeProject = await BuildManager.isNodeProject(input.projectId);
            
            if (isNodeProject) {
              console.log("[Chat] Triggering auto-build for project", input.projectId);
              emitToUser(ctx.user.id, "build:start", {
                projectId: input.projectId,
              });
              
              // Build with auto-retry on errors (max 3 attempts)
              const MAX_BUILD_RETRIES = 3;
              let buildAttempt = 0;
              let buildSuccess = false;
              
              while (buildAttempt < MAX_BUILD_RETRIES && !buildSuccess) {
                buildAttempt++;
                console.log(`[Chat] Build attempt ${buildAttempt}/${MAX_BUILD_RETRIES}`);
                
                const userSocket = getUserSocketEmitter(ctx.user.id);
                const buildResult = await BuildManager.installAndBuild(input.projectId, { socket: userSocket });
                
                if (buildResult.success) {
                  console.log("[Chat] Build completed successfully");
                  buildSuccess = true;
                  emitToUser(ctx.user.id, "build:success", {
                    projectId: input.projectId,
                    output: buildResult.output,
                    attempt: buildAttempt,
                  });
                } else {
                  console.error(`[Chat] Build failed (attempt ${buildAttempt}/${MAX_BUILD_RETRIES}):`, buildResult.error);
                  emitToUser(ctx.user.id, "build:error", {
                    projectId: input.projectId,
                    error: buildResult.error || "Build failed",
                    attempt: buildAttempt,
                    maxAttempts: MAX_BUILD_RETRIES,
                  });
                  
                  // If not last attempt, ask AI to fix the error
                  if (buildAttempt < MAX_BUILD_RETRIES) {
                    console.log("[Chat] Asking AI to fix build error...");
                    const fixPrompt = `The build failed with the following error:\n\n${buildResult.error}\n\nPlease analyze this error and fix it. This is attempt ${buildAttempt} of ${MAX_BUILD_RETRIES}.`;
                    
                    // Reset AI response buffer
                    aiResponse = "";
                    
                    // Send fix request to Aider
                    await aider.sendMessage(fixPrompt);
                    
                    // Wait for AI to fix (30 seconds)
                    await new Promise((resolve) => setTimeout(resolve, 30000));
                    
                    // Save AI's fix attempt
                    const fixResponse = aiResponse.trim() || "Attempted to fix build error.";
                    await db.createMessage(conversationId, "assistant", `Build error fix attempt ${buildAttempt}: ${fixResponse}`);
                    
                    emitToUser(ctx.user.id, "ai:stream:end", {
                      conversationId,
                      response: fixResponse,
                    });
                  }
                }
              }
              
              // Final build status
              if (!buildSuccess) {
                console.error("[Chat] Build failed after", MAX_BUILD_RETRIES, "attempts");
                const finalError = `Build failed after ${MAX_BUILD_RETRIES} attempts. Please check the Console tab for details.`;
                await db.createMessage(conversationId, "assistant", finalError);
                emitToUser(ctx.user.id, "ai:stream:end", {
                  conversationId,
                  response: finalError,
                });
              }
            }
            
            // Stop Aider after build completes (or if no build needed)
            try {
              await aider.stop();
            } catch (stopError) {
              console.warn("[Chat] Error stopping Aider:", stopError);
            }
          } catch (asyncError) {
            console.error("[Chat] Async aider error:", asyncError);
            const errorMessage = asyncError instanceof Error 
              ? `Error: ${asyncError.message}` 
              : "Error: Failed to generate code.";
            
            try {
              await db.createMessage(conversationId, "assistant", errorMessage);
            } catch (dbError) {
              console.error("[Chat] Failed to save error:", dbError);
            }
            
            emitToUser(ctx.user.id, "ai:stream:error", {
              conversationId,
              error: errorMessage,
            });
          }
        })();

        // Return immediately to prevent stream timeout
        return {
          conversationId,
          status: "processing",
        };
      } catch (error) {
        console.error("[Chat] Aider execution error:", error);
        
        // Ensure we always return a proper error message
        const errorMessage = error instanceof Error 
          ? `Error: ${error.message}` 
          : "Error: Failed to generate code. Please try again.";
        
        try {
          await db.createMessage(conversationId, "assistant", errorMessage);
        } catch (dbError) {
          console.error("[Chat] Failed to save error message:", dbError);
        }
        
        // Emit error event to user
        try {
          emitToUser(ctx.user.id, "ai:stream:error", {
            conversationId,
            error: errorMessage,
          });
        } catch (socketError) {
          console.error("[Chat] Failed to emit error event:", socketError);
        }
        
        // Always return a valid JSON response
        return {
          conversationId,
          response: errorMessage,
        };
      }
    }),

  history: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ ctx, input }) => {
      const messages = await db.getConversationMessages(input.conversationId);
      
      // Verify access through project ownership
      if (messages.length > 0) {
        const conversation = await db.getProjectConversations(messages[0].conversationId);
        if (conversation.length > 0) {
          const project = await db.getProjectById(conversation[0].projectId);
          if (!project || project.userId !== ctx.user.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
          }
        }
      }
      
      return messages;
    }),

  conversations: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await db.getProjectById(input.projectId);
      if (!project || project.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }
      
      return await db.getProjectConversations(input.projectId);
    }),
});

export const githubRouter = router({
  status: protectedProcedure.query(async () => {
    const isAuth = await GitHubIntegration.isAuthenticated();
    const username = isAuth ? await GitHubIntegration.getUsername() : null;
    return { isAuthenticated: isAuth, username };
  }),

  createAndPush: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      repoName: z.string().min(1).max(100),
      description: z.string().optional(),
      isPrivate: z.boolean().default(false),
      commitMessage: z.string().default("Initial commit from Stackbird"),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await db.getProjectById(input.projectId);
      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }
      if (project.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      // Create GitHub repository
      const repo = await GitHubIntegration.createRepository(
        input.repoName,
        input.description || project.description || "",
        input.isPrivate
      );

      // Push code to GitHub (using user's email from context)
      const repoUrl = await GitHubIntegration.pushToGitHub(
        input.projectId,
        input.repoName,
        input.commitMessage,
        ctx.user.email || "kalyankumarchindam@gmail.com",
        ctx.user.name || "Stackbird User"
      );

      return {
        success: true,
        repoUrl,
        htmlUrl: repo.htmlUrl,
      };
    }),

  checkRepo: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await db.getProjectById(input.projectId);
      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }
      if (project.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      const hasRepo = await GitHubIntegration.hasGitRepo(input.projectId);
      const remoteUrl = hasRepo ? await GitHubIntegration.getRemoteUrl(input.projectId) : null;

      return { hasRepo, remoteUrl };
    }),
});

export const executionRouter = router({
  run: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      filePath: z.string(),
      timeout: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await db.getProjectById(input.projectId);
      if (!project || project.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      // Execute code with streaming output
      const result = await executeCode(
        {
          projectId: input.projectId,
          filePath: input.filePath,
          timeout: input.timeout,
        },
        (data, type) => {
          // Stream output to user via WebSocket
          emitToUser(ctx.user.id, "execution:output", {
            projectId: input.projectId,
            filePath: input.filePath,
            type,
            data,
          });
        }
      );

      return result;
    }),
});

export const fileRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await db.getProjectById(input.projectId);
      if (!project || project.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      // Check if workspace exists
      const workspaceExists = await WorkspaceManager.workspaceExists(input.projectId);
      if (!workspaceExists) {
        return [];
      }

      // List all files
      const files = await WorkspaceManager.listFiles(input.projectId);
      return files;
    }),

  read: protectedProcedure
    .input(z.object({ 
      projectId: z.number(),
      filePath: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await db.getProjectById(input.projectId);
      if (!project || project.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      try {
        const content = await WorkspaceManager.readFile(input.projectId, input.filePath);
        return {
          filePath: input.filePath,
          content,
        };
      } catch (error) {
        throw new TRPCError({ 
          code: "NOT_FOUND", 
          message: "File not found" 
        });
      }
    }),

  download: protectedProcedure
    .input(z.object({ 
      projectId: z.number(),
      filePath: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await db.getProjectById(input.projectId);
      if (!project || project.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      try {
        const content = await WorkspaceManager.readFile(input.projectId, input.filePath);
        return {
          filePath: input.filePath,
          content,
          fileName: input.filePath.split('/').pop() || 'file.txt',
        };
      } catch (error) {
        throw new TRPCError({ 
          code: "NOT_FOUND", 
          message: "File not found" 
        });
      }
    }),

  update: protectedProcedure
    .input(z.object({ 
      projectId: z.number(), 
      filePath: z.string(),
      content: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await db.getProjectById(input.projectId);
      if (!project || project.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      try {
        await WorkspaceManager.writeFile(input.projectId, input.filePath, input.content);
        return { success: true, filePath: input.filePath };
      } catch (error) {
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: "Failed to save file" 
        });
      }
    }),

  listFromDatabase: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await db.getProjectById(input.projectId);
      if (!project || project.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }
      
      return await db.getProjectFiles(input.projectId);
    }),

  upload: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      path: z.string(),
      fileKey: z.string(),
      url: z.string(),
      mimeType: z.string().optional(),
      size: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await db.getProjectById(input.projectId);
      if (!project || project.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }
      
      const fileId = await db.createFile(
        input.projectId,
        input.path,
        input.fileKey,
        input.url,
        input.mimeType,
        input.size
      );
      
      return { fileId };
    }),
});
