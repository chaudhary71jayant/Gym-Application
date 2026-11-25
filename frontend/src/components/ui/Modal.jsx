import { useEffect, useId, useRef } from "react";
import { CloseIcon } from "./Icons";

const SIZE_CLASSES = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
};

const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  size = "md",
  closedBy = "any",
  children,
  footer,
}) => {
  const dialogRef = useRef(null);
  const titleId = useId();
  const pressedOutsideRef = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    const handleClose = () => {
      dialog.returnValue = "";
      onClose?.();
    };

    const handleCancel = (event) => {
      if (closedBy === "none") {
        event.preventDefault();
        return;
      }
      onClose?.();
    };

    dialog.addEventListener("close", handleClose);
    dialog.addEventListener("cancel", handleCancel);
    return () => {
      dialog.removeEventListener("close", handleClose);
      dialog.removeEventListener("cancel", handleCancel);
    };
  }, [closedBy, onClose]);

  // Fallback light-dismiss for browsers without <dialog closedby="any">
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || closedBy !== "any" || "closedBy" in HTMLDialogElement.prototype) {
      return undefined;
    }

    const isOutside = (e) => {
      const rect = dialog.getBoundingClientRect();
      return (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      );
    };

    const onPointerDown = (e) => {
      pressedOutsideRef.current = isOutside(e);
    };
    const onPointerUp = (e) => {
      if (pressedOutsideRef.current && isOutside(e)) {
        dialog.close();
      }
      pressedOutsideRef.current = false;
    };

    dialog.addEventListener("pointerdown", onPointerDown);
    dialog.addEventListener("pointerup", onPointerUp);
    return () => {
      dialog.removeEventListener("pointerdown", onPointerDown);
      dialog.removeEventListener("pointerup", onPointerUp);
    };
  }, [closedBy]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      closedby={closedBy}
      aria-labelledby={titleId}
      className={`m-auto w-[calc(100%-2rem)] ${SIZE_CLASSES[size] || SIZE_CLASSES.md} rounded-2xl border border-slate-700/70 bg-slate-900/95 text-slate-100 shadow-2xl backdrop:bg-slate-950/80 p-0 max-h-[90dvh] overflow-hidden`}
    >
      <div className="flex flex-col max-h-[90dvh]">
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-800/80 bg-slate-900/90">
          <div>
            <h1 id={titleId} className="text-lg font-bold text-white tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">{children}</div>

        {footer && (
          <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-900/90 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </dialog>
  );
};

export default Modal;
