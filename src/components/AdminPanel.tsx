import React, { useState } from 'react';
import { PackageOpen, ArrowLeft, Image, LogOut } from 'lucide-react';
import { AdminAffiliateManagement } from './AdminAffiliateManagement';
import { AdminSliderManagement } from './AdminSliderManagement';

type AdminTab = 'affiliate' | 'sliders';

interface AdminPanelProps {
  onBack: () => void;
  onLogout?: () => void;
  lang?: string;
}

export function AdminPanel({ onBack, onLogout }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('affiliate');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Header */}
      <div className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-300" />
              </button>
              <h1 className="text-xl font-bold tracking-tight">Admin Control Panel</h1>
            </div>
            {onLogout && (
              <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 hover:bg-slate-800 rounded-full transition-colors text-sm font-medium text-slate-300">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden sticky top-24">
            <nav className="flex flex-col">
              <button
                onClick={() => setActiveTab('affiliate')}
                className={`flex items-center gap-3 px-6 py-4 text-sm font-semibold transition-colors ${
                  activeTab === 'affiliate' 
                    ? 'bg-slate-50 text-slate-900 border-l-4 border-slate-900' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent'
                }`}
              >
                <PackageOpen className="w-5 h-5" /> Affiliate Products
              </button>
              
              <button
                onClick={() => setActiveTab('sliders')}
                className={`flex items-center gap-3 px-6 py-4 text-sm font-semibold transition-colors border-t border-slate-100 ${
                  activeTab === 'sliders' 
                    ? 'bg-slate-50 text-slate-900 border-l-4 border-slate-900' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent'
                }`}
              >
                <Image className="w-5 h-5" /> Hero / Promo Banners
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 min-h-[500px]">
          {activeTab === 'affiliate' && <AdminAffiliateManagement />}
          {activeTab === 'sliders' && <AdminSliderManagement />}
        </div>

      </div>
    </div>
  );
}
