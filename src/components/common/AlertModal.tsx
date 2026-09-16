import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface AlertModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  actionLabel?: string;
  onClose: () => void;
}

export const AlertModal = ({
  isOpen,
  title,
  message,
  actionLabel = 'Close',
  onClose,
}: AlertModalProps) => {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-modal-title"
        aria-describedby="alert-modal-message"
        className="w-full max-w-sm border-t-4 border-carbon-blue-60 bg-white shadow-2xl"
      >
        <div className="p-6">
          <h2 id="alert-modal-title" className="text-xl font-black text-carbon-gray-100">
            {title}
          </h2>
          <p id="alert-modal-message" className="mt-3 text-sm leading-relaxed text-gray-600">
            {message}
          </p>
        </div>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="min-h-12 w-full border-t border-gray-200 bg-carbon-gray-100 px-5 text-sm font-bold text-white transition-colors hover:bg-black"
        >
          {actionLabel}
        </button>
      </div>
    </div>,
    document.body,
  );
};
