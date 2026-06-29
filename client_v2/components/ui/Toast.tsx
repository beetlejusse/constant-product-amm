"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Loading03Icon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
  Cancel02Icon,
  LinkSquare02Icon,
} from "@hugeicons/core-free-icons";
import { explorerTx } from "@/lib/contracts";

export type ToastStatus = "pending" | "success" | "error";

export interface ToastItem {
  id: string;
  status: ToastStatus;
  title: string;
  description?: string;
  hash?: `0x${string}`;
}

export interface ToastContextValue {
  notify: (toast: Omit<ToastItem, "id">) => string;
  update: (id: string, patch: Partial<Omit<ToastItem, "id">>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const scheduleAutoDismiss = useCallback(
    (id: string, status: ToastStatus) => {
      if (timers.current[id]) clearTimeout(timers.current[id]);
      if (status !== "pending") timers.current[id] = setTimeout(() => dismiss(id), 7000);
    },
    [dismiss],
  );

  const notify = useCallback(
    (toast: Omit<ToastItem, "id">) => {
      const id = `t${++counter.current}`;
      setToasts((prev) => [...prev, { ...toast, id }]);
      scheduleAutoDismiss(id, toast.status);
      return id;
    },
    [scheduleAutoDismiss],
  );

  const update = useCallback(
    (id: string, patch: Partial<Omit<ToastItem, "id">>) => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
      if (patch.status) scheduleAutoDismiss(id, patch.status);
    },
    [scheduleAutoDismiss],
  );

  return (
    <ToastContext.Provider value={{ notify, update, dismiss }}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-[min(92vw,22rem)] flex-col gap-2">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

const ICON = {
  pending: Loading03Icon,
  success: CheckmarkCircle02Icon,
  error: InformationCircleIcon,
} as const;

const ACCENT = {
  pending: "text-brand",
  success: "text-success",
  error: "text-destructive",
} as const;

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className="pointer-events-auto flex items-start gap-3 rounded-lg border border-border bg-card/95 p-3.5 shadow-lg backdrop-blur-xl"
    >
      <span className={`mt-0.5 shrink-0 ${ACCENT[toast.status]}`}>
        <motion.span
          animate={toast.status === "pending" ? { rotate: 360 } : { rotate: 0 }}
          transition={
            toast.status === "pending"
              ? { repeat: Infinity, ease: "linear", duration: 0.9 }
              : { duration: 0.2 }
          }
          className="inline-flex"
        >
          <HugeiconsIcon icon={ICON[toast.status]} size={20} strokeWidth={2} />
        </motion.span>
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 break-words text-xs text-muted-foreground">{toast.description}</p>
        )}
        {toast.hash && (
          <a
            href={explorerTx(toast.hash)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
          >
            View on Basescan
            <HugeiconsIcon icon={LinkSquare02Icon} size={13} strokeWidth={2} />
          </a>
        )}
      </div>

      <button
        onClick={onDismiss}
        className="shrink-0 cursor-pointer rounded-md p-1 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
        aria-label="Dismiss"
      >
        <HugeiconsIcon icon={Cancel02Icon} size={15} strokeWidth={2} />
      </button>
    </motion.div>
  );
}
