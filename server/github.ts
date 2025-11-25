import { exec } from "child_process";
import { promisify } from "util";
import { WorkspaceManager } from "./workspace";

const execAsync = promisify(exec);

export interface GitHubRepo {
  name: string;
  url: string;
  htmlUrl: string;
}

export class GitHubIntegration {
  /**
   * Check if GitHub CLI is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      await execAsync("gh auth status");
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get authenticated user's GitHub username
   */
  static async getUsername(): Promise<string | null> {
    try {
      const { stdout } = await execAsync("gh api user --jq .login");
      return stdout.trim();
    } catch {
      return null;
    }
  }

  /**
   * Create a new GitHub repository
   */
  static async createRepository(
    name: string,
    description: string,
    isPrivate: boolean = false
  ): Promise<GitHubRepo> {
    try {
      const visibility = isPrivate ? "--private" : "--public";
      const descArg = description ? `--description "${description.replace(/"/g, '\\"')}"` : "";
      
      const { stdout } = await execAsync(
        `gh repo create ${name} ${visibility} ${descArg} --json name,url,sshUrl`
      );
      
      const result = JSON.parse(stdout);
      return {
        name: result.name,
        url: result.sshUrl || result.url,
        htmlUrl: `https://github.com/${await this.getUsername()}/${name}`,
      };
    } catch (error: any) {
      throw new Error(`Failed to create GitHub repository: ${error.message}`);
    }
  }

  /**
   * Initialize git repository in project workspace and push to GitHub
   */
  static async pushToGitHub(
    projectId: number,
    repoName: string,
    commitMessage: string = "Initial commit from Stackbird",
    userEmail: string = "kalyankumarchindam@gmail.com",
    userName: string = "Stackbird User"
  ): Promise<string> {
    const projectPath = WorkspaceManager.getProjectPath(projectId);

    try {
      // Initialize git repository
      await execAsync(`cd "${projectPath}" && git init`);

      // Configure git user (use user's identity, not agent's)
      await execAsync(`cd "${projectPath}" && git config user.email "${userEmail}"`);
      await execAsync(`cd "${projectPath}" && git config user.name "${userName}"`);

      // Add all files
      await execAsync(`cd "${projectPath}" && git add -A`);

      // Create initial commit
      await execAsync(`cd "${projectPath}" && git commit -m "${commitMessage.replace(/"/g, '\\"')}"`);

      // Get the repository URL
      const username = await this.getUsername();
      if (!username) {
        throw new Error("Could not get GitHub username");
      }

      const repoUrl = `https://github.com/${username}/${repoName}.git`;

      // Add remote
      await execAsync(`cd "${projectPath}" && git remote add origin ${repoUrl}`);

      // Push to GitHub
      await execAsync(`cd "${projectPath}" && git push -u origin main`);

      return `https://github.com/${username}/${repoName}`;
    } catch (error: any) {
      throw new Error(`Failed to push to GitHub: ${error.message}`);
    }
  }

  /**
   * Check if project has git repository
   */
  static async hasGitRepo(projectId: number): Promise<boolean> {
    const projectPath = WorkspaceManager.getProjectPath(projectId);
    try {
      await execAsync(`cd "${projectPath}" && git status`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get remote repository URL if exists
   */
  static async getRemoteUrl(projectId: number): Promise<string | null> {
    const projectPath = WorkspaceManager.getProjectPath(projectId);
    try {
      const { stdout } = await execAsync(`cd "${projectPath}" && git remote get-url origin`);
      return stdout.trim();
    } catch {
      return null;
    }
  }
}
