'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
}

export default function PullToRefresh({ onRefresh, children, className = '' }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  const PULL_THRESHOLD = 80; // Distance needed to trigger refresh
  const MAX_PULL = 120; // Maximum pull distance

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let touchStartY = 0;
    let touchCurrentY = 0;
    let canPull = false;

    const handleTouchStart = (e: TouchEvent) => {
      // Only allow pull-to-refresh if we're at the top of the page
      if (window.scrollY === 0 && container.scrollTop === 0) {
        touchStartY = e.touches[0].clientY;
        canPull = true;
        startY.current = touchStartY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!canPull || isRefreshing) return;

      touchCurrentY = e.touches[0].clientY;
      const pullDistance = Math.max(0, touchCurrentY - touchStartY);
      
      if (pullDistance > 0) {
        // Prevent default scrolling when pulling down
        e.preventDefault();
        
        // Apply resistance to the pull
        const resistance = Math.min(pullDistance * 0.6, MAX_PULL);
        setPullDistance(resistance);
        setIsPulling(true);
        currentY.current = touchCurrentY;
      }
    };

    const handleTouchEnd = async () => {
      if (!canPull || isRefreshing) return;

      if (pullDistance >= PULL_THRESHOLD) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } catch (error) {
          console.error('Refresh failed:', error);
        } finally {
          setIsRefreshing(false);
        }
      }

      // Reset state
      setPullDistance(0);
      setIsPulling(false);
      canPull = false;
      startY.current = 0;
      currentY.current = 0;
    };

    // Add event listeners
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onRefresh, isRefreshing, pullDistance]);

  const getRefreshIndicatorOpacity = () => {
    if (isRefreshing) return 1;
    return Math.min(pullDistance / PULL_THRESHOLD, 1);
  };

  const getRefreshIndicatorRotation = () => {
    if (isRefreshing) return 'animate-spin';
    return pullDistance >= PULL_THRESHOLD ? 'rotate-180' : '';
  };

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        transform: isPulling || isRefreshing ? `translateY(${Math.min(pullDistance, MAX_PULL)}px)` : 'translateY(0)',
        transition: isPulling ? 'none' : 'transform 0.3s ease-out'
      }}
    >
      {/* Pull to refresh indicator */}
      <div 
        className="absolute top-0 left-0 right-0 flex items-center justify-center z-10"
        style={{
          height: '60px',
          transform: `translateY(-60px)`,
          opacity: getRefreshIndicatorOpacity(),
          transition: isPulling ? 'none' : 'opacity 0.3s ease-out'
        }}
      >
        <div className="flex items-center space-x-2 text-gray-600">
          <div className={`w-5 h-5 ${getRefreshIndicatorRotation()}`}>
            {isRefreshing ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
          </div>
          <span className="text-sm font-medium">
            {isRefreshing 
              ? 'Refreshing...' 
              : pullDistance >= PULL_THRESHOLD 
                ? 'Release to refresh' 
                : 'Pull to refresh'
            }
          </span>
        </div>
      </div>

      {/* Content */}
      <div>
        {children}
      </div>
    </div>
  );
}
