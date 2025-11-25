import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { WorkspaceManager } from "./workspace";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(userId: number = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("File Browser API", () => {
  const testProjectId = 99997;

  beforeAll(async () => {
    // Create a test workspace with some files
    await WorkspaceManager.initializeWorkspace(testProjectId);
    await WorkspaceManager.writeFile(testProjectId, "index.js", "console.log('Hello');");
    await WorkspaceManager.writeFile(testProjectId, "src/utils.js", "export const add = (a, b) => a + b;");
  });

  afterAll(async () => {
    // Cleanup
    await WorkspaceManager.deleteWorkspace(testProjectId);
  });

  it("should list files in workspace", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Create a project first
    const { projectId } = await caller.projects.create({
      name: "File Browser Test Project",
    });

    // Initialize workspace
    await WorkspaceManager.initializeWorkspace(projectId);
    await WorkspaceManager.writeFile(projectId, "test.js", "// Test file");

    // List files
    const files = await caller.files.list({ projectId });

    expect(Array.isArray(files)).toBe(true);
    expect(files.length).toBeGreaterThan(0);
    expect(files).toContain("README.md");
    expect(files).toContain("test.js");

    // Cleanup
    await caller.projects.delete({ projectId });
  });

  it("should read file content", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Create a project
    const { projectId } = await caller.projects.create({
      name: "File Read Test Project",
    });

    // Write a file
    const testContent = "const hello = 'world';";
    await WorkspaceManager.initializeWorkspace(projectId);
    await WorkspaceManager.writeFile(projectId, "hello.js", testContent);

    // Read the file
    const result = await caller.files.read({
      projectId,
      filePath: "hello.js",
    });

    expect(result.filePath).toBe("hello.js");
    expect(result.content).toBe(testContent);

    // Cleanup
    await caller.projects.delete({ projectId });
  });

  it("should return empty array for workspace without files", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Create a project without initializing workspace
    const { projectId } = await caller.projects.create({
      name: "Empty Workspace Test",
    });

    // List files (workspace doesn't exist yet)
    const files = await caller.files.list({ projectId });

    expect(Array.isArray(files)).toBe(true);
    expect(files.length).toBe(0);

    // Cleanup
    await caller.projects.delete({ projectId });
  });

  it("should throw error when reading non-existent file", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Create a project
    const { projectId } = await caller.projects.create({
      name: "Non-existent File Test",
    });

    await WorkspaceManager.initializeWorkspace(projectId);

    // Try to read non-existent file
    await expect(
      caller.files.read({
        projectId,
        filePath: "does-not-exist.js",
      })
    ).rejects.toThrow("File not found");

    // Cleanup
    await caller.projects.delete({ projectId });
  });

  it("should not allow access to other user's files", async () => {
    const { ctx: ctx1 } = createTestContext(1);
    const caller1 = appRouter.createCaller(ctx1);

    // User 1 creates a project
    const { projectId } = await caller1.projects.create({
      name: "User 1 Files",
    });

    await WorkspaceManager.initializeWorkspace(projectId);
    await WorkspaceManager.writeFile(projectId, "secret.js", "const secret = 'password';");

    // User 2 tries to access it
    const { ctx: ctx2 } = createTestContext(2);
    const caller2 = appRouter.createCaller(ctx2);

    await expect(
      caller2.files.list({ projectId })
    ).rejects.toThrow("Access denied");

    await expect(
      caller2.files.read({ projectId, filePath: "secret.js" })
    ).rejects.toThrow("Access denied");

    // Cleanup
    await caller1.projects.delete({ projectId });
  });
});
