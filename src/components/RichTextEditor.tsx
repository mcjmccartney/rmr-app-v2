'use client';

import { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Underline, Link as LinkIcon, Unlink, Heading2, Type } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxLength?: number;
  showCharCount?: boolean;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Enter text...',
  className = '',
  disabled = false,
  maxLength,
  showCharCount = false
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [selectionState, setSelectionState] = useState({
    bold: false,
    italic: false,
    underline: false,
    link: false
  });
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const savedSelectionRef = useRef<Range | null>(null);

  // Get text length (strip HTML tags)
  const getTextLength = (html: string): number => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent?.length || 0;
  };

  const currentLength = getTextLength(value);

  // Update selection state when selection changes
  const updateSelectionState = () => {
    try {
      // Check if selection is within a link
      const selection = window.getSelection();
      let isLink = false;
      if (selection && selection.rangeCount > 0) {
        let node = selection.anchorNode;
        while (node && node !== editorRef.current) {
          if (node.nodeName === 'A') {
            isLink = true;
            break;
          }
          node = node.parentNode;
        }
      }

      setSelectionState({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        link: isLink
      });
    } catch {
      // Fallback if queryCommandState fails
      setSelectionState({
        bold: false,
        italic: false,
        underline: false,
        link: false
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

      // Check maxLength if specified
      if (maxLength) {
        const textLength = getTextLength(content);
        if (textLength > maxLength) {
          // Revert to previous value
          editorRef.current.innerHTML = value;
          return;
        }
      }

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

  // Handle link insertion
  const handleAddLink = () => {
    if (disabled) return;

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      // Save the current selection range
      savedSelectionRef.current = selection.getRangeAt(0).cloneRange();

      if (selection.toString().length > 0) {
        // User has selected text
        setLinkText(selection.toString());
        setLinkUrl('https://');
      } else {
        // No text selected
        setLinkText('');
        setLinkUrl('https://');
      }
    } else {
      savedSelectionRef.current = null;
      setLinkText('');
      setLinkUrl('https://');
    }
    setShowLinkModal(true);
  };

  // Insert the link
  const insertLink = () => {
    if (!linkUrl) return;

    // Restore the saved selection
    if (savedSelectionRef.current && editorRef.current) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedSelectionRef.current);
      }
    }

    // Focus the editor
    editorRef.current?.focus();

    const selection = window.getSelection();
    if (linkText && savedSelectionRef.current && savedSelectionRef.current.collapsed) {
      // Insert new link with text (no text was selected)
      const linkHtml = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" style="color: #973b00; text-decoration: underline;">${linkText}</a>&nbsp;`;
      document.execCommand('insertHTML', false, linkHtml);
    } else if (selection && selection.toString().length > 0) {
      // Wrap selected text in link
      document.execCommand('createLink', false, linkUrl);

      // Style the link - find the newly created link
      if (selection.rangeCount > 0) {
        let node = selection.anchorNode;
        while (node && node !== editorRef.current) {
          if (node.nodeName === 'A') {
            (node as HTMLAnchorElement).setAttribute('target', '_blank');
            (node as HTMLAnchorElement).setAttribute('rel', 'noopener noreferrer');
            (node as HTMLAnchorElement).style.color = '#973b00';
            (node as HTMLAnchorElement).style.textDecoration = 'underline';
            break;
          }
          node = node.parentNode;
        }
      }
    }

    // Trigger the input handler to save changes
    handleInput();

    // Clean up
    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
    savedSelectionRef.current = null;
  };

  // Remove link
  const handleRemoveLink = () => {
    if (disabled) return;
    document.execCommand('unlink', false);
    editorRef.current?.focus();
    handleInput();
  };

  // Apply green header style
  const applyGreenHeader = () => {
    if (disabled) return;

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);

      // Create a styled header element
      const headerHtml = `<h2 style="color: #4f6749; font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem;">${selection.toString() || 'Header Text'}</h2>`;

      // Insert the header
      document.execCommand('insertHTML', false, headerHtml);

      editorRef.current?.focus();
      handleInput();
    }
  };

  // Apply body text style (reset to normal)
  const applyBodyText = () => {
    if (disabled) return;

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      // Remove formatting by wrapping in a span with default styles
      const text = selection.toString();
      if (text) {
        const bodyHtml = `<span style="color: inherit; font-size: inherit; font-weight: normal;">${text}</span>`;
        document.execCommand('insertHTML', false, bodyHtml);
      }

      editorRef.current?.focus();
      handleInput();
    }
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
    <>
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

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <button
            type="button"
            onClick={handleAddLink}
            disabled={disabled}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              selectionState.link ? 'bg-gray-300' : ''
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Add Link"
          >
            <LinkIcon size={16} />
          </button>
          {selectionState.link && (
            <button
              type="button"
              onClick={handleRemoveLink}
              disabled={disabled}
              className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                disabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Remove Link"
            >
              <Unlink size={16} />
            </button>
          )}

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <button
            type="button"
            onClick={applyGreenHeader}
            disabled={disabled}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="Green Header"
            style={{ color: '#4f6749' }}
          >
            <Heading2 size={16} />
          </button>
          <button
            type="button"
            onClick={applyBodyText}
            disabled={disabled}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="Body Text"
          >
            <Type size={16} />
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

        {/* Character Count */}
        {(showCharCount || maxLength) && (
          <div className="px-3 py-2 border-t border-gray-200 bg-gray-50 text-right">
            <span className={`text-xs ${
              maxLength && currentLength > maxLength * 0.9
                ? currentLength >= maxLength
                  ? 'text-red-500 font-semibold'
                  : 'text-amber-600'
                : 'text-gray-500'
            }`}>
              {currentLength}{maxLength ? `/${maxLength}` : ''}
            </span>
          </div>
        )}

        {/* Placeholder styling */}
        <style jsx>{`
          [contenteditable]:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
          }
        `}</style>
      </div>

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Insert Link</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link Text {!linkText && '(optional)'}
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Enter link text"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="https://example.com"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={insertLink}
                className="px-4 py-2 text-white rounded-lg font-medium transition-colors"
                style={{ backgroundColor: '#973b00' }}
              >
                Insert Link
              </button>
              <button
                onClick={() => {
                  setShowLinkModal(false);
                  setLinkUrl('');
                  setLinkText('');
                  savedSelectionRef.current = null;
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
