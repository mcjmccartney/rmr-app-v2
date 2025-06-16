'use client';

import { useApp } from '@/context/AppContext';
import { PotentialDuplicate } from '@/types';
import { ArrowLeft, Users, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DuplicatesPage() {
  const { state, dismissDuplicate } = useApp();
  const router = useRouter();

  const handleDismiss = (duplicateId: string) => {
    if (window.confirm('Are you sure you want to dismiss this potential duplicate? This action cannot be undone.')) {
      dismissDuplicate(duplicateId);
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-amber-600 bg-amber-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case 'high': return <AlertTriangle size={16} className="text-red-600" />;
      case 'medium': return <AlertTriangle size={16} className="text-amber-600" />;
      case 'low': return <CheckCircle size={16} className="text-blue-600" />;
      default: return <CheckCircle size={16} className="text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <Users size={24} className="text-amber-600" />
              <h1 className="text-xl font-semibold text-gray-900">
                Potential Duplicate Clients
              </h1>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {state.potentialDuplicates.length} potential duplicates found
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-4xl mx-auto">
        {state.potentialDuplicates.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">No Duplicate Clients Found</h2>
            <p className="text-gray-500">
              Great! Your client database appears to be clean with no potential duplicates detected.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Review Instructions</h3>
              <p className="text-sm text-blue-800">
                Review each potential duplicate below. High confidence matches are likely the same client with different contact details. 
                You can merge clients or dismiss false positives.
              </p>
            </div>

            {/* Duplicate Cards */}
            {state.potentialDuplicates.map((duplicate) => (
              <DuplicateCard
                key={duplicate.id}
                duplicate={duplicate}
                onDismiss={() => handleDismiss(duplicate.id)}
                getConfidenceColor={getConfidenceColor}
                getConfidenceIcon={getConfidenceIcon}
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
  getConfidenceColor: (confidence: string) => string;
  getConfidenceIcon: (confidence: string) => JSX.Element;
}

function DuplicateCard({ duplicate, onDismiss, getConfidenceColor, getConfidenceIcon }: DuplicateCardProps) {
  const { primaryClient, duplicateClient, matchReasons, confidence, dogName } = duplicate;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-lg font-semibold text-gray-900">
            Dog: {dogName}
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getConfidenceColor(confidence)}`}>
            {getConfidenceIcon(confidence)}
            {confidence.toUpperCase()} CONFIDENCE
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          title="Dismiss this potential duplicate"
        >
          <X size={16} className="text-gray-400" />
        </button>
      </div>

      {/* Client Comparison */}
      <div className="p-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Primary Client */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-gray-900">Primary Client</h4>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">KEEP</span>
            </div>
            <ClientInfo client={primaryClient} />
          </div>

          {/* Duplicate Client */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-gray-900">Potential Duplicate</h4>
              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">MERGE</span>
            </div>
            <ClientInfo client={duplicateClient} />
          </div>
        </div>

        {/* Match Reasons */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <h5 className="font-medium text-gray-900 mb-2">Match Reasons:</h5>
          <div className="flex flex-wrap gap-2">
            {matchReasons.map((reason, index) => (
              <span
                key={index}
                className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded"
              >
                {reason}
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            onClick={() => alert('Merge functionality coming soon!')}
          >
            Merge Clients
          </button>
          <button
            onClick={onDismiss}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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
    <div className="space-y-2 text-sm">
      <div>
        <span className="font-medium text-gray-900">
          {client.firstName} {client.lastName}
        </span>
      </div>
      {client.email && (
        <div className="text-gray-600">
          📧 {client.email}
        </div>
      )}
      {client.phone && (
        <div className="text-gray-600">
          📞 {client.phone}
        </div>
      )}
      {client.address && (
        <div className="text-gray-600">
          📍 {client.address}
        </div>
      )}
      {client.dogName && (
        <div className="text-gray-600">
          🐕 {client.dogName}
        </div>
      )}
      <div className="text-xs text-gray-500 mt-2">
        Client ID: {client.id.substring(0, 8)}...
      </div>
    </div>
  );
}
