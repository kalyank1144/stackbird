/**
 * AI Model configurations for Stackbird
 * Each model has a token cost that determines how many tokens are deducted per message
 */

export interface AIModel {
  id: string;
  name: string;
  provider: "deepseek" | "openai" | "anthropic" | "google";
  tokenCost: number; // How many tokens this model costs per message
  tier: "ultra-budget" | "budget" | "balanced" | "premium";
  features: string[];
  description: string;
  recommended?: boolean;
  badge?: "NEW" | "POPULAR" | "BEST";
  availableForFree?: boolean; // Can free users access this model?
}

export const AVAILABLE_MODELS: Record<string, AIModel> = {
  "deepseek-v3.2": {
    id: "deepseek-v3.2",
    name: "DeepSeek V3.2",
    provider: "deepseek",
    tokenCost: 0.5,
    tier: "ultra-budget",
    features: ["Fast", "Ultra-cheap", "Good for simple tasks"],
    description: "Open-source model, perfect for quick questions and simple coding tasks",
    availableForFree: true,
  },
  
  "gpt-4o-mini": {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    tokenCost: 1,
    tier: "budget",
    features: ["Fast", "Reliable", "OpenAI quality"],
    description: "Fast and reliable model for everyday coding tasks",
    badge: "POPULAR",
    availableForFree: true,
  },
  
  "claude-3.5-sonnet": {
    id: "claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    tokenCost: 3,
    tier: "balanced",
    features: ["Best for coding", "Balanced performance", "Popular choice"],
    description: "The most popular choice for code generation and complex tasks",
    recommended: true,
    badge: "BEST",
  },
  
  "claude-opus-4.5": {
    id: "claude-opus-4.5",
    name: "Claude Opus 4.5",
    provider: "anthropic",
    tokenCost: 10,
    tier: "premium",
    features: ["Best in class", "Maximum quality", "Complex projects"],
    description: "Anthropic's most powerful model, best in the world for coding (released Nov 2025)",
    badge: "NEW",
  },
};

/**
 * Get model by ID
 */
export function getModelById(modelId: string): AIModel | null {
  return AVAILABLE_MODELS[modelId] || null;
}

/**
 * Get all models available for a plan
 */
export function getModelsForPlan(plan: "free" | "pro"): AIModel[] {
  const models = Object.values(AVAILABLE_MODELS);
  
  if (plan === "free") {
    return models.filter(m => m.availableForFree);
  }
  
  return models; // Pro gets all models
}

/**
 * Get default model for a plan
 */
export function getDefaultModel(plan: "free" | "pro"): AIModel {
  if (plan === "free") {
    return AVAILABLE_MODELS["gpt-4o-mini"]!;
  }
  
  // Pro users get Claude Sonnet as default (best for coding)
  return AVAILABLE_MODELS["claude-3.5-sonnet"]!;
}

/**
 * Check if user can use a model based on their plan
 */
export function canUseModel(plan: "free" | "pro", modelId: string): boolean {
  const model = getModelById(modelId);
  if (!model) return false;
  
  if (plan === "free") {
    return model.availableForFree === true;
  }
  
  return true; // Pro can use all models
}
