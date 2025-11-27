import { spawn } from "child_process";
import path from "path";
import fs from "fs/promises";
import { WorkspaceManager } from "./workspace";

export interface BuildResult {
  success: boolean;
  output: string;
  error?: string;
}

/**
 * Manages building of project workspaces
 */
export class BuildManager {
  private static buildingProjects = new Set<number>();

  /**
   * Check if a project is currently building
   */
  static isBuilding(projectId: number): boolean {
    return this.buildingProjects.has(projectId);
  }

  /**
   * Check if project has a package.json (is a Node.js project)
   */
  static async isNodeProject(projectId: number): Promise<boolean> {
    const projectPath = WorkspaceManager.getProjectPath(projectId);
    const packageJsonPath = path.join(projectPath, "package.json");
    
    try {
      await fs.access(packageJsonPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if node_modules exists
   */
  static async hasNodeModules(projectId: number): Promise<boolean> {
    const projectPath = WorkspaceManager.getProjectPath(projectId);
    const nodeModulesPath = path.join(projectPath, "node_modules");
    
    try {
      await fs.access(nodeModulesPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Run npm install in project directory
   */
  static async install(projectId: number): Promise<BuildResult> {
    const projectPath = WorkspaceManager.getProjectPath(projectId);
    
    return new Promise((resolve) => {
      let output = "";
      let error = "";

      const proc = spawn("npm", ["install"], {
        cwd: projectPath,
        shell: true,
      });

      proc.stdout.on("data", (data) => {
        output += data.toString();
      });

      proc.stderr.on("data", (data) => {
        error += data.toString();
      });

      proc.on("close", (code) => {
        if (code === 0) {
          console.log(`[Build] npm install completed for project ${projectId}`);
          resolve({ success: true, output });
        } else {
          console.error(`[Build] npm install failed for project ${projectId}:`, error);
          resolve({ success: false, output, error });
        }
      });

      proc.on("error", (err) => {
        console.error(`[Build] Failed to start npm install for project ${projectId}:`, err);
        resolve({ success: false, output, error: err.message });
      });
    });
  }

  /**
   * Run npm run build in project directory
   */
  static async build(projectId: number): Promise<BuildResult> {
    if (this.buildingProjects.has(projectId)) {
      return {
        success: false,
        output: "",
        error: "Build already in progress",
      };
    }

    this.buildingProjects.add(projectId);
    const projectPath = WorkspaceManager.getProjectPath(projectId);

    try {
      return await new Promise((resolve) => {
        let output = "";
        let error = "";

        const proc = spawn("npm", ["run", "build"], {
          cwd: projectPath,
          shell: true,
        });

        proc.stdout.on("data", (data) => {
          output += data.toString();
        });

        proc.stderr.on("data", (data) => {
          error += data.toString();
        });

        proc.on("close", (code) => {
          this.buildingProjects.delete(projectId);
          
          if (code === 0) {
            console.log(`[Build] Build completed for project ${projectId}`);
            resolve({ success: true, output });
          } else {
            console.error(`[Build] Build failed for project ${projectId}:`, error);
            resolve({ success: false, output, error });
          }
        });

        proc.on("error", (err) => {
          this.buildingProjects.delete(projectId);
          console.error(`[Build] Failed to start build for project ${projectId}:`, err);
          resolve({ success: false, output, error: err.message });
        });
      });
    } catch (err: any) {
      this.buildingProjects.delete(projectId);
      return {
        success: false,
        output: "",
        error: err.message,
      };
    }
  }

  /**
   * Install dependencies and build project
   */
  static async installAndBuild(projectId: number): Promise<BuildResult> {
    console.log(`[Build] Starting install and build for project ${projectId}`);

    // Check if it's a Node.js project
    const isNode = await this.isNodeProject(projectId);
    if (!isNode) {
      return {
        success: false,
        output: "",
        error: "Not a Node.js project (no package.json found)",
      };
    }

    // Install dependencies if node_modules doesn't exist
    const hasModules = await this.hasNodeModules(projectId);
    if (!hasModules) {
      console.log(`[Build] Installing dependencies for project ${projectId}`);
      const installResult = await this.install(projectId);
      if (!installResult.success) {
        return installResult;
      }
    }

    // Build the project
    return await this.build(projectId);
  }
}
