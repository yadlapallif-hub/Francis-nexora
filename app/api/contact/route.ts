import { createServiceClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const hourlyBuckets = new Map<string, number[]>();
const HOURLY_LIMIT = 5;

function rateLimited(key: string): boolean {
  const now = Date.now();
  const windowStart = now - 60 * 60 * 1000;
  const hits = (hourlyBuckets.get(key) ?? []).filter((t) => t > windowStart);
  if (hits.length >= HOURLY_LIMIT) {
    hourlyBuckets.set(key, hits);
    return true;
  }
  hits.push(now);
  hourlyBuckets.set(key, hits);
  return false;
}

export async function POST(req: Request) {
  let body: { name?: string; email?: string; subject?: string; message?: string; website?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'bad_request', message: 'The request body was not valid JSON.' }, { status: 400 });
  }

  const name = (body.name ?? '').trim().slice(0, 120);
  const email = (body.email ?? '').trim().slice(0, 200);
  const subject = (body.subject ?? '').trim().slice(0, 200);
  const message = (body.message ?? '').trim().slice(0, 5000);
  const honeypot = (body.website ?? '').trim();

  // Honeypot: silently accept to avoid tipping off bots, but store nothing.
  if (honeypot) return Response.json({ ok: true });

  if (!name) return Response.json({ error: 'name_required', message: 'Please tell me your name.' }, { status: 400 });
  if (!EMAIL_RE.test(email)) return Response.json({ error: 'email_invalid', message: 'Please enter a valid email address.' }, { status: 400 });
  if (message.length < 10) return Response.json({ error: 'message_too_short', message: 'Please write a message of at least 10 characters.' }, { status: 400 });

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (rateLimited(ip)) {
    return Response.json({ error: 'rate_limited', message: 'Too many messages from this network. Please try again later or use email/WhatsApp directly.' }, { status: 429 });
  }

  let supabase;
  try {
    supabase = createServiceClient();
  } catch {
    return Response.json(
      { error: 'server_not_configured', message: 'The contact service is not configured on this deployment yet. Please reach Francis directly by email.' },
      { status: 500 },
    );
  }

  const { error } = await supabase.from('contact_messages').insert({ name, email, subject: subject || null, message });
  if (error) {
    console.error('[contact] insert failed:', error);
    return Response.json({ error: 'store_failed', message: 'Could not save your message right now. Please try again or email Francis directly.' }, { status: 500 });
  }
  return Response.json({ ok: true });
}
