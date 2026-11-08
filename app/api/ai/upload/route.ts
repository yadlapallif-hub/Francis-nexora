import { NextRequest } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const TOKEN_RE = /^[A-Za-z0-9_-]{8,80}$/;
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const MAX_STORED_CHARS = 60_000;

const EXT_MAP: Record<string, { ext: string; mime: string }> = {
  pdf: { ext: 'pdf', mime: 'application/pdf' },
  txt: { ext: 'txt', mime: 'text/plain' },
  docx: { ext: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
};

function sniff(buffer: Buffer, kind: string): boolean {
  if (kind === 'pdf') return buffer.subarray(0, 5).toString('latin1') === '%PDF-';
  if (kind === 'docx') return buffer.subarray(0, 2).toString('latin1') === 'PK'; // zip container
  if (kind === 'txt') return true;
  return false;
}

async function extract(buffer: Buffer, kind: string): Promise<string> {
  if (kind === 'txt') return buffer.toString('utf-8');
  if (kind === 'pdf') {
    const { getDocumentProxy, extractText } = await import('unpdf');
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    return Array.isArray(text) ? text.join('\n') : String(text ?? '');
  }
  if (kind === 'docx') {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value ?? '';
  }
  return '';
}

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ code: 'bad_form', message: 'Expected multipart form data.' }, { status: 400 });
  }

  const owner = String(form.get('owner') ?? '');
  const file = form.get('file');
  if (!TOKEN_RE.test(owner)) {
    return Response.json({ code: 'bad_owner_token', message: 'Invalid owner token.' }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return Response.json({ code: 'no_file', message: 'No file was uploaded.' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ code: 'too_large', message: 'File exceeds the 8 MB limit.' }, { status: 413 });
  }

  const name = file.name.replace(/[^\w.\- ()[\]]/g, '_').slice(0, 140) || 'document';
  const ext = (name.split('.').pop() ?? '').toLowerCase();

  const sb = getAdminSupabase();
  if (!sb) {
    return Response.json({ code: 'db_unavailable', message: 'Document storage is not configured on the server.' }, { status: 503 });
  }

  const { data: settingsRow } = await sb.from('ai_settings').select('allowed_uploads, enabled').eq('id', 1).maybeSingle();
  const allowed: string[] = settingsRow?.allowed_uploads ?? ['pdf', 'txt', 'docx'];
  if (settingsRow && settingsRow.enabled === false) {
    return Response.json({ code: 'ai_disabled', message: 'FRANCIS AI is currently disabled by the platform administrator.' }, { status: 503 });
  }
  if (!EXT_MAP[ext] || !allowed.includes(ext)) {
    return Response.json(
      { code: 'unsupported_type', message: `Only ${allowed.join(', ').toUpperCase()} files are supported.` },
      { status: 415 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!sniff(buffer, ext)) {
    return Response.json({ code: 'bad_file', message: 'The file content does not match its extension.' }, { status: 415 });
  }

  let text: string;
  try {
    text = await extract(buffer, ext);
  } catch (error) {
    console.error('[upload] extraction failed:', error);
    return Response.json({ code: 'extract_failed', message: 'Could not read text from this file. It may be scanned images or corrupted.' }, { status: 422 });
  }

  text = text.replace(/\r\n/g, '\n').trim();
  if (text.length < 1) {
    return Response.json({ code: 'empty_document', message: 'No readable text was found in this document.' }, { status: 422 });
  }
  const stored = text.slice(0, MAX_STORED_CHARS);

  const { data: doc, error: insertError } = await sb
    .from('knowledge_documents')
    .insert({ owner_token: owner, name, mime: EXT_MAP[ext].mime, size_bytes: file.size, extracted_text: stored })
    .select('id')
    .single();
  if (insertError || !doc) {
    console.error('[upload] insert failed:', insertError);
    return Response.json({ code: 'db_error', message: 'Could not store the document.' }, { status: 500 });
  }

  // Best-effort: keep the original in the private `documents` bucket
  try {
    await sb.storage.from('documents').upload(`${owner}/${doc.id}-${name}`, buffer, {
      contentType: EXT_MAP[ext].mime,
      upsert: false,
    });
  } catch (error) {
    console.warn('[upload] original file not stored (extracted text still available):', error);
  }

  return Response.json({
    document: { id: doc.id, name, chars: stored.length, truncated: text.length > MAX_STORED_CHARS },
  });
}
