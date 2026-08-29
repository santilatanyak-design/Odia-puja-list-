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
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md text-slate-600 border-t border-slate-200/90 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]"
    >
      <div className="max-w-md md:max-w-xl mx-auto px-3 h-14 flex items-center justify-around">
        {/* 1. Home Tab */}
        <button
          id="bottom-nav-home"
          type="button"
          onClick={onNavigateHome}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors duration-150 cursor-pointer ${
            isHomeActive
              ? 'text-orange-600 font-black'
              : 'text-slate-400 hover:text-slate-700 font-semibold'
          }`}
        >
          <Home className={`w-5 h-5 ${isHomeActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] tracking-tight mt-0.5">Home</span>
        </button>

        {/* 2. Bookings Tab */}
        <button
          id="bottom-nav-bookings"
          type="button"
          onClick={onNavigateBookings}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors duration-150 cursor-pointer ${
            currentView === 'portal'
              ? 'text-orange-600 font-black'
              : 'text-slate-400 hover:text-slate-700 font-semibold'
          }`}
        >
          <CalendarCheck className={`w-5 h-5 ${currentView === 'portal' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] tracking-tight mt-0.5">Bookings</span>
        </button>

        {/* 3. Temples Tab */}
        <button
          id="bottom-nav-temples"
          type="button"
          onClick={onNavigateTemples}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors duration-150 cursor-pointer ${
            currentView === 'temple'
              ? 'text-orange-600 font-black'
              : 'text-slate-400 hover:text-slate-700 font-semibold'
          }`}
        >
          <Landmark className={`w-5 h-5 ${currentView === 'temple' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] tracking-tight mt-0.5">Temples</span>
        </button>

        {/* 4. Profile Tab */}
        <button
          id="bottom-nav-profile"
          type="button"
          onClick={onNavigateProfile}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors duration-150 cursor-pointer ${
            currentView === 'login' || (currentView === 'portal' && activePujari)
              ? 'text-orange-600 font-black'
              : 'text-slate-400 hover:text-slate-700 font-semibold'
          }`}
        >
          <div className="relative">
            <User className={`w-5 h-5 ${currentView === 'login' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            {activePujari && (
              <span className="absolute -top-0.5 -right-1 w-2 h-2 bg-emerald-500 border-2 border-white rounded-full" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Profile</span>
        </button>
      </div>
    </nav>
  );
};
