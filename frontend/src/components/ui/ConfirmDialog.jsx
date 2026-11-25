import Modal from "./Modal";
import { AlertTriangleIcon } from "./Icons";

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  isLoading = false,
}) => {
  const isDanger = variant === "danger";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      closedBy={isLoading ? "none" : "any"}
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isDanger
                ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
            }`}
          >
            <AlertTriangleIcon className="w-5 h-5" />
          </div>
          <p className="text-sm text-slate-300 leading-relaxed pt-1">{message}</p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            autoFocus
            disabled={isLoading}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition disabled:opacity-50 ${
              isDanger
                ? "bg-rose-600 hover:bg-rose-500"
                : "bg-indigo-600 hover:bg-indigo-500"
            }`}
          >
            {isLoading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
