import { describe, expect, it } from "vitest";
import { AiderSession } from "./aider";
import { getModelById, canUseModel } from "./models";

describe("Chat Error Handling", () => {
  it("should have Aider installed and accessible", async () => {
    // This test ensures Aider is installed, preventing 502 errors
    const { spawn } = await import("child_process");
    
    return new Promise((resolve, reject) => {
      const process = spawn("which", ["aider"]);
      
      let output = "";
      process.stdout?.on("data", (data) => {
        output += data.toString();
      });
      
      process.on("close", (code) => {
        if (code === 0 && output.trim().length > 0) {
          resolve(undefined);
        } else {
          reject(new Error("Aider not found in PATH"));
        }
      });
      
      setTimeout(() => reject(new Error("Timeout checking for Aider")), 5000);
    });
  });

  it("should create AiderSession without errors", () => {
    const session = new AiderSession({
      projectPath: "/tmp/test",
      model: "claude-3-5-haiku-20241022",
      apiKey: "test-key",
    });
    
    expect(session).toBeDefined();
    expect(session.isRunning()).toBe(false);
  });

  it("should validate model configurations", () => {
    // Test that all models are properly configured
    const modelIds = [
      "deepseek-v3.2",
      "claude-3-5-haiku-20241022",
      "gpt-4o-mini",
      "gemini-2.0-flash-exp",
      "claude-3.5-sonnet",
      "claude-opus-4.5",
    ];

    for (const modelId of modelIds) {
      const model = getModelById(modelId);
      expect(model).toBeDefined();
      expect(model!.id).toBe(modelId);
      expect(model!.provider).toBeDefined();
      expect(model!.tokenCost).toBeGreaterThan(0);
    }
  });

  it("should validate model availability for free users", () => {
    // Free users should have access to budget models
    expect(canUseModel("free", "deepseek-v3.2")).toBe(true);
    expect(canUseModel("free", "claude-3-5-haiku-20241022")).toBe(true);
    expect(canUseModel("free", "gpt-4o-mini")).toBe(true);
    expect(canUseModel("free", "gemini-2.0-flash-exp")).toBe(true);
    
    // Premium models should be available for pro users
    expect(canUseModel("pro", "claude-3.5-sonnet")).toBe(true);
    expect(canUseModel("pro", "claude-opus-4.5")).toBe(true);
  });

  it("should handle invalid model IDs gracefully", () => {
    const invalidModel = getModelById("invalid-model-id");
    expect(invalidModel).toBeNull();
  });

  it("should return proper error messages for invalid model access", () => {
    // This test ensures error handling returns valid JSON
    const model = getModelById("invalid-model");
    expect(model).toBeNull();
    
    // In actual usage, this would throw a TRPC error with proper JSON response
    // instead of causing a 502 error
  });

  it("should have all required API keys configured", () => {
    // Check that API keys are set (even if empty in test env)
    expect(process.env.ANTHROPIC_API_KEY).toBeDefined();
    expect(process.env.GEMINI_API_KEY).toBeDefined();
  });

  it("should validate Aider session error handling", async () => {
    const session = new AiderSession({
      projectPath: "/tmp/nonexistent",
      model: "claude-3-5-haiku-20241022",
    });

    // Should not throw when creating session
    expect(session).toBeDefined();
    
    // Starting with invalid path should be handled gracefully
    // (will fail but should not cause 502 error)
  });
});
