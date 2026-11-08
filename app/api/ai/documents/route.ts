import { createServiceClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const MAX_STORED_CHARS = 60000;

function bad(status: number, code: string, message: string) {
  return Response.json({ error: code, message }, { status });
}

async function extractText(filename: string, mime: string, buffer: Buffer): Promise<string> {
  const ext = filename.toLowerCase().split('.').pop() ?? '';
  if (ext === 'txt' || mime === 'text/plain') {
    return buffer.toString('utf-8');
  }
  if (ext === 'pdf' || mime === 'application/pdf') {
    const { extractText } = await import('unpdf');
    const result = await extractText(new Uint8Array(buffer), { mergePages: true });
    return result.text;
  }
  if (ext === 'docx' || mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const mammoth = (await import('mammoth')).default;
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  throw new Error('unsupported_type');
}

function extensionOf(name: string) {
  return (name.toLowerCase().split('.').pop() ?? '').trim();
}

/** Upload a document (PDF/TXT/DOCX), extract text, store privately for the owner. */
export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return bad(400, 'bad_request', 'Expected multipart form data with the file.');
  }
  const ownerToken = String(form.get('ownerToken') ?? '').trim();
  const file = form.get('file');
  if (!ownerToken) return bad(400, 'owner_token_required', 'ownerToken is required.');
  if (!(file instanceof File)) return bad(400, 'file_required', 'Attach a file in the "file" field.');

  let supabase;
  try {
    supabase = createServiceClient();
  } catch {
    return bad(500, 'server_not_configured', 'Server is missing SUPABASE_SERVICE_ROLE_KEY.');
  }

  const { data: aiRow } = await supabase.from('ai_settings').select('allowed_uploads').eq('id', 1).maybeSingle();
  const allowed: string[] = (aiRow?.allowed_uploads as string[] | null) ?? ['pdf', 'txt', 'docx'];
  const ext = extensionOf(file.name);
  if (!allowed.includes(ext)) {
    return bad(415, 'unsupported_type', `Supported upload formats: ${allowed.map((f) => f.toUpperCase()).join(', ')}.`);
  }
  if (file.size === 0) return bad(400, 'empty_file', 'The uploaded file is empty.');
  if (file.size > MAX_BYTES) return bad(413, 'file_too_large', 'Files are limited to 8 MB.');

  const buffer = Buffer.from(await file.arrayBuffer());
  let text: string;
  try {
    text = await extractText(file.name, file.type, buffer);
  } catch (err) {
    console.error('[documents] extraction failed:', err);
    return bad(422, 'extraction_failed', 'Could not extract text from that file. Ensure it is a valid PDF, TXT or DOCX document.');
  }
  const cleaned = text.replace(/\0/g, '').trim();
  if (cleaned.length < 20) {
    return bad(422, 'extraction_empty', 'That file contains almost no readable text (it may be a scanned image PDF).');
  }

  const { data: inserted, error } = await supabase
    .from('knowledge_documents')
    .insert({
      owner_token: ownerToken,
      name: file.name.slice(0, 200),
      mime: file.type || null,
      size_bytes: file.size,
      extracted_text: cleaned.slice(0, MAX_STORED_CHARS),
    })
    .select('id, name, mime, size_bytes, created_at')
    .single();
  if (error || !inserted) {
    console.error('[documents] insert failed:', error);
    return bad(500, 'store_failed', 'Could not save the document. Please try again.');
  }

  // Best-effort private storage of the original file (not public; service role only)
  try {
    const path = `${ownerToken}/${inserted.id}-${file.name.replace(/[^\w.\-]+/g, '_').slice(0, 80)}`;
    await supabase.storage.from('documents').upload(path, buffer, { contentType: file.type || 'application/octet-stream', upsert: false });
  } catch (err) {
    console.error('[documents] storage upload failed (text kept):', err);
  }

  return Response.json({
    ok: true,
    document: { ...inserted, chars: cleaned.length, preview: cleaned.slice(0, 400) },
  });
}

/** List documents owned by this browser token. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ownerToken = searchParams.get('ownerToken')?.trim();
  if (!ownerToken) return bad(400, 'owner_token_required', 'ownerToken is required.');
  let supabase;
  try {
    supabase = createServiceClient();
  } catch {
    return bad(500, 'server_not_configured', 'Server is missing SUPABASE_SERVICE_ROLE_KEY.');
  }
  const { data } = await supabase
    .from('knowledge_documents')
    .select('id, name, mime, size_bytes, created_at')
    .eq('owner_token', ownerToken)
    .order('created_at', { ascending: false })
    .limit(20);
  return Response.json({ documents: data ?? [] });
}

/** Delete a document owned by this browser token. */
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const ownerToken = searchParams.get('ownerToken')?.trim();
  const documentId = searchParams.get('documentId')?.trim();
  if (!ownerToken || !documentId) return bad(400, 'bad_request', 'ownerToken and documentId are required.');
  let supabase;
  try {
    supabase = createServiceClient();
  } catch {
    return bad(500, 'server_not_configured', 'Server is missing SUPABASE_SERVICE_ROLE_KEY.');
  }
  const { data: doc } = await supabase.from('knowledge_documents').select('id').eq('id', documentId).eq('owner_token', ownerToken).maybeSingle();
  if (!doc) return bad(404, 'document_not_found', 'Document not found.');
  await supabase.from('knowledge_documents').delete().eq('id', documentId).eq('owner_token', ownerToken);
  // Best-effort purge of the stored original
  try {
    const { data: files } = await supabase.storage.from('documents').list(ownerToken, { limit: 100 });
    const mine = (files ?? []).filter((f) => f.name.startsWith(`${documentId}-`)).map((f) => `${ownerToken}/${f.name}`);
    if (mine.length) await supabase.storage.from('documents').remove(mine);
  } catch (err) {
    console.error('[documents] storage purge failed:', err);
  }
  return Response.json({ ok: true });
}
