import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { AiderSession } from "./aider";
import { WorkspaceManager } from "./workspace";
import { ENV } from "./_core/env";
import { emitToUser } from "./_core/socket";

export const projectRouter = router({
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const projectId = await db.createProject(ctx.user.id, input.name, input.description);
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
    }))
    .mutation(async ({ ctx, input }) => {
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
        // Create Aider session
        const aider = new AiderSession({
          projectPath,
          model: "gpt-4o-mini",
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
