import { useEffect } from 'react';

/**
 * Hook to handle Enter key press for buttons
 * @param callback - Function to call when Enter is pressed
 * @param enabled - Whether the handler is enabled (default: true)
 * @param dependencies - Dependencies array for the effect
 */
export function useEnterKeyHandler(
  callback: () => void,
  enabled: boolean = true,
  dependencies: any[] = []
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle Enter key
      if (event.key !== 'Enter') return;

      // Don't trigger if user is typing in an input/textarea
      const activeElement = document.activeElement;
      if (activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.getAttribute('contenteditable') === 'true'
      )) {
        return;
      }

      // Don't trigger if a form is being submitted
      if (activeElement && activeElement.tagName === 'BUTTON' && 
          activeElement.getAttribute('type') === 'submit') {
        return;
      }

      // Prevent default behavior and call the callback
      event.preventDefault();
      callback();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [callback, enabled, ...dependencies]);
}

/**
 * Hook specifically for modal Save/OK/Yes buttons
 * Only works when a modal is open (has role="dialog" or .modal class)
 */
export function useModalEnterKeyHandler(
  callback: () => void,
  enabled: boolean = true,
  dependencies: any[] = []
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle Enter key
      if (event.key !== 'Enter') return;

      // Check if a modal is open
      const modalElements = document.querySelectorAll('[role="dialog"], .modal, [data-modal]');
      if (modalElements.length === 0) return;

      // Don't trigger if user is typing in an input/textarea
      const activeElement = document.activeElement;
      if (activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.getAttribute('contenteditable') === 'true'
      )) {
        return;
      }

      // Prevent default behavior and call the callback
      event.preventDefault();
      callback();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [callback, enabled, ...dependencies]);
}
