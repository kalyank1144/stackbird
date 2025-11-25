import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

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

describe("Project Management API", () => {
  it("should create a new project", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.projects.create({
      name: "Test Project",
      description: "A test project",
    });

    expect(result).toHaveProperty("projectId");
    expect(typeof result.projectId).toBe("number");
  });

  it("should list user projects", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Create a project first
    await caller.projects.create({
      name: "Test Project 1",
      description: "First test project",
    });

    // List projects
    const projects = await caller.projects.list();

    expect(Array.isArray(projects)).toBe(true);
    expect(projects.length).toBeGreaterThan(0);
  });

  it("should get a specific project", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Create a project
    const { projectId } = await caller.projects.create({
      name: "Test Project",
      description: "A test project",
    });

    // Get the project
    const project = await caller.projects.get({ projectId });

    expect(project).toBeDefined();
    expect(project.id).toBe(projectId);
    expect(project.name).toBe("Test Project");
    expect(project.description).toBe("A test project");
  });

  it("should delete a project", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Create a project
    const { projectId } = await caller.projects.create({
      name: "Test Project to Delete",
    });

    // Delete the project
    const result = await caller.projects.delete({ projectId });

    expect(result.success).toBe(true);
  });

  it("should not allow access to other user's projects", async () => {
    const { ctx: ctx1 } = createTestContext(1);
    const caller1 = appRouter.createCaller(ctx1);

    // User 1 creates a project
    const { projectId } = await caller1.projects.create({
      name: "User 1 Project",
    });

    // User 2 tries to access it
    const { ctx: ctx2 } = createTestContext(2);
    const caller2 = appRouter.createCaller(ctx2);

    await expect(
      caller2.projects.get({ projectId })
    ).rejects.toThrow("Access denied");
  });
});

describe("Chat API", () => {
  it("should send a message and create a conversation", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Create a project first
    const { projectId } = await caller.projects.create({
      name: "Chat Test Project",
    });

    // Send a message
    const result = await caller.chat.send({
      projectId,
      message: "Hello AI, create a function",
    });

    expect(result).toHaveProperty("conversationId");
    expect(result).toHaveProperty("response");
    expect(typeof result.conversationId).toBe("number");
  });

  it("should retrieve conversation history", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Create a project
    const { projectId } = await caller.projects.create({
      name: "History Test Project",
    });

    // Send a message
    const { conversationId } = await caller.chat.send({
      projectId,
      message: "Test message",
    });

    // Get history
    const messages = await caller.chat.history({ conversationId });

    expect(Array.isArray(messages)).toBe(true);
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0].content).toBe("Test message");
  });

  it("should list project conversations", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Create a project
    const { projectId } = await caller.projects.create({
      name: "Conversations Test Project",
    });

    // Send a message to create a conversation
    await caller.chat.send({
      projectId,
      message: "First message",
    });

    // List conversations
    const conversations = await caller.chat.conversations({ projectId });

    expect(Array.isArray(conversations)).toBe(true);
    expect(conversations.length).toBeGreaterThan(0);
  });
});
