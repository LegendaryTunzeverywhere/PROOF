import { useState, useRef, useEffect } from 'react';
import { usePasteBlocker } from '../utils/pasteBlocker';

export interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  language?: string;
  minHeight?: string;
  maxHeight?: string;
  disabled?: boolean;
  onPasteAttempt?: () => void;
  showLineNumbers?: boolean;
  className?: string;
}

export function CodeEditor({
  value,
  onChange,
  placeholder = 'Type your code here...',
  language = 'javascript',
  minHeight = '200px',
  maxHeight = '500px',
  disabled = false,
  onPasteAttempt,
  showLineNumbers = true,
  className = '',
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [pasteAttempts, setPasteAttempts] = useState(0);
  
  // Apply paste blocking
  const pasteBlocker = usePasteBlocker({
    showWarning: true,
    warningMessage: '⚠️ Pasting is disabled. Type to earn your reward!',
    onPasteAttempt: () => {
      setPasteAttempts((prev) => prev + 1);
      onPasteAttempt?.();
    },
  });

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(
        textareaRef.current.scrollHeight,
        parseInt(maxHeight)
      );
      textareaRef.current.style.height = `${Math.max(newHeight, parseInt(minHeight))}px`;
    }
  }, [value, minHeight, maxHeight]);

  // Handle tab key for indentation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      
      // Set cursor position after the inserted spaces
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    } else {
      // Call paste blocker for other keys
      pasteBlocker.onKeyDown(e);
    }
  };

  const lineCount = value.split('\n').length;
  const lines = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className={`relative rounded-xl border border-line bg-elevated overflow-hidden ${className}`}>
      {/* Language Badge */}
      <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-brand-soft px-2 py-1 text-xs font-semibold text-brand">
            {language.toUpperCase()}
          </span>
          <span className="text-xs text-muted">Paste disabled - Type to earn</span>
        </div>
        {pasteAttempts > 0 && (
          <div className="rounded-full bg-warn-soft px-2 py-0.5 text-xs font-semibold text-warn">
            {pasteAttempts} paste {pasteAttempts === 1 ? 'attempt' : 'attempts'} blocked
          </div>
        )}
      </div>

      {/* Editor Container */}
      <div className="relative flex">
        {/* Line Numbers */}
        {showLineNumbers && (
          <div className="select-none border-r border-line bg-surface-2 px-3 py-4 text-right font-mono text-xs text-muted">
            {lines.map((line) => (
              <div key={line} className="leading-6">
                {line}
              </div>
            ))}
          </div>
        )}

        {/* Code Input */}
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBeforeInput={pasteBlocker.onBeforeInput}
            onPaste={pasteBlocker.onPaste}
            onDrop={pasteBlocker.onDrop}
            onContextMenu={pasteBlocker.onContextMenu}
            placeholder={placeholder}
            disabled={disabled}
            spellCheck={false}
            className="w-full resize-none bg-transparent px-4 py-4 font-mono text-sm text-ink outline-none placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              minHeight,
              maxHeight,
              lineHeight: '1.5rem',
            }}
          />
          
          {/* Paste Warning Overlay */}
          {value.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-surface/50 backdrop-blur-[2px]">
              <div className="text-center">
                <div className="text-4xl mb-2">⌨️</div>
                <p className="text-sm font-semibold text-ink">Type Your Code</p>
                <p className="text-xs text-muted mt-1">Pasting is disabled</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer with character count */}
      <div className="border-t border-line bg-surface px-4 py-2 text-xs text-muted">
        {value.length} characters · {lineCount} {lineCount === 1 ? 'line' : 'lines'}
      </div>
    </div>
  );
}
