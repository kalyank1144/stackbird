import { describe, expect, it, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { WorkspaceManager } from "./workspace";
import { execSync } from "child_process";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "test",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("Template Git Integration", () => {
  const testProjectIds: number[] = [];

  afterAll(async () => {
    // Cleanup test projects
    for (const projectId of testProjectIds) {
      try {
        await WorkspaceManager.deleteWorkspace(projectId);
      } catch (error) {
        console.error(`Failed to cleanup project ${projectId}:`, error);
      }
    }
  });

  it("should commit React template files to git", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    // Create project with React template
    const result = await caller.projects.create({
      name: "Git Test Project",
      description: "Testing git commit",
      templateId: "react-app",
    });
    
    testProjectIds.push(result.projectId);
    
    // Get project path
    const projectPath = WorkspaceManager.getProjectPath(result.projectId);
    
    // Check git status
    const gitStatus = execSync("git status --porcelain", { 
      cwd: projectPath,
      encoding: "utf-8"
    });
    
    // Should have no uncommitted changes (all template files committed)
    expect(gitStatus.trim()).toBe("");
    
    // List tracked files
    const trackedFiles = execSync("git ls-files", { 
      cwd: projectPath,
      encoding: "utf-8"
    }).trim().split("\n");
    
    // Should have React template files
    expect(trackedFiles).toContain("package.json");
    expect(trackedFiles).toContain("index.html");
    expect(trackedFiles).toContain("src/App.tsx");
    expect(trackedFiles).toContain("src/main.tsx");
    expect(trackedFiles).toContain("vite.config.ts");
    expect(trackedFiles).toContain("tsconfig.json");
    expect(trackedFiles).toContain("tailwind.config.js");
    
    // Check git log
    const gitLog = execSync("git log --oneline", { 
      cwd: projectPath,
      encoding: "utf-8"
    });
    
    // Should have initial commit
    expect(gitLog).toContain("Initial commit");
  });
});
