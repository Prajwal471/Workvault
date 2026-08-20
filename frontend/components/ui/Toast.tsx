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
  success: "border-[#1c3328]/30 bg-[#e7f2ec] text-[#1c3328]",
  error: "border-[#e3c7c0] bg-[#fbf3f0] text-[#8a3a2a]",
  info: "border-[#c9bea8] bg-[#f7f3ea] text-[#3e2f21]",
  warning: "border-[#d9bc7a] bg-[#fbf3e0] text-[#8a5c1f]",
};

const iconStyles: Record<ToastType, string> = {
  success: "bg-[#1c3328] text-[#f4efe6]",
  error: "bg-[#a34a36] text-white",
  info: "bg-[#3e2f21] text-[#f4efe6]",
  warning: "bg-[#b38a3a] text-white",
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
        "flex items-start gap-3 p-4 rounded-xl border shadow-lg max-w-[min(24rem,calc(100vw-2rem))]",
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
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col gap-3 items-end pointer-events-none w-[min(24rem,calc(100vw-2rem))]"
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
