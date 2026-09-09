import React from 'react';
import { Search, Menu } from 'lucide-react';

export function Navbar({ onGoHome, currentView, setViewMode }: any) {
  return (
    <nav className="bg-white sticky top-0 z-50 border-b border-gray-100 shadow-sm backdrop-blur-md bg-white/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Brand */}
          <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={onGoHome}>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Bhakti Store</h1>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <button onClick={onGoHome} className={`text-sm font-semibold transition-colors ${currentView === 'home' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}>Home</button>
            <button onClick={() => setViewMode('categories')} className={`text-sm font-semibold transition-colors ${currentView === 'categories' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}>Categories</button>
            <button onClick={() => setViewMode('deals')} className={`text-sm font-semibold transition-colors ${currentView === 'deals' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}>Deals</button>
            <button onClick={() => {}} className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">Contact</button>
          </div>

          {/* Search & Actions */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:block relative w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-full leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 focus:ring-0 sm:text-sm transition-colors"
                placeholder="Search premium products..."
              />
            </div>
            
            {/* Mobile Menu Icon */}
            <button className="md:hidden text-slate-700">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
