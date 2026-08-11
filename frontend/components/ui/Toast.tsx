"use client";

import React, { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  body?: string;
  hash?: string;
}

const icons: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  info: "ℹ",
  warning: "⚠",
};

const toastStyles: Record<ToastType, string> = {
  success: "border-emerald-500/40 bg-emerald-900/30 text-emerald-300",
  error: "border-red-500/40 bg-red-900/30 text-red-300",
  info: "border-indigo-500/40 bg-indigo-900/30 text-indigo-300",
  warning: "border-amber-500/40 bg-amber-900/30 text-amber-300",
};

const iconStyles: Record<ToastType, string> = {
  success: "bg-emerald-500/20 text-emerald-400",
  error: "bg-red-500/20 text-red-400",
  info: "bg-indigo-500/20 text-indigo-400",
  warning: "bg-amber-500/20 text-amber-400",
};

// ── Single Toast ───────────────────────────────────────────────────────────

interface ToastItemProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const t1 = setTimeout(() => setVisible(true), 10);
    // Auto-dismiss after 6s
    const t2 = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(toast.id), 300);
    }, 6000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [toast.id, onDismiss]);

  return (
    <div
      className={[
        "flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md max-w-sm w-full shadow-xl",
        "transition-all duration-300",
        toastStyles[toast.type],
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
      ].join(" ")}
      role="alert"
    >
      <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${iconStyles[toast.type]}`}>
        {icons[toast.type]}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{toast.title}</p>
        {toast.body && (
          <p className="text-xs mt-0.5 opacity-80">{toast.body}</p>
        )}
        {toast.hash && (
          <a
            href={`https://stellar.expert/explorer/testnet/tx/${toast.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono underline opacity-70 hover:opacity-100 mt-1 block truncate"
            id={`toast-hash-${toast.id}`}
          >
            {toast.hash.slice(0, 24)}…
          </a>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity text-xs"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}

// ── Toast Container ────────────────────────────────────────────────────────

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div
      id="toast-container"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end pointer-events-none"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}

// ── useToast hook ──────────────────────────────────────────────────────────

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (
    type: ToastType,
    title: string,
    body?: string,
    hash?: string
  ) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, body, hash }]);
  };

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, addToast, dismiss };
}
