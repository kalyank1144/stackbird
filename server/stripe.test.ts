import { describe, expect, it } from "vitest";
import Stripe from "stripe";

describe("Stripe API Key Validation", () => {
  it("should validate Stripe secret key", async () => {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    expect(stripeSecretKey).toBeDefined();
    expect(stripeSecretKey).toMatch(/^sk_/);
    
    // Test actual API connection
    const stripe = new Stripe(stripeSecretKey!, {
      apiVersion: "2025-01-27.acacia",
    });
    
    // Make a lightweight API call to verify the key works
    const account = await stripe.account.retrieve();
    expect(account).toBeDefined();
    expect(account.id).toBeDefined();
  });

  it("should validate Stripe price IDs exist", () => {
    const monthlyPriceId = process.env.STRIPE_PRICE_ID_MONTHLY;
    const yearlyPriceId = process.env.STRIPE_PRICE_ID_YEARLY;
    
    expect(monthlyPriceId).toBeDefined();
    expect(monthlyPriceId).toMatch(/^price_/);
    
    expect(yearlyPriceId).toBeDefined();
    expect(yearlyPriceId).toMatch(/^price_/);
  });

  it("should validate webhook secret", () => {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    expect(webhookSecret).toBeDefined();
    expect(webhookSecret).toMatch(/^whsec_/);
  });
});
