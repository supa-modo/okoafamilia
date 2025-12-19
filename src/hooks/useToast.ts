import { useCallback, useEffect, useRef, useState } from "react";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

export interface ShowToastOptions {
  type?: ToastType;
  message: string;
  duration?: number;
}

const DEFAULT_DURATION = 5000;

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    if (timeoutsRef.current[id]) {
      clearTimeout(timeoutsRef.current[id]);
      delete timeoutsRef.current[id];
    }
  }, []);

  const showToast = useCallback(
    ({
      type = "info",
      message,
      duration = DEFAULT_DURATION,
    }: ShowToastOptions) => {
      if (!message) return;

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const toast: ToastMessage = { id, type, message, duration };

      setToasts((prev) => [toast, ...prev].slice(0, 3));

      timeoutsRef.current[id] = setTimeout(() => {
        dismissToast(id);
      }, duration);
    },
    [dismissToast]
  );

  useEffect(() => {
    return () => {
      Object.values(timeoutsRef.current).forEach(clearTimeout);
    };
  }, []);

  return {
    toasts,
    showToast,
    dismissToast,
  };
}

