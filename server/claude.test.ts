import { describe, expect, it } from "vitest";

describe("Claude API Integration", () => {
  it("should have Claude API key configured", () => {
    expect(process.env.ANTHROPIC_API_KEY).toBeDefined();
    expect(process.env.ANTHROPIC_API_KEY).not.toBe("");
  });

  it("should validate Claude API key format", () => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    expect(apiKey).toBeDefined();
    
    // Anthropic API keys start with "sk-ant-"
    expect(apiKey!.startsWith("sk-ant-")).toBe(true);
    
    // Should be reasonably long
    expect(apiKey!.length).toBeGreaterThan(50);
  });

  it("should have Claude models in available models", async () => {
    const { AVAILABLE_MODELS } = await import("../shared/models");
    
    // Check Haiku
    expect(AVAILABLE_MODELS["claude-3-5-haiku-20241022"]).toBeDefined();
    expect(AVAILABLE_MODELS["claude-3-5-haiku-20241022"]!.provider).toBe("anthropic");
    
    // Check Sonnet
    expect(AVAILABLE_MODELS["claude-3.5-sonnet"]).toBeDefined();
    expect(AVAILABLE_MODELS["claude-3.5-sonnet"]!.provider).toBe("anthropic");
    
    // Check Opus
    expect(AVAILABLE_MODELS["claude-opus-4.5"]).toBeDefined();
    expect(AVAILABLE_MODELS["claude-opus-4.5"]!.provider).toBe("anthropic");
  });

  it("should mark Claude Haiku as available for free users", async () => {
    const { AVAILABLE_MODELS, canUseModel } = await import("../shared/models");
    
    expect(AVAILABLE_MODELS["claude-3-5-haiku-20241022"]!.availableForFree).toBe(true);
    expect(canUseModel("free", "claude-3-5-haiku-20241022")).toBe(true);
  });

  it("should test Claude API connectivity", async () => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    expect(apiKey).toBeDefined();

    // Simple test: Make a basic request to Claude API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 10,
        messages: [
          {
            role: "user",
            content: "Say hello in one word",
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Claude API Error:", response.status, errorText);
    }

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data).toHaveProperty("content");
    expect(data.content).toBeInstanceOf(Array);
    expect(data.content.length).toBeGreaterThan(0);
  }, 10000); // 10 second timeout for API call
});
