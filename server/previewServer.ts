import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs/promises";
import { WorkspaceManager } from "./workspace";

/**
 * Middleware to serve project files as a live preview
 */
export function createPreviewMiddleware() {
  const router = express.Router();

  // Serve project files
  router.get("/api/preview/:projectId/*", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const filePath = req.params[0] || "index.html";

      if (isNaN(projectId)) {
        return res.status(400).send("Invalid project ID");
      }

      const projectPath = WorkspaceManager.getProjectPath(projectId);
      const fullPath = path.join(projectPath, filePath);

      // Security check: ensure the path is within the project directory
      const resolvedPath = path.resolve(fullPath);
      const resolvedProjectPath = path.resolve(projectPath);
      if (!resolvedPath.startsWith(resolvedProjectPath)) {
        return res.status(403).send("Access denied");
      }

      // Check if file exists
      try {
        const stats = await fs.stat(resolvedPath);

        if (stats.isDirectory()) {
          // Try to serve index.html from directory
          const indexPath = path.join(resolvedPath, "index.html");
          try {
            await fs.access(indexPath);
            return res.sendFile(indexPath);
          } catch {
            return res.status(404).send("No index.html found in directory");
          }
        }

        // Determine content type
        const ext = path.extname(resolvedPath).toLowerCase();
        const contentTypes: Record<string, string> = {
          ".html": "text/html",
          ".css": "text/css",
          ".js": "application/javascript",
          ".json": "application/json",
          ".png": "image/png",
          ".jpg": "image/jpeg",
          ".jpeg": "image/jpeg",
          ".gif": "image/gif",
          ".svg": "image/svg+xml",
          ".ico": "image/x-icon",
          ".woff": "font/woff",
          ".woff2": "font/woff2",
          ".ttf": "font/ttf",
          ".eot": "application/vnd.ms-fontobject",
        };

        const contentType = contentTypes[ext] || "application/octet-stream";
        res.setHeader("Content-Type", contentType);

        // Disable caching for development
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");

        return res.sendFile(resolvedPath);
      } catch (error) {
        return res.status(404).send("File not found");
      }
    } catch (error) {
      console.error("[Preview] Error serving file:", error);
      return res.status(500).send("Internal server error");
    }
  });

  return router;
}
