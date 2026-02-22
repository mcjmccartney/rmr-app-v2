'use client';

import { useState, useEffect } from 'react';
import { X, ArrowLeft, ExternalLink } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface DogClubGuidesModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGuides: string[];
  onGuideToggle: (guideId: string) => void;
}

export default function DogClubGuidesModal({
  isOpen,
  onClose,
  selectedGuides,
  onGuideToggle
}: DogClubGuidesModalProps) {
  const { state } = useApp();
  const [guideSearch, setGuideSearch] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredGuides = state.dogClubGuides.filter(guide => {
    if (!guideSearch) return true;
    const searchLower = guideSearch.toLowerCase();
    return guide.title.toLowerCase().includes(searchLower) ||
           guide.url.toLowerCase().includes(searchLower);
  });

  // Mobile: Full screen modal
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        {/* Mobile Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back
            </button>
            <h2 className="text-lg font-semibold text-gray-900">Dog Club Guides</h2>
            <div className="w-16"></div>
          </div>
        </div>

        {/* Mobile Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Search Bar */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search guides..."
              value={guideSearch}
              onChange={(e) => setGuideSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Guides List */}
          <div className="space-y-3">
            {filteredGuides.map(guide => {
              const isSelected = selectedGuides.includes(guide.id);

              return (
                <div
                  key={guide.id}
                  className={`p-4 border rounded-md cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-amber-800 bg-amber-800/10'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => onGuideToggle(guide.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 text-sm">{guide.title}</h3>
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        <ExternalLink size={12} className="mr-1" />
                        <span className="truncate">{guide.url}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredGuides.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No guides found matching your search.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop: Popup modal overlay
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal panel */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-200 rounded-t-lg flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Dog Club Guides</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-4 overflow-hidden flex flex-col">
          {/* Search Bar */}
          <div className="mb-4 flex-shrink-0">
            <input
              type="text"
              placeholder="Search guides..."
              value={guideSearch}
              onChange={(e) => setGuideSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Guides List - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-2">
              {filteredGuides.map(guide => {
                const isSelected = selectedGuides.includes(guide.id);

                return (
                  <div
                    key={guide.id}
                    className={`p-3 border rounded-md cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-amber-800 bg-amber-800/10'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => onGuideToggle(guide.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{guide.title}</h3>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <ExternalLink size={14} className="mr-1" />
                          <span className="truncate">{guide.url}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredGuides.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No guides found matching your search.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
