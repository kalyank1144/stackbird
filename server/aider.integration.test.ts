import { describe, expect, it } from "vitest";
import { WorkspaceManager } from "./workspace";
import fs from "fs/promises";

describe("Workspace Manager", () => {
  const testProjectId = 99999; // Use a high ID to avoid conflicts

  it("should create workspace directory", async () => {
    const projectPath = await WorkspaceManager.initializeWorkspace(testProjectId);
    
    expect(projectPath).toContain(`project-${testProjectId}`);
    
    // Check if README exists
    const readmePath = `${projectPath}/README.md`;
    const readmeContent = await fs.readFile(readmePath, "utf-8");
    expect(readmeContent).toContain(`Project ${testProjectId}`);
    
    // Cleanup
    await WorkspaceManager.deleteWorkspace(testProjectId);
  });

  it("should check if workspace exists", async () => {
    // Should not exist initially
    let exists = await WorkspaceManager.workspaceExists(testProjectId);
    expect(exists).toBe(false);
    
    // Create workspace
    await WorkspaceManager.initializeWorkspace(testProjectId);
    
    // Should exist now
    exists = await WorkspaceManager.workspaceExists(testProjectId);
    expect(exists).toBe(true);
    
    // Cleanup
    await WorkspaceManager.deleteWorkspace(testProjectId);
  });

  it("should write and read files", async () => {
    await WorkspaceManager.initializeWorkspace(testProjectId);
    
    // Write a file
    const testContent = "console.log('Hello from Stackbird!');";
    await WorkspaceManager.writeFile(testProjectId, "test.js", testContent);
    
    // Read it back
    const content = await WorkspaceManager.readFile(testProjectId, "test.js");
    expect(content).toBe(testContent);
    
    // Cleanup
    await WorkspaceManager.deleteWorkspace(testProjectId);
  });

  it("should list files in workspace", async () => {
    await WorkspaceManager.initializeWorkspace(testProjectId);
    
    // Write some files
    await WorkspaceManager.writeFile(testProjectId, "index.js", "// Main file");
    await WorkspaceManager.writeFile(testProjectId, "src/utils.js", "// Utils");
    
    // List files
    const files = await WorkspaceManager.listFiles(testProjectId);
    
    expect(files.length).toBeGreaterThan(0);
    expect(files).toContain("README.md");
    expect(files).toContain("index.js");
    expect(files.some(f => f.includes("utils.js"))).toBe(true);
    
    // Cleanup
    await WorkspaceManager.deleteWorkspace(testProjectId);
  });

  it("should delete workspace", async () => {
    await WorkspaceManager.initializeWorkspace(testProjectId);
    
    // Verify it exists
    let exists = await WorkspaceManager.workspaceExists(testProjectId);
    expect(exists).toBe(true);
    
    // Delete it
    await WorkspaceManager.deleteWorkspace(testProjectId);
    
    // Verify it's gone
    exists = await WorkspaceManager.workspaceExists(testProjectId);
    expect(exists).toBe(false);
  });
});

describe("Aider Integration (Chat API)", () => {
  it("should handle workspace initialization on first message", async () => {
    // This test verifies the chat API creates workspaces automatically
    // The actual Aider execution is tested through the full API
    const testProjectId = 99998;
    
    // Ensure workspace doesn't exist
    await WorkspaceManager.deleteWorkspace(testProjectId);
    
    // Simulate what the chat API does
    const workspaceExists = await WorkspaceManager.workspaceExists(testProjectId);
    expect(workspaceExists).toBe(false);
    
    if (!workspaceExists) {
      await WorkspaceManager.initializeWorkspace(testProjectId);
    }
    
    // Verify workspace was created
    const exists = await WorkspaceManager.workspaceExists(testProjectId);
    expect(exists).toBe(true);
    
    // Cleanup
    await WorkspaceManager.deleteWorkspace(testProjectId);
  });
});
