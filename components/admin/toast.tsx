'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

type ToastKind = 'ok' | 'error';
type Toast = { id: number; message: string; kind: ToastKind };

const ToastContext = createContext<(message: string, kind?: ToastKind) => void>(() => undefined);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, kind: ToastKind = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-2), { id, message, kind }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4200);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-5 left-1/2 z-[60] flex w-full max-w-md -translate-x-1/2 flex-col gap-2 px-4" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`pointer-events-auto flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-[13px] shadow-card backdrop-blur ${toast.kind === 'ok' ? 'border-emerald-200 bg-emerald-50/95 text-emerald-900' : 'border-red-200 bg-red-50/95 text-red-900'}`}>
            {toast.kind === 'ok' ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertTriangle size={16} className="mt-0.5 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
