import { describe, expect, it } from "vitest";

describe("Gemini API Integration", () => {
  it("should have Gemini API key configured", () => {
    expect(process.env.GEMINI_API_KEY).toBeDefined();
    expect(process.env.GEMINI_API_KEY).not.toBe("");
  });

  it("should validate Gemini API key format", () => {
    const apiKey = process.env.GEMINI_API_KEY;
    expect(apiKey).toBeDefined();
    
    // Google API keys typically start with "AIza"
    expect(apiKey!.startsWith("AIza")).toBe(true);
    
    // Should be at least 39 characters long
    expect(apiKey!.length).toBeGreaterThanOrEqual(39);
  });

  it("should have Gemini model in available models", async () => {
    const { AVAILABLE_MODELS } = await import("../shared/models");
    
    expect(AVAILABLE_MODELS["gemini-2.0-flash-exp"]).toBeDefined();
    expect(AVAILABLE_MODELS["gemini-2.0-flash-exp"]!.provider).toBe("google");
    expect(AVAILABLE_MODELS["gemini-2.0-flash-exp"]!.tokenCost).toBe(1);
  });

  it("should mark Gemini as available for free users", async () => {
    const { AVAILABLE_MODELS, canUseModel } = await import("../shared/models");
    
    expect(AVAILABLE_MODELS["gemini-2.0-flash-exp"]!.availableForFree).toBe(true);
    expect(canUseModel("free", "gemini-2.0-flash-exp")).toBe(true);
  });

  it.skip("should test Gemini API connectivity (skipped - waiting for quota reset)", async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    expect(apiKey).toBeDefined();

    // Simple test: Make a basic request to Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "Say hello in one word",
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", response.status, errorText);
    }

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data).toHaveProperty("candidates");
    expect(data.candidates).toBeInstanceOf(Array);
    expect(data.candidates.length).toBeGreaterThan(0);
  }, 10000); // 10 second timeout for API call
});
