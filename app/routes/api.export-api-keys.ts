import type { LoaderFunction } from '@remix-run/cloudflare';

/**
 * API key export is disabled for security reasons.
 * API keys are managed server-side only for monetization purposes.
 */
export const loader: LoaderFunction = async () => {
  // Return empty object - API keys are not exposed to clients
  return Response.json({}, { status: 403 });
};
