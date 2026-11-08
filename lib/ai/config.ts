import 'server-only';

export type AiEnvConfig = {
  apiKey: string | null;
  baseUrl: string;
  modelOverride: string | null;
  providerLabel: string;
  searchKey: string | null;
};

/** Resolve AI provider configuration from server environment only. */
export function getAiEnv(): AiEnvConfig {
  const apiKey =
    process.env.AI_API_KEY || process.env.OPENAI_API_KEY || process.env.AIML_API_KEY || null;
  const baseUrl = (
    process.env.AI_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    'https://api.openai.com/v1'
  ).replace(/\/+$/, '');
  const modelOverride = process.env.AI_MODEL || process.env.OPENAI_MODEL || null;
  return {
    apiKey,
    baseUrl,
    modelOverride,
    providerLabel: process.env.AI_PROVIDER_LABEL || 'OpenAI-compatible',
    searchKey: process.env.SERPER_API_KEY || null,
  };
}

/** Whether a chat completion upstream is reachable at all (key present). */
export function isAiConfigured(): boolean {
  return Boolean(getAiEnv().apiKey);
}
