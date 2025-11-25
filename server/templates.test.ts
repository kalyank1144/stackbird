import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getAllTemplates, getTemplateById } from "./templates";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
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
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("Project Templates", () => {
  it("should return all available templates", () => {
    const templates = getAllTemplates();
    
    expect(templates).toBeDefined();
    expect(templates.length).toBeGreaterThan(0);
    expect(templates).toHaveLength(3); // React, Express, Flask
  });

  it("should have React template with correct structure", () => {
    const template = getTemplateById("react-app");
    
    expect(template).toBeDefined();
    expect(template?.name).toBe("React App");
    expect(template?.language).toBe("javascript");
    expect(template?.files).toBeDefined();
    expect(template?.files.length).toBeGreaterThan(0);
    
    // Check for essential React files
    const fileNames = template?.files.map(f => f.path) || [];
    expect(fileNames).toContain("package.json");
    expect(fileNames).toContain("index.html");
    expect(fileNames).toContain("src/App.tsx");
    expect(fileNames).toContain("src/main.tsx");
  });

  it("should have Express template with correct structure", () => {
    const template = getTemplateById("express-api");
    
    expect(template).toBeDefined();
    expect(template?.name).toBe("Express API");
    expect(template?.language).toBe("javascript");
    
    // Check for essential Express files
    const fileNames = template?.files.map(f => f.path) || [];
    expect(fileNames).toContain("package.json");
    expect(fileNames).toContain("src/server.ts");
    expect(fileNames).toContain("src/routes.ts");
  });

  it("should have Flask template with correct structure", () => {
    const template = getTemplateById("flask-api");
    
    expect(template).toBeDefined();
    expect(template?.name).toBe("Flask API");
    expect(template?.language).toBe("python");
    
    // Check for essential Flask files
    const fileNames = template?.files.map(f => f.path) || [];
    expect(fileNames).toContain("requirements.txt");
    expect(fileNames).toContain("app.py");
  });

  it("should return undefined for non-existent template", () => {
    const template = getTemplateById("non-existent");
    expect(template).toBeUndefined();
  });

  it("should expose templates via tRPC API", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const templates = await caller.projects.templates();
    
    expect(templates).toBeDefined();
    expect(templates.length).toBe(3);
    expect(templates[0]).toHaveProperty("id");
    expect(templates[0]).toHaveProperty("name");
    expect(templates[0]).toHaveProperty("description");
    expect(templates[0]).toHaveProperty("language");
    expect(templates[0]).toHaveProperty("files");
  });

  it("should create project with template", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    // Create project with React template
    const result = await caller.projects.create({
      name: "Test React Project",
      description: "Testing template creation",
      templateId: "react-app",
    });
    
    expect(result).toBeDefined();
    expect(result.projectId).toBeGreaterThan(0);
    
    // Clean up
    await caller.projects.delete({ projectId: result.projectId });
  });

  it("should create blank project when no template specified", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.projects.create({
      name: "Blank Project",
      description: "No template",
    });
    
    expect(result).toBeDefined();
    expect(result.projectId).toBeGreaterThan(0);
    
    // Clean up
    await caller.projects.delete({ projectId: result.projectId });
  });
});
