'use client';

import { Search, Plus } from 'lucide-react';
import { useState } from 'react';

interface HeaderButton {
  icon: React.ComponentType<{ size?: number }>;
  onClick: () => void;
  title: string;
  isActive?: boolean;
  iconOnly?: boolean;
}

interface HeaderProps {
  title: string;
  showAddButton?: boolean;
  onAddClick?: () => void;
  addButtonText?: string;
  buttons?: HeaderButton[];
  showSearch?: boolean;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  noBottomMargin?: boolean; // New prop to remove bottom margin
}

export default function Header({
  title,
  showAddButton = false,
  onAddClick,
  addButtonText = 'Add',
  buttons = [],
  showSearch = false,
  onSearch,
  searchPlaceholder = 'Search',
  noBottomMargin = false,
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  return (
    <div className="bg-amber-800 text-white px-4 pb-3 safe-area-pt">
      {/* Top row with title and buttons */}
      <div className={`flex items-center justify-between ${noBottomMargin ? 'mb-0' : 'mb-3'}`}>
        <h1 className="text-3xl font-semibold">{title}</h1>
        <div className="flex items-center gap-2">
          {/* Legacy single button support */}
          {showAddButton && !buttons.length && (
            <button
              onClick={onAddClick}
              className="text-white p-2 rounded-md transition-colors"
              style={{ backgroundColor: '#973b00' }}
              title={addButtonText}
            >
              <Plus size={20} />
            </button>
          )}

          {/* New multiple buttons support */}
          {buttons.map((button, index) => {
            const IconComponent = button.icon;
            return (
              <button
                key={index}
                onClick={button.onClick}
                className={`text-white p-2 rounded-md transition-colors hover:opacity-90 ${
                  button.isActive ? 'ring-2 ring-white/50' : ''
                }`}
                style={{
                  backgroundColor: button.isActive ? '#e17100' : '#973b00'
                }}
                title={button.title}
              >
                <IconComponent size={20} />
                {!button.iconOnly && (
                  <span className="ml-1 text-sm">{button.title}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={searchPlaceholder}
            className="w-full bg-white/20 placeholder-white/60 text-white px-10 py-3 rounded-lg focus:outline-none focus:bg-white/30 transition-colors"
          />
        </div>
      )}
    </div>
  );
}
