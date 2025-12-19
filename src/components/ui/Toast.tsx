import React from "react";
import { FiX } from "react-icons/fi";
import { ToastMessage } from "../../hooks/useToast";

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

const typeStyles: Record<ToastMessage["type"], string> = {
  success: "bg-green-100 text-green-800 border-green-200",
  error: "bg-red-100 text-red-800 border-red-200",
  info: "bg-blue-100 text-blue-800 border-blue-200",
};

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
}) => {
  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 inset-x-0 flex justify-end z-70 px-3 mr-2 lg:mr-6 pointer-events-none">
      <div className="w-full max-w-xl space-y-2 pointer-events-auto flex flex-col items-end">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`inline-flex items-center gap-3 rounded-full border px-4 py-1.5 lg:py-2 shadow-sm text-xs sm:text-sm whitespace-nowrap max-w-[min(360px,calc(100vw-2rem))] ${typeStyles[toast.type]}`}
          >
            <span className="flex-1 truncate">{toast.message}</span>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className={`${toast.type === "error" ? "text-red-700" : toast.type === "success" ? "text-green-700" : "text-blue-700"} hover:opacity-80 transition-opacity`}
            >
              <FiX className="h-4 w-4 shrink-0" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ToastContainer;

