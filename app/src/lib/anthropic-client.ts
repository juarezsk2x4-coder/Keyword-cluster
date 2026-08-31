import Anthropic from "@anthropic-ai/sdk";

let clientInstance: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (clientInstance) return clientInstance;
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }
  clientInstance = new Anthropic();
  return clientInstance;
}
