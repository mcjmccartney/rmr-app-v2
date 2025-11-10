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
  const [selectionState, setSelectionState] = useState({
    bold: false,
    italic: false,
    underline: false
  });

  // Update selection state when selection changes
  const updateSelectionState = () => {
    try {
      setSelectionState({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline')
      });
    } catch {
      // Fallback if queryCommandState fails
      setSelectionState({
        bold: false,
        italic: false,
        underline: false
      });
    }
  };

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      let editableContent = value || '';

      // If content doesn't contain HTML tags, it's plain text - convert line breaks
      if (!/<[^>]+>/.test(editableContent)) {
        editableContent = editableContent
          .replace(/\n\n/g, '<br><br>') // Double line breaks to paragraph breaks
          .replace(/\n/g, '<br>'); // Single line breaks to HTML breaks
      } else {
        // If it's HTML, convert paragraph tags back to double line breaks for editing
        editableContent = editableContent
          .replace(/<\/p>\s*<p>/gi, '<br><br>')
          .replace(/<\/?p>/gi, '');
      }

      editorRef.current.innerHTML = editableContent;
    }
  }, [value]);

  // Add selection change listeners
  useEffect(() => {
    const handleSelectionChange = () => {
      // Only update if this editor is focused
      if (document.activeElement === editorRef.current) {
        updateSelectionState();
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  // Handle content changes
  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
      // Update selection state after content changes
      updateSelectionState();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    // Handle Enter key to create proper paragraph breaks
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      document.execCommand('insertHTML', false, '<br><br>');
      return;
    }

    // Handle Shift+Enter for single line break
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      document.execCommand('insertHTML', false, '<br>');
      return;
    }

    // Handle keyboard shortcuts
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

  // Format text with the specified command
  const formatText = (command: string) => {
    if (disabled) return;

    document.execCommand(command, false);
    editorRef.current?.focus();
    handleInput();
  };

  // Handle focus events
  const handleFocus = () => {
    setIsFocused(true);
    updateSelectionState();
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  // Handle mouse up to catch selection changes via mouse
  const handleMouseUp = () => {
    updateSelectionState();
  };

  // Handle key up to catch selection changes via keyboard
  const handleKeyUp = () => {
    updateSelectionState();
  };

  // Handle paste to clean up formatting and preserve line breaks
  const handlePaste = (e: React.ClipboardEvent) => {
    if (disabled) return;

    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    // Convert line breaks to HTML breaks for proper display
    const htmlContent = text.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
    document.execCommand('insertHTML', false, htmlContent);
    handleInput();
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
            selectionState.bold ? 'bg-gray-300' : ''
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
            selectionState.italic ? 'bg-gray-300' : ''
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
            selectionState.underline ? 'bg-gray-300' : ''
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
        onFocus={handleFocus}
        onBlur={handleBlur}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onMouseUp={handleMouseUp}
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
