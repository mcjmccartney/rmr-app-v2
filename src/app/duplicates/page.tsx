'use client';

import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';

export default function DuplicatesPage() {
  const { state, dismissDuplicate } = useApp();
  const router = useRouter();

  const handleDismiss = (duplicateId: string) => {
    if (window.confirm('Are you sure you want to dismiss this potential duplicate? This action cannot be undone.')) {
      dismissDuplicate(duplicateId);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#ebeadf' }}>
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-2"
          >
            ← Back
          </button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Potential Duplicate Clients
          </h1>
          <p className="text-gray-600">
            {state.potentialDuplicates.length} potential duplicates found
          </p>
        </div>

        <div className="px-6 pb-6 max-w-4xl mx-auto">
          {state.potentialDuplicates.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-lg font-medium text-gray-900 mb-2">No Duplicate Clients Found</h2>
              <p className="text-gray-600">
                Your client database appears to be clean with no potential duplicates detected.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {state.potentialDuplicates.map((duplicate) => (
                <div key={duplicate.id} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {duplicate.dogName}
                    </h3>
                    <button
                      onClick={() => handleDismiss(duplicate.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Primary Client</h4>
                      <p>{duplicate.primaryClient.firstName} {duplicate.primaryClient.lastName}</p>
                      <p className="text-sm text-gray-600">{duplicate.primaryClient.email}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Potential Duplicate</h4>
                      <p>{duplicate.duplicateClient.firstName} {duplicate.duplicateClient.lastName}</p>
                      <p className="text-sm text-gray-600">{duplicate.duplicateClient.email}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">
                      Match reasons: {duplicate.matchReasons.join(', ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

  const handleDismiss = (duplicateId: string) => {
    if (window.confirm('Are you sure you want to dismiss this potential duplicate? This action cannot be undone.')) {
      dismissDuplicate(duplicateId);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#ebeadf' }}>
      {/* Header */}
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Back
          </button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Potential Duplicate Clients
          </h1>
          <p className="text-gray-600">
            {state.potentialDuplicates.length} potential duplicates found
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-6 max-w-4xl mx-auto">
        {state.potentialDuplicates.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-lg font-medium text-gray-900 mb-2">No Duplicate Clients Found</h2>
            <p className="text-gray-600">
              Your client database appears to be clean with no potential duplicates detected.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Duplicate Cards */}
            {state.potentialDuplicates.map((duplicate) => (
              <DuplicateCard
                key={duplicate.id}
                duplicate={duplicate}
                onDismiss={() => handleDismiss(duplicate.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface DuplicateCardProps {
  duplicate: PotentialDuplicate;
  onDismiss: () => void;
}

function DuplicateCard({ duplicate, onDismiss }: DuplicateCardProps) {
  const { primaryClient, duplicateClient, matchReasons, confidence, dogName } = duplicate;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-medium text-gray-900">
            {dogName}
          </h3>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            confidence === 'high' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
          }`}>
            {confidence.toUpperCase()} CONFIDENCE
          </span>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Dismiss this potential duplicate"
        >
          <X size={16} className="text-gray-400" />
        </button>
      </div>

      {/* Client Comparison */}
      <div className="p-6">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Primary Client */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Primary Client</h4>
            <ClientInfo client={primaryClient} />
          </div>

          {/* Duplicate Client */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Potential Duplicate</h4>
            <ClientInfo client={duplicateClient} />
          </div>
        </div>

        {/* Match Reasons */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <h5 className="font-medium text-gray-900 mb-3">Match Reasons</h5>
          <div className="space-y-1">
            {matchReasons.map((reason, index) => (
              <div key={index} className="text-sm text-gray-600">
                {reason}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            className="flex-1 py-2 px-4 rounded font-medium transition-colors text-white"
            style={{ backgroundColor: '#973b00' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7a2f00'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#973b00'}
            onClick={() => alert('Merge functionality coming soon!')}
          >
            Merge Clients
          </button>
          <button
            onClick={onDismiss}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
          >
            Not a Duplicate
          </button>
        </div>
      </div>
    </div>
  );
}

interface ClientInfoProps {
  client: any;
}

function ClientInfo({ client }: ClientInfoProps) {
  return (
    <div className="space-y-3 text-sm">
      <div>
        <div className="font-medium text-gray-900">
          {client.firstName} {client.lastName}
        </div>
      </div>
      {client.email && (
        <div>
          <span className="text-gray-500">Email</span>
          <div className="text-gray-900">{client.email}</div>
        </div>
      )}
      {client.phone && (
        <div>
          <span className="text-gray-500">Phone</span>
          <div className="text-gray-900">{client.phone}</div>
        </div>
      )}
      {client.address && (
        <div>
          <span className="text-gray-500">Address</span>
          <div className="text-gray-900">{client.address}</div>
        </div>
      )}
      {client.dogName && (
        <div>
          <span className="text-gray-500">Dog</span>
          <div className="text-gray-900">{client.dogName}</div>
        </div>
      )}
      <div className="text-xs text-gray-400 mt-3 pt-2 border-t border-gray-100">
        ID: {client.id.substring(0, 8)}...
      </div>
    </div>
  );
}
