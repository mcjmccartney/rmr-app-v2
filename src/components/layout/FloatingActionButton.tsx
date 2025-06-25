'use client';

import { useState } from 'react';
import { Calendar, Edit3, Star, Users, PieChart, Menu, X } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useModal } from '@/context/ModalContext';


const navItems = [
  { icon: Calendar, label: 'Calendar', path: '/calendar' },
  { icon: Edit3, label: 'Sessions', path: '/sessions' },
  { icon: Star, label: 'Memberships', path: '/memberships' },
  { icon: Users, label: 'Clients', path: '/clients' },
  { icon: PieChart, label: 'Finances', path: '/finances' },
];

export default function FloatingActionButton() {
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { isAnyModalOpen } = useModal();

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsExpanded(false);
  };

  // Hide FAB when any modal is open or on form pages
  if (isAnyModalOpen || pathname === '/behavioural-brief' || pathname === '/behaviour-questionnaire' || pathname === '/booking-terms') {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-300"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Navigation Items */}
      {isExpanded && (
        <div className={`fixed right-6 z-50 flex flex-col-reverse gap-3 ${pathname === '/calendar' ? 'bottom-88' : 'bottom-24'}`}>
          {navItems.map(({ icon: Icon, label, path }, index) => {
            const isActive = pathname === path;
            const delay = index * 50; // Stagger animation

            return (
              <button
                key={path}
                onClick={() => handleNavigation(path)}
                className={`
                  flex items-center justify-center w-12 h-12 rounded-full shadow-lg
                  transition-all duration-300 transform hover:scale-110
                  ${isActive
                    ? 'bg-amber-800 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                  }
                `}
                style={{
                  animationDelay: `${delay}ms`,
                  animation: 'slideInUp 0.3s ease-out forwards'
                }}
                title={label}
              >
                <Icon size={20} />
              </button>
            );
          })}
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={toggleExpanded}
        className={`
          fixed right-6 z-50 w-14 h-14 rounded-full shadow-lg
          flex items-center justify-center
          transition-all duration-300 transform hover:scale-110 active:scale-95
          ${isExpanded
            ? 'bg-gray-600 text-white'
            : 'bg-amber-800 text-white'
          }
          ${pathname === '/calendar' ? 'bottom-70' : 'bottom-6'}
        `}
      >
        {isExpanded ? (
          <X size={24} className="transition-transform duration-300" />
        ) : (
          <Menu size={24} className="transition-transform duration-300" />
        )}
      </button>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes slideInUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
