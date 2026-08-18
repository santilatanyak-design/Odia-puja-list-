import React from 'react';
import { Home, CalendarCheck, Landmark, User, ShieldCheck } from 'lucide-react';
import { Pujari } from '../types';

interface BottomNavProps {
  currentView: string;
  activePujari: Pujari | null;
  onNavigateHome: () => void;
  onNavigateBookings: () => void;
  onNavigateTemples: () => void;
  onNavigateProfile: () => void;
  onOpenAdminModal?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  activePujari,
  onNavigateHome,
  onNavigateBookings,
  onNavigateTemples,
  onNavigateProfile,
}) => {
  // Determine active bottom tab based on currentView
  const isHomeActive = currentView === 'home';
  const isBookingsActive = currentView === 'temple' || currentView === 'portal';
  const isTemplesActive = currentView === 'temple';
  const isProfileActive = currentView === 'login' || currentView === 'portal';

  return (
    <nav
      id="native-app-bottom-nav"
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-[#701a1e] via-[#8B0000] to-[#701a1e] text-white border-t border-amber-400/40 shadow-[0_-4px_20px_rgba(0,0,0,0.3)] pb-safe"
    >
      <div className="max-w-md md:max-w-xl mx-auto px-4 h-16 flex items-center justify-around">
        {/* 1. Home Tab */}
        <button
          id="bottom-nav-home"
          type="button"
          onClick={onNavigateHome}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 cursor-pointer ${
            isHomeActive
              ? 'text-amber-300 font-black scale-105'
              : 'text-amber-100/75 hover:text-white font-medium'
          }`}
        >
          <div className="relative">
            <Home className={`w-5 h-5 sm:w-6 sm:h-6 ${isHomeActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            {isHomeActive && (
              <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-amber-400 rounded-full shadow-xs shadow-amber-300" />
            )}
          </div>
          <span className="text-[11px] sm:text-xs tracking-tight mt-0.5">Home</span>
        </button>

        {/* 2. Bookings Tab */}
        <button
          id="bottom-nav-bookings"
          type="button"
          onClick={onNavigateBookings}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 cursor-pointer ${
            currentView === 'portal'
              ? 'text-amber-300 font-black scale-105'
              : 'text-amber-100/75 hover:text-white font-medium'
          }`}
        >
          <div className="relative">
            <CalendarCheck className={`w-5 h-5 sm:w-6 sm:h-6 ${currentView === 'portal' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            {currentView === 'portal' && (
              <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-amber-400 rounded-full shadow-xs shadow-amber-300" />
            )}
          </div>
          <span className="text-[11px] sm:text-xs tracking-tight mt-0.5">Bookings</span>
        </button>

        {/* 3. Temples Tab */}
        <button
          id="bottom-nav-temples"
          type="button"
          onClick={onNavigateTemples}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 cursor-pointer ${
            currentView === 'temple'
              ? 'text-amber-300 font-black scale-105'
              : 'text-amber-100/75 hover:text-white font-medium'
          }`}
        >
          <div className="relative">
            <Landmark className={`w-5 h-5 sm:w-6 sm:h-6 ${currentView === 'temple' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            {currentView === 'temple' && (
              <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-amber-400 rounded-full shadow-xs shadow-amber-300" />
            )}
          </div>
          <span className="text-[11px] sm:text-xs tracking-tight mt-0.5">Temples</span>
        </button>

        {/* 4. Profile Tab */}
        <button
          id="bottom-nav-profile"
          type="button"
          onClick={onNavigateProfile}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 cursor-pointer ${
            currentView === 'login' || (currentView === 'portal' && activePujari)
              ? 'text-amber-300 font-black scale-105'
              : 'text-amber-100/75 hover:text-white font-medium'
          }`}
        >
          <div className="relative">
            <User className={`w-5 h-5 sm:w-6 sm:h-6 ${currentView === 'login' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            {activePujari && (
              <span className="absolute -top-0.5 -right-1 w-2 h-2 bg-emerald-400 border border-[#8B0000] rounded-full" />
            )}
            {(currentView === 'login') && (
              <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-amber-400 rounded-full shadow-xs shadow-amber-300" />
            )}
          </div>
          <span className="text-[11px] sm:text-xs tracking-tight mt-0.5">
            {activePujari ? 'Profile' : 'Profile'}
          </span>
        </button>
      </div>
    </nav>
  );
};
