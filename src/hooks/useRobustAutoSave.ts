import { useState, useEffect, useCallback, useRef } from 'react';
import { debounce, AUTO_SAVE_CONFIG } from '@/utils/debounce';

export interface AutoSaveState {
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  lastSaved: Date | null;
  lastChangeTime: number | null;
  changeCount: number;
  failedSaveCount: number;
  isOnline: boolean;
  saveError: string | null;
}

export interface ChangeState {
  hasTextChanges: boolean;
  hasActionPointChanges: boolean;
  criticalChanges: boolean;
}

interface UseRobustAutoSaveOptions {
  saveFunction: (isAutoSave?: boolean) => Promise<any>;
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
  enablePeriodicSave?: boolean;
  enableCriticalSave?: boolean;
}

export function useRobustAutoSave({
  saveFunction,
  onSaveSuccess,
  onSaveError,
  enablePeriodicSave = true,
  enableCriticalSave = true,
}: UseRobustAutoSaveOptions) {
  const [autoSaveState, setAutoSaveState] = useState<AutoSaveState>({
    isSaving: false,
    hasUnsavedChanges: false,
    lastSaved: null,
    lastChangeTime: null,
    changeCount: 0,
    failedSaveCount: 0,
    isOnline: navigator.onLine,
    saveError: null,
  });

  const [changeState, setChangeState] = useState<ChangeState>({
    hasTextChanges: false,
    hasActionPointChanges: false,
    criticalChanges: false,
  });

  const saveQueueRef = useRef<Array<() => Promise<void>>>([]);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  // Clear all timers
  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  // Robust save with retry logic
  const robustSave = useCallback(async (retryCount = 0): Promise<boolean> => {
    if (autoSaveState.isSaving) return false;

    setAutoSaveState(prev => ({ ...prev, isSaving: true, saveError: null }));

    try {
      await saveFunction(true);
      
      setAutoSaveState(prev => ({
        ...prev,
        isSaving: false,
        hasUnsavedChanges: false,
        lastSaved: new Date(),
        failedSaveCount: 0,
        saveError: null,
      }));

      setChangeState({
        hasTextChanges: false,
        hasActionPointChanges: false,
        criticalChanges: false,
      });

      onSaveSuccess?.();
      return true;

    } catch (error) {
      
      if (retryCount < AUTO_SAVE_CONFIG.MAX_RETRIES) {
        const delay = AUTO_SAVE_CONFIG.RETRY_DELAYS[retryCount] || 5000;
        
        setAutoSaveState(prev => ({
          ...prev,
          isSaving: false,
          failedSaveCount: retryCount + 1,
        }));

        setTimeout(() => {
          robustSave(retryCount + 1);
        }, delay);
        
        return false;
      } else {
        // All retries failed
        setAutoSaveState(prev => ({
          ...prev,
          isSaving: false,
          failedSaveCount: retryCount + 1,
          saveError: error instanceof Error ? error.message : 'Save failed',
        }));

        onSaveError?.(error instanceof Error ? error : new Error('Save failed'));
        return false;
      }
    }
  }, [saveFunction, onSaveSuccess, onSaveError, autoSaveState.isSaving]);

  // Debounced save function
  const debouncedSave = useCallback(
    debounce(() => {
      if (autoSaveState.hasUnsavedChanges && !autoSaveState.isSaving) {
        robustSave();
      }
    }, AUTO_SAVE_CONFIG.TYPING_DEBOUNCE),
    [robustSave, autoSaveState.hasUnsavedChanges, autoSaveState.isSaving]
  );

  // Track changes
  const trackChange = useCallback((changeType: keyof ChangeState, isCritical = false) => {
    const now = Date.now();
    
    setAutoSaveState(prev => ({
      ...prev,
      hasUnsavedChanges: true,
      lastChangeTime: now,
      changeCount: prev.changeCount + 1,
    }));

    setChangeState(prev => ({
      ...prev,
      [changeType]: true,
      criticalChanges: prev.criticalChanges || isCritical,
    }));

    // Trigger debounced save
    debouncedSave();
  }, [debouncedSave]);

  // Auto-save effects
  useEffect(() => {
    clearAllTimers();

    if (!autoSaveState.hasUnsavedChanges || autoSaveState.isSaving) {
      return;
    }

    // 1. Periodic save (every 30 seconds regardless of activity)
    if (enablePeriodicSave) {
      const periodicTimer = setTimeout(() => {
        robustSave();
      }, AUTO_SAVE_CONFIG.PERIODIC_SAVE);
      timersRef.current.push(periodicTimer);
    }

    // 2. Critical content save (5 seconds for important fields)
    if (enableCriticalSave && changeState.criticalChanges) {
      const criticalTimer = setTimeout(() => {
        robustSave();
      }, AUTO_SAVE_CONFIG.CRITICAL_CONTENT);
      timersRef.current.push(criticalTimer);
    }

    return clearAllTimers;
  }, [
    autoSaveState.hasUnsavedChanges,
    autoSaveState.isSaving,
    changeState.criticalChanges,
    enablePeriodicSave,
    enableCriticalSave,
    robustSave,
    clearAllTimers,
  ]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setAutoSaveState(prev => ({ ...prev, isOnline: true }));
      
      // Process queued saves when back online
      if (saveQueueRef.current.length > 0) {
        const queue = [...saveQueueRef.current];
        saveQueueRef.current = [];

        queue.forEach(async (queuedSave) => {
          try {
            await queuedSave();
          } catch (error) {
            // Silent error handling
          }
        });
      }
    };

    const handleOffline = () => {
      setAutoSaveState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle app visibility changes (mobile optimization)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden && autoSaveState.hasUnsavedChanges && !autoSaveState.isSaving) {
        await robustSave();
      }
    };

    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      if (autoSaveState.hasUnsavedChanges && !autoSaveState.isSaving) {
        e.preventDefault();
        await robustSave();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [autoSaveState.hasUnsavedChanges, autoSaveState.isSaving, robustSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  return {
    autoSaveState,
    changeState,
    trackChange,
    forceSave: () => robustSave(),
    clearUnsavedChanges: () => {
      setAutoSaveState(prev => ({
        ...prev,
        hasUnsavedChanges: false,
        changeCount: 0,
      }));
      setChangeState({
        hasTextChanges: false,
        hasActionPointChanges: false,
        criticalChanges: false,
      });
    },
  };
}
