'use client';

import { useState, useEffect } from 'react';

export default function MigratePage() {
  const [migrationStatus, setMigrationStatus] = useState<{
    migrationNeeded?: boolean;
    columnExists?: boolean;
    message?: string;
    permissionsIssue?: boolean;
    instructions?: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkMigrationStatus();
  }, []);

  const checkMigrationStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/migrate/session-plans');
      const data = await response.json();
      
      if (response.ok) {
        setMigrationStatus(data);
      } else {
        setError(data.error || 'Failed to check migration status');
      }
    } catch (err) {
      setError('Failed to check migration status');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('SQL command copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-800 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking migration status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Database Migration - Session Plans
          </h1>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Cross-Device Action Point Sync
            </h2>
            <p className="text-gray-600 mb-4">
              This migration adds support for syncing edited action points between mobile and desktop devices.
              After running this migration, you'll be able to edit session plan action points on your phone
              and continue editing on your laptop seamlessly.
            </p>
          </div>

          {error && !migrationStatus?.instructions && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="text-red-400">⚠️</div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {migrationStatus && (
            <div className={`border rounded-md p-4 mb-6 ${
              migrationStatus.migrationNeeded
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex">
                <div className={migrationStatus.migrationNeeded ? 'text-yellow-400' : 'text-green-400'}>
                  {migrationStatus.migrationNeeded ? '⚠️' : '✅'}
                </div>
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${
                    migrationStatus.migrationNeeded ? 'text-yellow-800' : 'text-green-800'
                  }`}>
                    {migrationStatus.migrationNeeded ? 'Migration Required' : 'Migration Complete'}
                  </h3>
                  <p className={`text-sm mt-1 ${
                    migrationStatus.migrationNeeded ? 'text-yellow-700' : 'text-green-700'
                  }`}>
                    {migrationStatus.message}
                  </p>
                  {migrationStatus.permissionsIssue && (
                    <p className="text-sm text-yellow-600 mt-2 italic">
                      Note: Cannot automatically verify migration status due to database permissions.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {migrationStatus?.migrationNeeded && migrationStatus.instructions && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                Manual Migration Required
              </h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-blue-800 font-medium">Step 1:</p>
                  <p className="text-blue-700">{migrationStatus.instructions.step1}</p>
                </div>
                
                <div>
                  <p className="text-blue-800 font-medium">Step 2:</p>
                  <p className="text-blue-700">{migrationStatus.instructions.step2}</p>
                </div>
                
                <div>
                  <p className="text-blue-800 font-medium">Step 3:</p>
                  <p className="text-blue-700 mb-2">{migrationStatus.instructions.step3}</p>
                  
                  <div className="bg-gray-900 text-green-400 p-4 rounded-md font-mono text-sm relative">
                    <code>{migrationStatus.instructions.sql}</code>
                    <button
                      onClick={() => copyToClipboard(migrationStatus.instructions.sql)}
                      className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                {migrationStatus.instructions.step4 && (
                  <div>
                    <p className="text-blue-800 font-medium">Step 4:</p>
                    <p className="text-blue-700">{migrationStatus.instructions.step4}</p>
                  </div>
                )}

                {migrationStatus.instructions.note && (
                  <div className="bg-blue-100 border-l-4 border-blue-400 p-3 mt-4">
                    <p className="text-blue-800 text-sm">
                      <strong>Note:</strong> {migrationStatus.instructions.note}
                    </p>
                  </div>
                )}

                <div className="mt-6">
                  <button
                    onClick={checkMigrationStatus}
                    className="bg-amber-800 hover:bg-amber-700 text-white px-4 py-2 rounded-md transition-colors"
                  >
                    Check Status Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {migrationStatus && !migrationStatus.migrationNeeded && (
            <div className="text-center">
              <p className="text-green-600 mb-4">
                ✅ Your database is ready! Cross-device action point sync is now enabled.
              </p>
              <a
                href="/calendar"
                className="bg-amber-800 hover:bg-amber-700 text-white px-6 py-2 rounded-md transition-colors inline-block"
              >
                Go to Calendar
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
