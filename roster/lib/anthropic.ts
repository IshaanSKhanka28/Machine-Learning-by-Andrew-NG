import Anthropic from "@anthropic-ai/sdk";

export const MODEL = "claude-sonnet-4-6";

let client: Anthropic | null = null;

export function getClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  if (!client) {
    client = new Anthropic({ apiKey });
  }
  return client;
}

export function hasLiveModel(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}
