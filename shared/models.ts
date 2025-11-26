/**
 * AI Model configurations for Stackbird
 * Shared between frontend and backend
 */

export interface AIModel {
  id: string;
  name: string;
  provider: "deepseek" | "openai" | "anthropic" | "google";
  aiderModelName: string; // The exact model name that Aider CLI expects
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
    aiderModelName: "deepseek/deepseek-chat",
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
    aiderModelName: "gpt-4o-mini",
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
    aiderModelName: "claude-3-5-sonnet-20241022",
    tokenCost: 3,
    tier: "balanced",
    features: ["Best for coding", "Balanced performance", "Popular choice"],
    description: "The most popular choice for code generation and complex tasks",
    recommended: true,
    badge: "BEST",
    availableForFree: true, // Available since we have API key configured
  },
  
  "claude-opus-4.5": {
    id: "claude-opus-4.5",
    name: "Claude Opus 4.5",
    provider: "anthropic",
    aiderModelName: "claude-3-opus-20240229",
    tokenCost: 10,
    tier: "premium",
    features: ["Best in class", "Maximum quality", "Complex projects"],
    description: "Anthropic's most powerful model, best in the world for coding (released Nov 2025)",
    badge: "NEW",
  },
  
  "gemini-2.0-flash-exp": {
    id: "gemini-2.0-flash-exp",
    name: "Gemini 2.0 Flash",
    provider: "google",
    aiderModelName: "gemini/gemini-2.0-flash-exp",
    tokenCost: 1,
    tier: "budget",
    features: ["Fast", "Multimodal", "Google quality"],
    description: "Google's latest flash model with excellent speed and quality",
    availableForFree: true,
  },
  
  "claude-3-5-haiku-20241022": {
    id: "claude-3-5-haiku-20241022",
    name: "Claude 3.5 Haiku",
    provider: "anthropic",
    aiderModelName: "claude-3-5-haiku-20241022",
    tokenCost: 0.5,
    tier: "ultra-budget",
    features: ["Ultra fast", "Cost effective", "Smart responses"],
    description: "Anthropic's fastest model with impressive intelligence at lowest cost",
    availableForFree: true,
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
