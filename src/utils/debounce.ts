/**
 * Debounce utility for delaying function execution
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttle utility for limiting function execution frequency
 * @param func - Function to throttle
 * @param delay - Minimum delay between executions
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastExecution = 0;
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastExecution >= delay) {
      lastExecution = now;
      func(...args);
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        lastExecution = Date.now();
        func(...args);
      }, delay - (now - lastExecution));
    }
  };
}

/**
 * Auto-save configuration constants
 */
export const AUTO_SAVE_CONFIG = {
  TYPING_DEBOUNCE: 2000,      // 2 seconds after user stops typing
  PERIODIC_SAVE: 30000,       // 30 seconds regardless of activity
  FIELD_BLUR: 500,            // 500ms after leaving a field
  CRITICAL_CONTENT: 5000,     // 5 seconds for important fields
  MAX_RETRIES: 3,             // Maximum retry attempts
  RETRY_DELAYS: [1000, 2000, 5000], // Progressive retry delays
};
