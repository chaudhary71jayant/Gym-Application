import { useCallback, useState } from "react";
import ToastContext from "./toastContext";

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = "success") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
      setTimeout(() => {
        dismissToast(id);
      }, 4200);
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}

      {/* Toast Viewport */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-[calc(100%-2rem)] pointer-events-none"
      >
        {toasts.map((toast) => {
          const isError = toast.type === "error";
          const isWarning = toast.type === "warning";
          const styles = isError
            ? "bg-rose-950/95 border-rose-500/40 text-rose-100"
            : isWarning
            ? "bg-amber-950/95 border-amber-500/40 text-amber-100"
            : "bg-emerald-950/95 border-emerald-500/40 text-emerald-100";

          const badgeStyles = isError
            ? "bg-rose-500/20 text-rose-300"
            : isWarning
            ? "bg-amber-500/20 text-amber-300"
            : "bg-emerald-500/20 text-emerald-300";

          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-md animate-toast-in ${styles}`}
            >
              <span
                aria-hidden="true"
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${badgeStyles}`}
              >
                {isError ? "!" : isWarning ? "•" : "✓"}
              </span>
              <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                className="text-slate-400 hover:text-white transition rounded p-0.5 text-xs leading-none"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
