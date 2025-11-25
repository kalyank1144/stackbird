import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

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

      // TODO: Integrate with Aider here
      // For now, return a placeholder response
      const aiResponse = "AI response will be integrated with Aider in the next step.";
      await db.createMessage(conversationId, "assistant", aiResponse);

      return {
        conversationId,
        response: aiResponse,
      };
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
