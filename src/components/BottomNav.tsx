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
      className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-[#701a1e] via-[#8B0000] to-[#701a1e] text-white border-t border-amber-400/40 shadow-[0_-2px_10px_rgba(0,0,0,0.25)]"
    >
      <div className="max-w-md md:max-w-xl mx-auto px-3 h-12 flex items-center justify-around">
        {/* 1. Home Tab */}
        <button
          id="bottom-nav-home"
          type="button"
          onClick={onNavigateHome}
          className={`flex flex-col items-center justify-center flex-1 py-0.5 transition-colors duration-150 cursor-pointer ${
            isHomeActive
              ? 'text-amber-300 font-extrabold'
              : 'text-amber-100/75 hover:text-white font-medium'
          }`}
        >
          <Home className={`w-4.5 h-4.5 ${isHomeActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] tracking-tight mt-0.5">Home</span>
        </button>

        {/* 2. Bookings Tab */}
        <button
          id="bottom-nav-bookings"
          type="button"
          onClick={onNavigateBookings}
          className={`flex flex-col items-center justify-center flex-1 py-0.5 transition-colors duration-150 cursor-pointer ${
            currentView === 'portal'
              ? 'text-amber-300 font-extrabold'
              : 'text-amber-100/75 hover:text-white font-medium'
          }`}
        >
          <CalendarCheck className={`w-4.5 h-4.5 ${currentView === 'portal' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] tracking-tight mt-0.5">Bookings</span>
        </button>

        {/* 3. Temples Tab */}
        <button
          id="bottom-nav-temples"
          type="button"
          onClick={onNavigateTemples}
          className={`flex flex-col items-center justify-center flex-1 py-0.5 transition-colors duration-150 cursor-pointer ${
            currentView === 'temple'
              ? 'text-amber-300 font-extrabold'
              : 'text-amber-100/75 hover:text-white font-medium'
          }`}
        >
          <Landmark className={`w-4.5 h-4.5 ${currentView === 'temple' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] tracking-tight mt-0.5">Temples</span>
        </button>

        {/* 4. Profile Tab */}
        <button
          id="bottom-nav-profile"
          type="button"
          onClick={onNavigateProfile}
          className={`flex flex-col items-center justify-center flex-1 py-0.5 transition-colors duration-150 cursor-pointer ${
            currentView === 'login' || (currentView === 'portal' && activePujari)
              ? 'text-amber-300 font-extrabold'
              : 'text-amber-100/75 hover:text-white font-medium'
          }`}
        >
          <div className="relative">
            <User className={`w-4.5 h-4.5 ${currentView === 'login' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            {activePujari && (
              <span className="absolute -top-0.5 -right-1 w-1.5 h-1.5 bg-emerald-400 border border-[#8B0000] rounded-full" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Profile</span>
        </button>
      </div>
    </nav>
  );
};
