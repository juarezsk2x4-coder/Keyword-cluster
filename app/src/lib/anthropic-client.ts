import Anthropic from "@anthropic-ai/sdk";

let clientInstance: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (clientInstance) return clientInstance;
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }
  // The SDK already retries connection errors/408/409/429/5xx internally
  // (default max_retries: 2) with exponential backoff — no custom retry
  // loop needed on top of that.
  clientInstance = new Anthropic();
  return clientInstance;
}

// Both AI call sites (nutrition estimation, weekly plan generation) route
// through this so a failure — including the SDK exhausting its own
// retries — leaves a trace in Vercel's function logs instead of vanishing
// the moment the error reaches the client as a plain string.
export function logAnthropicError(context: string, err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);
  const status = err instanceof Anthropic.APIError ? err.status : undefined;
  console.error(`[anthropic] ${context} failed${status ? ` (status ${status})` : ""}: ${message}`);
}
