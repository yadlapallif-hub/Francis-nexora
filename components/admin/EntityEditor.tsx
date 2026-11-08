'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Plus, Trash2, Save, Eye, EyeOff, ArrowUp, ArrowDown, Upload, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from './toast';

export type FieldType =
  | 'text' | 'url' | 'textarea' | 'number' | 'boolean' | 'select'
  | 'stringArray' | 'image' | 'level' | 'email';

export type Field = {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  placeholder?: string;
  help?: string;
  span?: 1 | 2;
};

type Row = Record<string, unknown> & { id?: string };

function safeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.\-]+/g, '-').replace(/-+/g, '-').slice(0, 80);
}

function RowEditor({
  table, fields, row, onSaved, onDelete,
}: {
  table: string; fields: Field[]; row: Row; onSaved: () => void; onDelete: () => void;
}) {
  const supabase = createClient();
  const toast = useToast();
  const [draft, setDraft] = useState<Row>(row);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);

  const set = (key: string, value: unknown) => setDraft((d) => ({ ...d, [key]: value }));

  const upload = async (key: string, file: File) => {
    setUploading(true);
    try {
      const path = `francis/${crypto.randomUUID()}-${safeFileName(file.name)}`;
      const { error } = await supabase.storage.from('media').upload(path, file, { cacheControl: '3600', upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from('media').getPublicUrl(path);
      set(key, data.publicUrl);
      toast('Image uploaded — save the row to publish it.', 'ok');
    } catch (err) {
      toast(`Upload failed: ${err instanceof Error ? err.message : 'unknown error'}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const { id, ...payload } = draft;
      const { error } = id
        ? await supabase.from(table).update(payload).eq('id', id)
        : await supabase.from(table).insert(payload);
      if (error) throw error;
      toast('Saved. Changes are live on the site.', 'ok');
      onSaved();
    } catch (err) {
      toast(`Save failed: ${err instanceof Error ? err.message : 'unknown error'}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!draft.id) { onDelete(); return; }
    const { error } = await supabase.from(table).delete().eq('id', draft.id);
    if (error) {
      toast(`Delete failed: ${error.message}`, 'error');
      return;
    }
    toast('Deleted.', 'ok');
    onDelete();
  };

  const renderField = (field: Field) => {
    const value = draft[field.key];
    const base = 'w-full rounded-xl border border-navy/12 bg-white px-3.5 py-2.5 text-sm text-navy outline-none transition placeholder:text-ink/35 focus:border-electric focus:ring-2 focus:ring-electric/25';
    switch (field.type) {
      case 'textarea':
        return <textarea rows={3} className={base} value={String(value ?? '')} placeholder={field.placeholder} onChange={(e) => set(field.key, e.target.value)} />;
      case 'number':
        return <input type="number" className={base} value={Number(value ?? 0)} onChange={(e) => set(field.key, Number(e.target.value))} />;
      case 'email':
        return <input type="email" className={base} value={String(value ?? '')} placeholder={field.placeholder} onChange={(e) => set(field.key, e.target.value)} />;
      case 'url':
        return <input type="url" className={base} value={String(value ?? '')} placeholder={field.placeholder ?? 'https://'} onChange={(e) => set(field.key, e.target.value)} />;
      case 'select':
        return (
          <select className={base} value={String(value ?? '')} onChange={(e) => set(field.key, e.target.value)}>
            {(field.options ?? []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        );
      case 'boolean': {
        const checked = Boolean(value);
        return (
          <button type="button" role="switch" aria-checked={checked} onClick={() => set(field.key, !checked)} className={`flex h-9 w-16 items-center rounded-full px-1 transition ${checked ? 'justify-end bg-electric' : 'justify-start bg-navy/15'}`}>
            <span className="h-7 w-7 rounded-full bg-white shadow" />
          </button>
        );
      }
      case 'stringArray':
        return (
          <textarea rows={4} className={`${base} font-mono text-[12px]`} value={Array.isArray(value) ? (value as string[]).join('\n') : String(value ?? '')} placeholder={'One item per line…'} onChange={(e) => set(field.key, e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))} />
        );
      case 'level': {
        const num = Number(value ?? 0);
        return (
          <div className="flex items-center gap-3">
            <input type="range" min={0} max={100} value={num} onChange={(e) => set(field.key, Number(e.target.value))} className="h-2 flex-1 accent-[#2563EB]" aria-label={field.label} />
            <span className="w-10 text-right font-mono text-xs text-navy">{num}</span>
          </div>
        );
      }
      case 'image':
        return (
          <div className="flex items-center gap-3">
            {value ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={String(value)} alt="Preview" className="h-16 w-24 rounded-xl border border-navy/10 object-cover" />
            ) : (
              <div className="flex h-16 w-24 items-center justify-center rounded-xl border border-dashed border-navy/20 font-mono text-[8px] uppercase text-ink/40">No image</div>
            )}
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-navy/12 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-navy transition hover:border-electric hover:text-electric">
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} Upload
              <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(field.key, f); }} />
            </label>
          </div>
        );
      default:
        return <input className={base} value={String(value ?? '')} placeholder={field.placeholder} onChange={(e) => set(field.key, e.target.value)} />;
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-navy/10 bg-soft/60">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left" aria-expanded={open}>
        <span className="min-w-0">
          <span className="block truncate font-display text-[13px] font-semibold text-navy">{String(draft.title ?? draft.name ?? draft.role ?? draft.degree ?? draft.platform ?? draft.label ?? 'Untitled')}</span>
          {!draft.id ? <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-electric">New row</span> : null}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {typeof draft.visible === 'boolean' ? (
            <span className={`rounded-full px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.25em] ${draft.visible ? 'bg-emerald-100 text-emerald-700' : 'bg-navy/10 text-ink/50'}`}>{draft.visible ? 'Visible' : 'Hidden'}</span>
          ) : null}
          {open ? <ChevronUp size={16} className="text-ink/40" /> : <ChevronDown size={16} className="text-ink/40" />}
        </span>
      </button>
      {open ? (
        <div className="border-t border-navy/8 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <label key={field.key} className={`block ${field.span === 2 || field.type === 'textarea' || field.type === 'stringArray' ? 'sm:col-span-2' : ''}`}>
                <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.28em] text-ink/50">{field.label}</span>
                {renderField(field)}
                {field.help ? <span className="mt-1 block text-[10px] text-ink/45">{field.help}</span> : null}
              </label>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between gap-2">
            <button onClick={remove} className="flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-red-600 transition hover:bg-red-50">
              <Trash2 size={13} /> Delete
            </button>
            <button onClick={save} disabled={saving} className="flex items-center gap-1.5 rounded-xl bg-navy px-4 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-white transition hover:bg-[#0d2952] disabled:opacity-60">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function EntityEditor({
  table, title, description, fields, defaultValues, addLabel = 'Add row', emptyHint, orderable = true,
}: {
  table: string;
  title: string;
  description: string;
  fields: Field[];
  defaultValues: Row;
  addLabel?: string;
  emptyHint?: string;
  orderable?: boolean;
}) {
  const supabase = createClient();
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from(table).select('*').order('display_order', { ascending: true });
    if (error) toast(`Could not load ${title.toLowerCase()}: ${error.message}`, 'error');
    setRows((data as Row[] | null) ?? []);
    setLoading(false);
  }, [supabase, table, title, toast]);

  useEffect(() => { load(); }, [load]);

  const toggleVisible = async (row: Row) => {
    const { error } = await supabase.from(table).update({ visible: !row.visible }).eq('id', row.id);
    if (error) toast(`Visibility update failed: ${error.message}`, 'error');
    else load();
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = rows[index + direction];
    const current = rows[index];
    if (!target || !current) return;
    const a = current.display_order ?? index;
    const b = target.display_order ?? index + direction;
    await Promise.all([
      supabase.from(table).update({ display_order: b }).eq('id', current.id),
      supabase.from(table).update({ display_order: a }).eq('id', target.id),
    ]);
    load();
  };

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-display text-2xl font-bold text-navy">{title}</h1>
          <p className="mt-1 max-w-xl text-sm text-ink/65">{description}</p>
        </div>
        <button onClick={() => setAdding((v) => !v)} className="flex items-center gap-2 rounded-xl bg-electric px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-white transition hover:bg-blue-600">
          <Plus size={14} /> {addLabel}
        </button>
      </div>

      {adding ? (
        <div className="mb-4">
          <RowEditor table={table} fields={fields} row={{ ...defaultValues }} onSaved={() => { setAdding(false); load(); }} onDelete={() => setAdding(false)} />
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-navy/8 bg-white p-6 text-sm text-ink/60"><Loader2 size={17} className="animate-spin text-electric" /> Loading…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-navy/15 bg-white p-10 text-center">
          <p className="font-display text-lg font-bold text-navy">Nothing here yet</p>
          <p className="mt-1 text-sm text-ink/60">{emptyHint ?? 'Add the first entry with the button above — it appears on the site instantly.'}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((row, index) => (
            <li key={String(row.id)} className="flex items-stretch gap-2">
              {orderable ? (
                <div className="flex flex-col justify-center gap-1">
                  <button onClick={() => move(index, -1)} disabled={index === 0} className="rounded-lg border border-navy/8 p-1.5 text-ink/45 transition hover:text-navy disabled:opacity-25" aria-label="Move up"><ArrowUp size={13} /></button>
                  <button onClick={() => move(index, 1)} disabled={index === rows.length - 1} className="rounded-lg border border-navy/8 p-1.5 text-ink/45 transition hover:text-navy disabled:opacity-25" aria-label="Move down"><ArrowDown size={13} /></button>
                </div>
              ) : null}
              <div className="min-w-0 flex-1">
                <RowEditor table={table} fields={fields} row={row} onSaved={load} onDelete={load} />
              </div>
              {typeof row.visible === 'boolean' ? (
                <button onClick={() => toggleVisible(row)} className="self-center rounded-xl border border-navy/8 p-2.5 text-ink/45 transition hover:border-electric hover:text-electric" aria-label={row.visible ? 'Hide from site' : 'Show on site'} title={row.visible ? 'Hide from site' : 'Show on site'}>
                  {row.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
