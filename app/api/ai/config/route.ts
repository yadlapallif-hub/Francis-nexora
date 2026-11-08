import { createServiceClient } from '@/lib/supabase/admin';
import { getAiEnv } from '@/lib/ai/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Public, secret-free AI configuration for the chat UI. */
export async function GET() {
  const env = getAiEnv();
  let ai = {
    enabled: true,
    welcomeMessage:
      "Hi — I'm FRANCIS AI, your intelligent digital assistant. Ask me anything: programming, science, research, writing, learning — or explore Francis and this platform. I can also read documents you upload (PDF, TXT, DOCX).",
    allowedUploads: ['pdf', 'txt', 'docx'],
    model: 'gpt-4o-mini',
  };
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('ai_settings')
      .select('enabled, welcome_message, allowed_uploads, model, web_search')
      .eq('id', 1)
      .maybeSingle();
    if (data) {
      ai = {
        enabled: data.enabled as boolean,
        welcomeMessage: (data.welcome_message as string) || ai.welcomeMessage,
        allowedUploads: (data.allowed_uploads as string[]) || ai.allowedUploads,
        model: (data.model as string) || ai.model,
      };
    }
  } catch {
    // fall through to defaults
  }
  return Response.json({
    enabled: ai.enabled,
    welcomeMessage: ai.welcomeMessage,
    allowedUploads: ai.allowedUploads,
    modelLabel: env.modelOverride || ai.model,
    providerConfigured: Boolean(env.apiKey),
  });
}
