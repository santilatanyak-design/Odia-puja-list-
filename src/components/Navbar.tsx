import React, { useState } from 'react';
import { Search, Menu, X, Shield, Sparkles, ShoppingBag } from 'lucide-react';

interface NavbarProps {
  onGoHome: () => void;
  currentView: string;
  setViewMode: (mode: any) => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
}

export function Navbar({ onGoHome, currentView, setViewMode, searchQuery = '', setSearchQuery }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (mode: string) => {
    setViewMode(mode);
    setMobileMenuOpen(false);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', mode === 'home' ? '/' : `/${mode}`);
    }
  };

  return (
    <header className="bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200/80 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center gap-4">
          
          {/* Brand Logo */}
          <div 
            onClick={() => handleNav('home')}
            className="flex items-center gap-3 cursor-pointer select-none group shrink-0"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-amber-600 flex items-center justify-center text-amber-400 shadow-md group-hover:scale-105 transition-transform duration-300">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 group-hover:text-amber-600 transition-colors">
                  Bhakti Store
                </h1>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 rounded-md">
                  Affiliate
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-bold tracking-wide uppercase hidden sm:block">
                Verified Spiritual Deals
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-2 sm:mx-6 min-w-0">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="h-4 w-4 shrink-0" />
              </div>
              <input
                id="navbar-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchQuery?.(val);
                  if (val && currentView !== 'home' && currentView !== 'deals') {
                    setViewMode('home');
                  }
                }}
                placeholder="Search products, idols, puja items..."
                className="block w-full pl-10 pr-10 py-2.5 bg-slate-100 hover:bg-slate-100/90 focus:bg-white border border-slate-300 focus:border-amber-500 rounded-full text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all shadow-2xs focus:ring-2 focus:ring-amber-500/20"
                autoComplete="off"
                spellCheck="false"
              />
              {searchQuery.length > 0 && (
                <button
                  type="button"
                  id="navbar-search-clear-button"
                  onClick={() => setSearchQuery?.('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  aria-label="Clear search input"
                  title="Clear search"
                >
                  <span className="w-6 h-6 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Desktop Links */}
          <nav className="hidden md:flex items-center gap-7 shrink-0">
            <button
              onClick={() => handleNav('home')}
              className={`text-sm font-bold transition-colors cursor-pointer ${
                currentView === 'home' ? 'text-amber-600' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => handleNav('deals')}
              className={`text-sm font-bold transition-colors cursor-pointer ${
                currentView === 'deals' ? 'text-amber-600' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              All Deals
            </button>
            <button
              onClick={() => handleNav('categories')}
              className={`text-sm font-bold transition-colors cursor-pointer ${
                currentView === 'categories' ? 'text-amber-600' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Categories
            </button>
            <button
              onClick={() => handleNav('admin')}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full text-xs font-black transition-colors cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-amber-600" />
              <span>Admin</span>
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown (Top Navigation only - strictly NO bottom bar) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white shadow-xl px-4 pt-3 pb-5 space-y-2 animate-in slide-in-from-top duration-200">
          <button
            onClick={() => handleNav('home')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
              currentView === 'home' ? 'bg-amber-50 text-amber-700' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => handleNav('deals')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
              currentView === 'deals' ? 'bg-amber-50 text-amber-700' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            All Deals
          </button>
          <button
            onClick={() => handleNav('categories')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
              currentView === 'categories' ? 'bg-amber-50 text-amber-700' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            Categories
          </button>
          <button
            onClick={() => handleNav('admin')}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              AWS Admin Portal
            </span>
            <span className="text-[10px] text-amber-400 font-mono">Cognito Locked</span>
          </button>
        </div>
      )}
    </header>
  );
}
