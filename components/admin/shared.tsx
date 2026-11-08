'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/browser';
import { cn } from '@/lib/cn';
import {
  Plus, Trash2, ChevronUp, ChevronDown, Loader2, Save, X, Upload, GripVertical,
} from 'lucide-react';

export const INPUT =
  'w-full rounded-xl border border-navy/12 bg-white px-3.5 py-2.5 text-[13px] text-ink outline-none transition placeholder:text-ink/40 focus:border-electric focus:ring-2 focus:ring-electric/20';

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-navy/60">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[10.5px] leading-4 text-ink/45">{hint}</span>}
    </label>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label ?? 'toggle'} onClick={() => onChange(!checked)}
      className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', checked ? 'bg-electric' : 'bg-navy/15')}>
      <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', checked ? 'left-[22px]' : 'left-0.5')} />
    </button>
  );
}

export function PanelCard({ title, description, children, actions }: { title: string; description?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="rounded-3xl border border-navy/10 bg-white p-6 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-navy">{title}</h2>
          {description && <p className="mt-1 max-w-2xl text-[12px] leading-5 text-ink/55">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

/* ─── Generic table CRUD list editor ─────────────────────────────────────── */

export type FieldType = 'text' | 'textarea' | 'number' | 'boolean' | 'tags' | 'select';
export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  placeholder?: string;
  rows?: number;
}

export interface Row {
  id: string;
  display_order?: number;
  visible?: boolean;
  [key: string]: unknown;
}

export function useSupabaseTable(table: string) {
  const supabase = getBrowserSupabase();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from(table).select('*').order('display_order', { ascending: true });
    if (error) setError(error.message);
    else setRows((data as Row[]) ?? []);
    setLoading(false);
  }, [supabase, table]);

  useEffect(() => { void load(); }, [load]);

  const upsert = async (row: Row) => {
    setSaving(row.id);
    setError(null);
    const payload = { ...row };
    delete (payload as { created_at?: string }).created_at;
    const { error } = await supabase.from(table).upsert(payload);
    if (error) setError(error.message);
    setSaving(null);
    return !error;
  };

  const insert = async (row: Partial<Row>) => {
    setError(null);
    const { data, error } = await supabase.from(table).insert(row).select().single();
    if (error) { setError(error.message); return null; }
    const created = data as Row;
    setRows((prev) => [...prev, created]);
    return created;
  };

  const remove = async (id: string) => {
    setError(null);
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) { setError(error.message); return false; }
    setRows((prev) => prev.filter((r) => r.id !== id));
    return true;
  };

  const move = async (id: string, dir: -1 | 1) => {
    const index = rows.findIndex((r) => r.id === id);
    const swapIndex = index + dir;
    if (index < 0 || swapIndex < 0 || swapIndex >= rows.length) return;
    const a = rows[index];
    const b = rows[swapIndex];
    const aOrder = a.display_order ?? index;
    const bOrder = b.display_order ?? swapIndex;
    const next = rows.map((r) => (r.id === a.id ? { ...r, display_order: bOrder } : r.id === b.id ? { ...r, display_order: aOrder } : r));
    next.sort((x, y) => (x.display_order ?? 0) - (y.display_order ?? 0));
    setRows(next);
    await supabase.from(table).update({ display_order: bOrder }).eq('id', a.id);
    await supabase.from(table).update({ display_order: aOrder }).eq('id', b.id);
  };

  return { rows, setRows, loading, saving, error, upsert, insert, remove, move, reload: load };
}

export function tagsToString(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ');
  return typeof value === 'string' ? value : '';
}

export function stringToTags(value: string): string[] {
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}

export function EntityEditor({
  table,
  fields,
  defaults,
  addLabel,
}: {
  table: string;
  fields: FieldDef[];
  defaults: Partial<Row>;
  addLabel: string;
}) {
  const { rows, setRows, loading, saving, error, upsert, insert, remove, move } = useSupabaseTable(table);
  const [dirty, setDirty] = useState<Record<string, Row>>({});
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState<string | null>(null);

  const patch = (row: Row, key: string, value: unknown) => {
    const base = dirty[row.id] ?? row;
    const next = { ...base, [key]: value };
    setRows((prev) => prev.map((r) => (r.id === row.id ? next : r)));
    setDirty((prev) => ({ ...prev, [row.id]: next }));
  };

  const save = async (row: Row) => {
    const ok = await upsert(row);
    if (ok) {
      setDirty((prev) => { const n = { ...prev }; delete n[row.id]; return n; });
      setSavedFlash(row.id);
      window.setTimeout(() => setSavedFlash(null), 1600);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center gap-2 py-16 text-navy/60"><Loader2 size={18} className="animate-spin" /> Loading…</div>;
  }

  return (
    <div>
      {error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-medium text-red-700">{error}</p>}
      <div className="space-y-4">
        {rows.map((row, index) => (
          <div key={row.id} className="rounded-2xl border border-navy/10 bg-mist/60 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-ink/35">
                <GripVertical size={15} />
                <span className="font-mono text-[10px] uppercase tracking-widest">#{index + 1}</span>
                <button onClick={() => move(row.id, -1)} className="rounded-md p-1.5 hover:bg-white hover:text-navy" aria-label="Move up"><ChevronUp size={14} /></button>
                <button onClick={() => move(row.id, 1)} className="rounded-md p-1.5 hover:bg-white hover:text-navy" aria-label="Move down"><ChevronDown size={14} /></button>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ink/50" title="Visible on the site">
                  <Toggle checked={row.visible !== false} onChange={(v) => patch(row, 'visible', v)} label="Visible on site" />
                </label>
                {dirty[row.id] && (
                  <button onClick={() => save(dirty[row.id])} className="flex items-center gap-1.5 rounded-lg bg-electric px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-[#1d4fd7]">
                    {saving === row.id ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />} Save
                  </button>
                )}
                {savedFlash === row.id && <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Saved</span>}
                {confirmId === row.id ? (
                  <button onClick={() => { void remove(row.id); setConfirmId(null); }} className="rounded-lg bg-red-600 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white">Confirm delete</button>
                ) : (
                  <button onClick={() => setConfirmId(row.id)} className="rounded-lg p-2 text-ink/40 transition hover:bg-white hover:text-red-600" aria-label="Delete row"><Trash2 size={15} /></button>
                )}
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {fields.map((field) => {
                const value = row[field.key];
                const full = field.type === 'textarea' || field.type === 'tags';
                return (
                  <div key={field.key} className={full ? 'sm:col-span-2' : ''}>
                    <Field label={field.label}>
                      {field.type === 'textarea' && (
                        <textarea rows={field.rows ?? 3} className={cn(INPUT, 'leading-6')} placeholder={field.placeholder} value={typeof value === 'string' ? value : ''} onChange={(e) => patch(row, field.key, e.target.value)} />
                      )}
                      {field.type === 'text' && (
                        <input className={INPUT} placeholder={field.placeholder} value={typeof value === 'string' ? value : ''} onChange={(e) => patch(row, field.key, e.target.value)} />
                      )}
                      {field.type === 'number' && (
                        <input type="number" className={INPUT} value={typeof value === 'number' ? value : 0} onChange={(e) => patch(row, field.key, Number(e.target.value))} />
                      )}
                      {field.type === 'tags' && (
                        <input className={INPUT} placeholder={field.placeholder ?? 'Comma separated'} value={tagsToString(value)} onChange={(e) => patch(row, field.key, stringToTags(e.target.value))} />
                      )}
                      {field.type === 'select' && (
                        <select className={INPUT} value={typeof value === 'string' ? value : ''} onChange={(e) => patch(row, field.key, e.target.value)}>
                          {(field.options ?? []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      )}
                      {field.type === 'boolean' && (
                        <Toggle checked={value === true} onChange={(v) => patch(row, field.key, v)} label={field.label} />
                      )}
                    </Field>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => insert({ ...defaults, display_order: rows.length + 1, visible: true })}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-navy/25 px-4 py-4 text-[11px] font-bold uppercase tracking-[0.25em] text-navy/60 transition hover:border-electric hover:text-electric"
      >
        <Plus size={15} /> {addLabel}
      </button>
    </div>
  );
}

/* ─── Image upload helper (Supabase storage, RLS: admin only) ────────────── */

export function useMediaUpload(bucket: string) {
  const supabase = getBrowserSupabase();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File, folder = 'uploads'): Promise<string | null> => {
    setUploading(true);
    setError(null);
    try {
      const safe = file.name.replace(/[^\w.\-]/g, '_').slice(-80);
      const path = `${folder}/${Date.now()}-${safe}`;
      const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, { cacheControl: '31536000', upsert: false });
      if (upErr) throw upErr;
      if (bucket === 'documents' || bucket === 'resume') {
        // resume is public bucket; documents handled server-side
      }
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading, error, UploadIcon: Upload, closeError: () => setError(null) };
}

export function UploadButton({ bucket, folder, accept, label, onUploaded }: { bucket: string; folder?: string; accept: string; label: string; onUploaded: (url: string) => void }) {
  const { upload, uploading, error } = useMediaUpload(bucket);
  return (
    <div>
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-electric/40 bg-skylight px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-navy transition hover:bg-electric hover:text-white">
        {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} {label}
        <input type="file" accept={accept} className="hidden" onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const url = await upload(file, folder);
          if (url) onUploaded(url);
          e.target.value = '';
        }} />
      </label>
      {error && <p className="mt-2 text-[11px] text-red-600">{error}</p>}
    </div>
  );
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-navy">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-2 text-ink/50 hover:bg-mist" aria-label="Close"><X size={16} /></button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
