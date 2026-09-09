const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf-8');

// Strip out unused legacy routing logic from App.tsx completely.
const newApp = `
import React, { useState, Suspense, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomePage } from './components/HomePage';
import { AdminPanel } from './components/AdminPanel';
import { AffiliateProductView } from './components/AffiliateProductView';
import { Footer } from './components/Footer';

type ViewMode = 'home' | 'admin' | 'deal' | 'categories' | 'deals';

export default function App() {
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/admin')) return 'admin';
      if (path.startsWith('/deal/')) {
        return 'deal';
      }
    }
    return 'home';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/deal/')) {
        const id = path.split('/deal/')[1];
        if (id) setSelectedDealId(id);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-slate-900/10">
      {viewMode !== 'admin' && (
        <Navbar
          currentView={viewMode}
          setViewMode={setViewMode}
          onGoHome={() => setViewMode('home')}
        />
      )}
      <main className={viewMode !== 'admin' ? "pt-0" : ""}>
        <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
            {viewMode === 'admin' ? (
              <AdminPanel
                onBack={() => {
                  if (typeof window !== 'undefined') window.history.pushState({}, '', '/');
                  setViewMode('home');
                }}
              />
            ) : viewMode === 'deal' ? (
              <AffiliateProductView 
                productId={selectedDealId || ''} 
                onBack={() => {
                  if (typeof window !== 'undefined') window.history.pushState({}, '', '/');
                  setViewMode('home');
                }}
              />
            ) : viewMode === 'categories' ? (
              <div className="min-h-[70vh] flex flex-col items-center justify-center bg-slate-50">
                <h2 className="text-3xl font-black text-slate-900 mb-4">Categories</h2>
                <p className="text-slate-500 mb-8">Our premium categories are being updated.</p>
                <button onClick={() => setViewMode('home')} className="bg-slate-900 text-white px-6 py-2 rounded-full font-semibold">Back to Home</button>
              </div>
            ) : viewMode === 'deals' ? (
              <div className="min-h-[70vh] flex flex-col items-center justify-center bg-slate-50">
                <h2 className="text-3xl font-black text-slate-900 mb-4">All Deals</h2>
                <p className="text-slate-500 mb-8">Browse all our premium deals soon.</p>
                <button onClick={() => setViewMode('home')} className="bg-slate-900 text-white px-6 py-2 rounded-full font-semibold">Back to Home</button>
              </div>
            ) : (
              <HomePage
                onNavigateToDeal={(dealId: string) => {
                  if (typeof window !== 'undefined') window.history.pushState({}, '', '/deal/' + dealId);
                  setSelectedDealId(dealId);
                  setViewMode('deal');
                }}
                onNavigateToCategories={() => setViewMode('categories')}
              />
            )}
        </Suspense>
      </main>
      {viewMode !== 'admin' && <Footer />}
    </div>
  );
}
`;

fs.writeFileSync('src/App.tsx', newApp);
