import { AlertTriangleIcon, RefreshIcon } from "./Icons";

export const LoadingState = ({ label = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <div
      aria-hidden="true"
      className="h-9 w-9 rounded-full border-2 border-indigo-500/30 border-t-indigo-400 animate-spin"
    />
    <p className="text-sm text-slate-400 font-medium">{label}</p>
  </div>
);

export const ErrorBanner = ({ message, onRetry }) => (
  <div
    role="alert"
    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-rose-500/40 bg-rose-950/35 px-5 py-4 text-rose-200"
  >
    <div className="flex items-start gap-3">
      <AlertTriangleIcon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
      <p className="text-sm font-medium">{message}</p>
    </div>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-xs font-semibold text-rose-100 transition self-start sm:self-auto"
      >
        <RefreshIcon className="w-3.5 h-3.5" />
        Retry
      </button>
    )}
  </div>
);

export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="glass-card rounded-2xl p-10 sm:p-12 text-center flex flex-col items-center justify-center">
    {Icon && (
      <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/70 flex items-center justify-center text-slate-400 mb-4">
        <Icon className="w-6 h-6" />
      </div>
    )}
    <h3 className="text-base font-semibold text-white">{title}</h3>
    {description && (
      <p className="text-sm text-slate-400 mt-1.5 max-w-md">{description}</p>
    )}
    {action && <div className="mt-5">{action}</div>}
  </div>
);
