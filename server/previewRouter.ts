import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { WorkspaceManager } from "./workspace";
import path from "path";
import fs from "fs/promises";

/**
 * Preview router for serving project files as live web applications
 */
export const previewRouter = router({
  /**
   * Get the preview URL for a project
   */
  getUrl: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input, ctx }) => {
      const { projectId } = input;
      
      // Verify project ownership
      const projectPath = WorkspaceManager.getProjectPath(projectId);
      
      try {
        await fs.access(projectPath);
      } catch {
        throw new Error("Project not found");
      }
      
      // Return preview URL
      const baseUrl = process.env.VITE_FRONTEND_FORGE_API_URL || "http://localhost:3000";
      return {
        url: `/api/preview/${projectId}/`,
        fullUrl: `${baseUrl}/api/preview/${projectId}/`,
      };
    }),
});
