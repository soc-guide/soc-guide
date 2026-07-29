import { type ReactNode, useEffect, useRef } from "react";

interface Props {
  open: boolean;
  kicker?: string;
  title: ReactNode;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  variant?: string;
  catalog?: boolean;
}

export function Modal({ open, kicker, title, children, onClose, wide = false, variant = "", catalog = false }: Props) {
  const ref = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  if (!open) return null;
  const baseClass = catalog ? "catalog-modal" : "detail-modal";
  const wideClass = wide
    ? `${catalog ? "catalog-modal-wide" : "detail-modal-wide"} modal-wide`
    : "";
  const className = [baseClass, wideClass, variant].filter(Boolean).join(" ");
  return (
    <dialog
      ref={ref}
      className={className}
      aria-labelledby="react-modal-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === ref.current) onClose(); }}
    >
      <div className="modal-shell">
        <header className="modal-header">
          <div>
            {kicker && <p className={catalog ? "modal-kicker" : "eyebrow"}>{kicker}</p>}
            <h2 className={catalog ? "modal-title" : undefined} id="react-modal-title">{title}</h2>
          </div>
          <button className="modal-close" type="button" aria-label="Close details" onClick={onClose}>×</button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
      <div className="modal-tooltip-layer" aria-hidden="true" />
    </dialog>
  );
}
