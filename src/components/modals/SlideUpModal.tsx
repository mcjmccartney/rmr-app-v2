'use client';

import { ReactNode, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useModal } from '@/context/ModalContext';

interface SlideUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function SlideUpModal({ isOpen, onClose, title, children }: SlideUpModalProps) {
  const { registerModal, unregisterModal } = useModal();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [modalId] = useState(() => `slide-up-modal-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
      registerModal(modalId);
      // Small delay to trigger animation
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      // Wait for animation to complete before hiding and unregistering
      setTimeout(() => {
        setIsVisible(false);
        document.body.style.overflow = 'unset';
        unregisterModal(modalId);
      }, 300);
    }

    return () => {
      document.body.style.overflow = 'unset';
      unregisterModal(modalId);
    };
  }, [isOpen, registerModal, unregisterModal, modalId]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      unregisterModal(modalId);
      onClose();
    }, 300);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ${
        isAnimating ? 'bg-black/50' : 'bg-black/0'
      }`}
      onClick={handleBackdropClick}
    >
      {/* Mobile: slide up from bottom */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white text-black rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out max-h-[85vh] overflow-hidden md:hidden ${
          isAnimating ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Handle bar */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 overflow-y-auto max-h-[calc(85vh-120px)]">
          {children}
        </div>
      </div>

      {/* Desktop: slide in from right */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-96 bg-white text-black shadow-2xl transition-transform duration-300 ease-out hidden md:flex md:flex-col ${
          isAnimating ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
