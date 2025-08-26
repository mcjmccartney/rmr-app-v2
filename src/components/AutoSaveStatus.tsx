import React from 'react';
import { AutoSaveState, ChangeState } from '@/hooks/useRobustAutoSave';

interface AutoSaveStatusProps {
  autoSaveState: AutoSaveState;
  changeState: ChangeState;
  className?: string;
}

export function AutoSaveStatus({ autoSaveState, changeState, className = '' }: AutoSaveStatusProps) {
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffSeconds < 60) {
      return 'just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getStatusDisplay = () => {
    // Offline status
    if (!autoSaveState.isOnline) {
      return (
        <div className="flex items-center text-amber-600">
          <span className="mr-1">📵</span>
          <span>Offline - changes will sync when reconnected</span>
        </div>
      );
    }

    // Saving status
    if (autoSaveState.isSaving) {
      return (
        <div className="flex items-center text-blue-600">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
          <span>Saving... ({autoSaveState.changeCount} changes)</span>
        </div>
      );
    }

    // Save error status
    if (autoSaveState.saveError) {
      return (
        <div className="flex items-center text-red-600">
          <span className="mr-1">⚠️</span>
          <span>Save failed - retrying... (attempt {autoSaveState.failedSaveCount})</span>
        </div>
      );
    }

    // Unsaved changes status
    if (autoSaveState.hasUnsavedChanges) {
      const timeSinceChange = autoSaveState.lastChangeTime 
        ? Date.now() - autoSaveState.lastChangeTime 
        : 0;

      // Show typing indicator for recent changes
      if (timeSinceChange < 2000) {
        return (
          <div className="flex items-center text-amber-600">
            <span className="mr-1">✏️</span>
            <span>Typing...</span>
          </div>
        );
      }

      // Show unsaved changes with details
      const changeDetails = [];
      if (changeState.hasTextChanges) changeDetails.push('text');
      if (changeState.hasActionPointChanges) changeDetails.push('action points');
      
      return (
        <div className="flex items-center text-amber-600">
          <span className="mr-1">●</span>
          <span>
            {autoSaveState.changeCount} unsaved change{autoSaveState.changeCount !== 1 ? 's' : ''}
            {changeDetails.length > 0 && ` (${changeDetails.join(', ')})`}
            {changeState.criticalChanges && ' - saving soon...'}
          </span>
        </div>
      );
    }

    // Saved status
    if (autoSaveState.lastSaved) {
      return (
        <div className="flex items-center text-green-600">
          <span className="mr-1">✅</span>
          <span>Saved {formatTimeAgo(autoSaveState.lastSaved)}</span>
        </div>
      );
    }

    // Default ready status
    return (
      <div className="flex items-center text-gray-500">
        <span className="mr-1">💾</span>
        <span>Ready</span>
      </div>
    );
  };

  return (
    <div className={`text-xs ${className}`}>
      {getStatusDisplay()}
    </div>
  );
}

// Additional component for detailed save statistics (optional)
export function AutoSaveDetails({ autoSaveState, changeState }: AutoSaveStatusProps) {
  if (!autoSaveState.hasUnsavedChanges && !autoSaveState.lastSaved) {
    return null;
  }

  return (
    <div className="text-xs text-gray-500 mt-1 space-y-1">
      {autoSaveState.lastSaved && (
        <div>Last saved: {autoSaveState.lastSaved.toLocaleTimeString()}</div>
      )}
      
      {autoSaveState.changeCount > 0 && (
        <div>Changes made: {autoSaveState.changeCount}</div>
      )}
      
      {autoSaveState.failedSaveCount > 0 && (
        <div className="text-amber-600">
          Failed attempts: {autoSaveState.failedSaveCount}
        </div>
      )}
      
      {(changeState.hasTextChanges || changeState.hasActionPointChanges) && (
        <div>
          Modified: {[
            changeState.hasTextChanges && 'text fields',
            changeState.hasActionPointChanges && 'action points'
          ].filter(Boolean).join(', ')}
        </div>
      )}
    </div>
  );
}
