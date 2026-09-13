/**
 * Paste Blocker Utility
 * Prevents users from pasting content into input fields
 * Used in proof challenges where typing is required to earn rewards
 */

export interface PasteBlockerOptions {
  showWarning?: boolean;
  warningMessage?: string;
  onPasteAttempt?: () => void;
}

const DEFAULT_OPTIONS: Required<PasteBlockerOptions> = {
  showWarning: true,
  warningMessage: '⚠️ Pasting is disabled. Please type to earn rewards.',
  onPasteAttempt: () => {},
};

/**
 * Block paste events on an element
 * @param event - The paste event
 * @param options - Configuration options
 */
export function blockPaste(
  event: ClipboardEvent,
  options: PasteBlockerOptions = {}
): void {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Prevent the paste
  event.preventDefault();
  event.stopPropagation();
  
  // Call the callback
  opts.onPasteAttempt();
  
  // Show warning if enabled
  if (opts.showWarning && opts.warningMessage) {
    // Create or update warning toast
    showWarningToast(opts.warningMessage);
  }
}

/**
 * Block context menu (right-click menu) to prevent paste option
 * @param event - The context menu event
 */
export function blockContextMenu(event: MouseEvent): void {
  event.preventDefault();
  event.stopPropagation();
}

/**
 * Block keyboard shortcuts for paste (Ctrl+V, Cmd+V, Shift+Insert)
 * @param event - The keyboard event
 * @param options - Configuration options
 */
export function blockPasteShortcuts(
  event: KeyboardEvent,
  options: PasteBlockerOptions = {}
): void {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Check for paste shortcuts
  const isPasteShortcut =
    (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'v' ||
    event.shiftKey && event.key === 'Insert';
  
  if (isPasteShortcut) {
    event.preventDefault();
    event.stopPropagation();
    
    opts.onPasteAttempt();
    
    if (opts.showWarning && opts.warningMessage) {
      showWarningToast(opts.warningMessage);
    }
  }
}

/** Block dragged text or files from being inserted into proof fields. */
export function blockDrop(
  event: DragEvent,
  options: PasteBlockerOptions = {}
): void {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  event.preventDefault();
  event.stopPropagation();
  opts.onPasteAttempt();
  if (opts.showWarning && opts.warningMessage) showWarningToast(opts.warningMessage);
}

/**
 * Show a warning toast message
 */
function showWarningToast(_message: string): void {
  // Remove existing toast if present
  const existingToast = document.getElementById('paste-blocker-toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  // Create toast element
  const toast = document.createElement('div');
  toast.id = 'paste-blocker-toast';
  toast.className = 'fixed bottom-6 right-6 z-50 rounded-xl border border-warn bg-warn-soft px-4 py-3 shadow-lg animate-slide-up';
  toast.style.animation = 'slideUp 0.3s ease-out';
  toast.innerHTML = `
    <div class="flex items-center gap-3">
      <span class="text-2xl">⚠️</span>
      <div>
        <p class="text-sm font-semibold text-warn">Pasting Disabled</p>
        <p class="text-xs text-warn mt-0.5">Type to prove your skills and earn rewards</p>
      </div>
    </div>
  `;
  
  // Add to document
  document.body.appendChild(toast);
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.style.animation = 'slideDown 0.3s ease-in';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * React hook for blocking paste in input elements
 * @param options - Configuration options
 * @returns Event handlers to attach to input elements
 */
export function usePasteBlocker(options: PasteBlockerOptions = {}) {
  return {
    onPaste: (event: React.ClipboardEvent) => blockPaste(event.nativeEvent, options),
    onDrop: (event: React.DragEvent) => blockDrop(event.nativeEvent, options),
    onContextMenu: (event: React.MouseEvent) => blockContextMenu(event.nativeEvent),
    onKeyDown: (event: React.KeyboardEvent) => blockPasteShortcuts(event.nativeEvent, options),
  };
}

/**
 * Add global paste blocking to the entire document
 * Useful for challenge/proof pages
 */
export function enableGlobalPasteBlocking(options: PasteBlockerOptions = {}): () => void {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const handlePaste = (e: ClipboardEvent) => blockPaste(e, opts);
  const handleContextMenu = (e: MouseEvent) => {
    // Only block on input/textarea elements
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      blockContextMenu(e);
    }
  };
  const handleKeyDown = (e: KeyboardEvent) => blockPasteShortcuts(e, opts);
  
  document.addEventListener('paste', handlePaste, true);
  document.addEventListener('contextmenu', handleContextMenu, true);
  document.addEventListener('keydown', handleKeyDown, true);
  
  // Return cleanup function
  return () => {
    document.removeEventListener('paste', handlePaste, true);
    document.removeEventListener('contextmenu', handleContextMenu, true);
    document.removeEventListener('keydown', handleKeyDown, true);
  };
}

// Add CSS animation for toast
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideUp {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
    
    @keyframes slideDown {
      from {
        transform: translateY(0);
        opacity: 1;
      }
      to {
        transform: translateY(100%);
        opacity: 0;
      }
    }
    
    .animate-slide-up {
      animation: slideUp 0.3s ease-out;
    }
  `;
  document.head.appendChild(style);
}
