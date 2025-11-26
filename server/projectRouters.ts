import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { AiderSession } from "./aider";
import { WorkspaceManager } from "./workspace";
import { ENV } from "./_core/env";
import { getTemplateById, getAllTemplates } from "./templates";
import { emitToUser } from "./_core/socket";
import { executeCode } from "./executor";
import { GitHubIntegration } from "./github";
import { hasEnoughCredits, deductCredits, getUserCredits, PLANS, canCreateProject } from "./subscription";
import { getModelById, canUseModel, getDefaultModel } from "./models";

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

      // Initialize workspace if it doesn't exist
      const workspaceExists = await WorkspaceManager.workspaceExists(input.projectId);
      if (!workspaceExists) {
        await WorkspaceManager.initializeWorkspace(input.projectId);
      }

      // Get workspace path
      const projectPath = WorkspaceManager.getProjectPath(input.projectId);

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
        // Create Aider session with selected model
        const aider = new AiderSession({
          projectPath,
          model: model.id, // Use the selected model
          apiKey: ENV.forgeApiKey, // Use built-in API key
        });

        let aiResponse = "";
        
        // Emit streaming start event
        emitToUser(ctx.user.id, "ai:stream:start", {
          conversationId,
          projectId: input.projectId,
        });
        
        // Collect output from Aider and stream to user
        aider.on("output", (data: string) => {
          aiResponse += data;
          
          // Stream chunk to user via WebSocket
          emitToUser(ctx.user.id, "ai:stream:chunk", {
            conversationId,
            chunk: data,
          });
        });

        // Start Aider and send message
        await aider.start();
        await aider.sendMessage(input.message);
        
        // Wait for response (5 seconds)
        await new Promise((resolve) => setTimeout(resolve, 5000));
        
        // Stop Aider
        await aider.stop();

        // Clean up the response
        const cleanResponse = aiResponse.trim() || "Code generation completed. Check your project files.";
        
        // Save AI response
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

        return {
          conversationId,
          response: cleanResponse,
        };
      } catch (error) {
        console.error("Aider execution error:", error);
        const errorMessage = `Error: ${error instanceof Error ? error.message : "Failed to generate code"}`;
        await db.createMessage(conversationId, "assistant", errorMessage);
        
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
