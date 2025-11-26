import { describe, expect, it } from "vitest";
import { AVAILABLE_MODELS, getModelById, getModelsForPlan, getDefaultModel, canUseModel } from "../shared/models";

describe("Model Selector - Model Configuration", () => {
  it("should have all 4 models configured", () => {
    const models = Object.keys(AVAILABLE_MODELS);
    expect(models).toHaveLength(4);
    expect(models).toContain("deepseek-v3.2");
    expect(models).toContain("gpt-4o-mini");
    expect(models).toContain("claude-3.5-sonnet");
    expect(models).toContain("claude-opus-4.5");
  });

  it("should have correct token costs for each model", () => {
    expect(AVAILABLE_MODELS["deepseek-v3.2"]!.tokenCost).toBe(0.5);
    expect(AVAILABLE_MODELS["gpt-4o-mini"]!.tokenCost).toBe(1);
    expect(AVAILABLE_MODELS["claude-3.5-sonnet"]!.tokenCost).toBe(3);
    expect(AVAILABLE_MODELS["claude-opus-4.5"]!.tokenCost).toBe(10);
  });

  it("should mark budget models as available for free users", () => {
    expect(AVAILABLE_MODELS["deepseek-v3.2"]!.availableForFree).toBe(true);
    expect(AVAILABLE_MODELS["gpt-4o-mini"]!.availableForFree).toBe(true);
    expect(AVAILABLE_MODELS["claude-3.5-sonnet"]!.availableForFree).toBeUndefined();
    expect(AVAILABLE_MODELS["claude-opus-4.5"]!.availableForFree).toBeUndefined();
  });

  it("should have badges for featured models", () => {
    expect(AVAILABLE_MODELS["gpt-4o-mini"]!.badge).toBe("POPULAR");
    expect(AVAILABLE_MODELS["claude-3.5-sonnet"]!.badge).toBe("BEST");
    expect(AVAILABLE_MODELS["claude-opus-4.5"]!.badge).toBe("NEW");
  });

  it("should have correct tiers for each model", () => {
    expect(AVAILABLE_MODELS["deepseek-v3.2"]!.tier).toBe("ultra-budget");
    expect(AVAILABLE_MODELS["gpt-4o-mini"]!.tier).toBe("budget");
    expect(AVAILABLE_MODELS["claude-3.5-sonnet"]!.tier).toBe("balanced");
    expect(AVAILABLE_MODELS["claude-opus-4.5"]!.tier).toBe("premium");
  });
});

describe("Model Selector - Helper Functions", () => {
  it("should get model by ID", () => {
    const model = getModelById("gpt-4o-mini");
    expect(model).toBeDefined();
    expect(model?.name).toBe("GPT-4o Mini");
    expect(model?.tokenCost).toBe(1);
  });

  it("should return null for invalid model ID", () => {
    const model = getModelById("invalid-model");
    expect(model).toBeNull();
  });

  it("should get models for free plan", () => {
    const models = getModelsForPlan("free");
    expect(models).toHaveLength(2);
    expect(models.map(m => m.id)).toContain("deepseek-v3.2");
    expect(models.map(m => m.id)).toContain("gpt-4o-mini");
  });

  it("should get all models for pro plan", () => {
    const models = getModelsForPlan("pro");
    expect(models).toHaveLength(4);
  });

  it("should get default model for free plan", () => {
    const model = getDefaultModel("free");
    expect(model.id).toBe("gpt-4o-mini");
  });

  it("should get default model for pro plan", () => {
    const model = getDefaultModel("pro");
    expect(model.id).toBe("claude-3.5-sonnet");
  });

  it("should check if free user can use budget models", () => {
    expect(canUseModel("free", "deepseek-v3.2")).toBe(true);
    expect(canUseModel("free", "gpt-4o-mini")).toBe(true);
  });

  it("should check if free user cannot use premium models", () => {
    expect(canUseModel("free", "claude-3.5-sonnet")).toBe(false);
    expect(canUseModel("free", "claude-opus-4.5")).toBe(false);
  });

  it("should check if pro user can use all models", () => {
    expect(canUseModel("pro", "deepseek-v3.2")).toBe(true);
    expect(canUseModel("pro", "gpt-4o-mini")).toBe(true);
    expect(canUseModel("pro", "claude-3.5-sonnet")).toBe(true);
    expect(canUseModel("pro", "claude-opus-4.5")).toBe(true);
  });
});

describe("Model Selector - Model Properties", () => {
  it("should have descriptions for all models", () => {
    Object.values(AVAILABLE_MODELS).forEach(model => {
      expect(model.description).toBeDefined();
      expect(model.description.length).toBeGreaterThan(0);
    });
  });

  it("should have features for all models", () => {
    Object.values(AVAILABLE_MODELS).forEach(model => {
      expect(model.features).toBeDefined();
      expect(model.features.length).toBeGreaterThan(0);
    });
  });

  it("should have valid providers for all models", () => {
    const validProviders = ["deepseek", "openai", "anthropic", "google"];
    Object.values(AVAILABLE_MODELS).forEach(model => {
      expect(validProviders).toContain(model.provider);
    });
  });

  it("should have Claude 3.5 Sonnet marked as recommended", () => {
    expect(AVAILABLE_MODELS["claude-3.5-sonnet"]!.recommended).toBe(true);
  });
});
