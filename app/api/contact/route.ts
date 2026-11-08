import { NextRequest } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Best-effort in-memory throttle (per server instance)
const hits = new Map<string, number[]>();

function throttled(ip: string, limit = 5, windowMs = 10 * 60 * 1000): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= limit) {
    hits.set(ip, list);
    return true;
  }
  list.push(now);
  hits.set(ip, list);
  return false;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  // Honeypot — bots fill hidden fields, humans don't
  if (String(body.company ?? '').trim() !== '') {
    return Response.json({ ok: true });
  }

  const name = String(body.name ?? '').trim().slice(0, 120);
  const email = String(body.email ?? '').trim().slice(0, 180);
  const subject = String(body.subject ?? '').trim().slice(0, 200);
  const message = String(body.message ?? '').trim().slice(0, 5000);

  if (name.length < 2 || !EMAIL_RE.test(email) || message.length < 10) {
    return Response.json(
      { code: 'invalid', message: 'Please provide a valid name, email and a message of at least 10 characters.' },
      { status: 400 }
    );
  }

  const ip = (req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown').split(',')[0].trim();
  if (throttled(ip)) {
    return Response.json({ code: 'rate_limited', message: 'Too many messages from this network. Please try again later.' }, { status: 429 });
  }

  const sb = getAdminSupabase();
  if (!sb) {
    return Response.json({ code: 'db_unavailable', message: 'The contact service is not configured. Please email yadlapallif@gmail.com directly.' }, { status: 503 });
  }

  const { error } = await sb.from('contact_messages').insert({ name, email, subject: subject || null, message });
  if (error) {
    console.error('[contact] insert failed:', error);
    return Response.json({ code: 'db_error', message: 'Could not store your message. Please email yadlapallif@gmail.com directly.' }, { status: 500 });
  }
  return Response.json({ ok: true });
}
