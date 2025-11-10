'use client';

import { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Underline } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Enter text...',
  className = '',
  disabled = false
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  // Handle content changes
  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  };

  // Format text with the specified command
  const formatText = (command: string) => {
    if (disabled) return;
    
    document.execCommand(command, false);
    editorRef.current?.focus();
    handleInput();
  };

  // Check if a format is currently active
  const isFormatActive = (command: string): boolean => {
    try {
      return document.queryCommandState(command);
    } catch {
      return false;
    }
  };

  // Handle paste to clean up formatting
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    handleInput();
  };

  // Handle key events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Allow Ctrl+B, Ctrl+I, Ctrl+U for formatting
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          formatText('bold');
          break;
        case 'i':
          e.preventDefault();
          formatText('italic');
          break;
        case 'u':
          e.preventDefault();
          formatText('underline');
          break;
      }
    }
  };

  return (
    <div className={`border border-gray-300 rounded-md ${isFocused ? 'ring-2 ring-amber-800 border-amber-800' : ''} ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
        <button
          type="button"
          onClick={() => formatText('bold')}
          disabled={disabled}
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${
            isFormatActive('bold') ? 'bg-gray-300' : ''
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Bold (Ctrl+B)"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => formatText('italic')}
          disabled={disabled}
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${
            isFormatActive('italic') ? 'bg-gray-300' : ''
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Italic (Ctrl+I)"
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          onClick={() => formatText('underline')}
          disabled={disabled}
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${
            isFormatActive('underline') ? 'bg-gray-300' : ''
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Underline (Ctrl+U)"
        >
          <Underline size={16} />
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        className={`p-3 min-h-[100px] focus:outline-none ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
        }`}
        style={{ 
          wordBreak: 'break-word',
          overflowWrap: 'break-word'
        }}
        suppressContentEditableWarning={true}
        data-placeholder={placeholder}
      />

      {/* Placeholder styling */}
      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
