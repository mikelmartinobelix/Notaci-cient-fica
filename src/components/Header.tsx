import React from 'react';
import { AppSection } from '../types/exercise';

interface HeaderProps {
  activeSection: AppSection;
  onNavigate: (section: AppSection) => void;
  onNewSeries: () => void;
}

const NAV_ITEMS: Array<{ id: AppSection; label: string }> = [
  { id: 'practice', label: 'Pràctica' },
  { id: 'explorer', label: 'Explorador' },
  { id: 'guide', label: 'Guia' },
  { id: 'progress', label: 'Progrés' },
];

export const Header: React.FC<HeaderProps> = ({
  activeSection,
  onNavigate,
  onNewSeries,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => onNavigate('practice')}
          className="font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
        >
          Notació 10
        </button>

        {/* Zone 2: Clean single-line navigation links */}
        <nav
          aria-label="Navegació principal"
          className="hidden md:flex items-center gap-7 text-sm font-medium"
        >
          {NAV_ITEMS.map((item) => {
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`py-1 whitespace-nowrap shrink-0 cursor-pointer transition-colors border-b-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700 ${
                  active
                    ? 'text-slate-900 border-blue-700 font-semibold'
                    : 'text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onNewSeries}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 active:bg-blue-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          >
            Nova sèrie
          </button>
        </div>
      </div>

      {/* Mobile compact secondary nav row */}
      <nav
        aria-label="Navegació mòbil"
        className="md:hidden border-t border-slate-100 px-4 flex items-center justify-around h-11 text-xs font-medium"
      >
        {NAV_ITEMS.map((item) => {
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`px-2 py-2 whitespace-nowrap shrink-0 cursor-pointer border-b-2 transition-colors ${
                active
                  ? 'text-blue-700 border-blue-700 font-semibold'
                  : 'text-slate-600 border-transparent'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
