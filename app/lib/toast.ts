/**
 * Simple toast notification utility
 * Uses browser's native notification or falls back to alert/console
 */

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  type?: ToastType;
  duration?: number;
}

/**
 * Show a toast notification
 * @param message - The message to display
 * @param options - Toast options (type, duration)
 */
export function showToast(message: string, options: ToastOptions = {}) {
  const { type = 'info', duration = 3000 } = options;

  // Log to console for debugging
  console.log(`[Toast ${type.toUpperCase()}]`, message);

  // Create toast element
  const toast = createToastElement(message, type);
  document.body.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // Auto-dismiss
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, duration);
}

/**
 * Create toast DOM element
 */
function createToastElement(message: string, type: ToastType): HTMLDivElement {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const colors = {
    success: '#10b981',
    error: '#ef4444',
    info: '#3b82f6',
    warning: '#f59e0b',
  };

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  };

  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    color: #1a202c;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-left: 4px solid ${colors[type]};
    z-index: 10000;
    min-width: 300px;
    max-width: 500px;
    transform: translateX(400px);
    transition: transform 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
  `;

  const icon = document.createElement('span');
  icon.textContent = icons[type];
  icon.style.cssText = `
    font-size: 18px;
    color: ${colors[type]};
    font-weight: bold;
  `;

  const text = document.createElement('span');
  text.textContent = message;
  text.style.cssText = `
    flex: 1;
  `;

  toast.appendChild(icon);
  toast.appendChild(text);

  // Add show class styles
  const style = document.createElement('style');
  style.textContent = `
    .toast.show {
      transform: translateX(0) !important;
    }
  `;
  if (!document.getElementById('toast-styles')) {
    style.id = 'toast-styles';
    document.head.appendChild(style);
  }

  return toast;
}

/**
 * Convenience methods for different toast types
 */
export const toast = {
  success: (message: string, duration?: number) =>
    showToast(message, { type: 'success', duration }),

  error: (message: string, duration?: number) =>
    showToast(message, { type: 'error', duration }),

  info: (message: string, duration?: number) =>
    showToast(message, { type: 'info', duration }),

  warning: (message: string, duration?: number) =>
    showToast(message, { type: 'warning', duration }),
};
