/**
 * Confirmation Dialog Component
 * Simple modal dialog for confirming actions
 */

'use client';

import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Handle escape key and tab navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Tab') {
        // Trap focus within dialog
        const focusableElements = [cancelButtonRef.current, confirmButtonRef.current].filter(Boolean);
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Focus cancel button when dialog opens
  useEffect(() => {
    if (isOpen) {
      cancelButtonRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const confirmButtonClass =
    confirmVariant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : 'bg-blue-600 hover:bg-blue-700 text-white';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-message"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 animate-in fade-in zoom-in duration-200">
        {/* Title */}
        <h3 id="dialog-title" className="text-xl font-semibold text-gray-900 mb-3">
          {title}
        </h3>

        {/* Message */}
        <p id="dialog-message" className="text-gray-600 mb-6 leading-relaxed">
          {message}
        </p>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            aria-label="Cancel action"
          >
            {cancelText}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${confirmButtonClass}`}
            aria-label="Confirm action"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for using confirmation dialog
 * Returns [showConfirm, ConfirmDialogComponent]
 */
export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: 'primary' | 'danger';
    onConfirm: () => void;
  }>({
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showConfirm = (options: typeof config) => {
    setConfig(options);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      setConfig((prev) => ({
        ...prev,
        onConfirm: () => {
          prev.onConfirm();
          setIsOpen(false);
          resolve(true);
        },
      }));
    });
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  const ConfirmDialogComponent = (
    <ConfirmDialog
      isOpen={isOpen}
      title={config.title}
      message={config.message}
      confirmText={config.confirmText}
      cancelText={config.cancelText}
      confirmVariant={config.confirmVariant}
      onConfirm={config.onConfirm}
      onCancel={handleCancel}
    />
  );

  return [showConfirm, ConfirmDialogComponent] as const;
}

// Import useState for the hook
import { useState } from 'react';
