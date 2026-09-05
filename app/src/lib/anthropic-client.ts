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
  //
  // Its default `timeout` is 10 minutes, which is longer than any
  // serverless function is likely to be allowed to run (this project has
  // no `maxDuration` configured anywhere, so it's on whatever the Vercel
  // plan's default is — commonly well under 10 minutes). Without an
  // explicit timeout, a stalled request doesn't fail with the app's own
  // error handling (isAiEnabled()-gated try/catch in actions.ts) — the
  // platform kills the function first and the user sees an opaque error
  // instead of the "AI unavailable" messaging the UI is built to show.
  // 120s is a deliberate middle ground: short enough that a real hang
  // fails with a clear error well before any plausible platform limit,
  // long enough not to cut off the weekly-plan generation's real
  // multi-thousand-token streamed output in the common case.
  clientInstance = new Anthropic({ timeout: 120_000 });
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
