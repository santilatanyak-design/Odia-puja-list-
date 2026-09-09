import React, { useState, Suspense, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomePage } from './components/HomePage';
import { AdminPanel } from './components/AdminPanel';
import { AffiliateProductView } from './components/AffiliateProductView';
import { Footer } from './components/Footer';

type ViewMode = 'home' | 'admin' | 'deal' | 'categories' | 'deals';

export default function App() {
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const urlParams = new URLSearchParams(window.location.search);
      const queryDeal = urlParams.get('deal') || urlParams.get('p');
      
      if (queryDeal) {
        return 'deal';
      }
      if (path.startsWith('/admin')) return 'admin';
      if (path.startsWith('/deal/')) {
        return 'deal';
      }
      if (path.startsWith('/categories')) return 'categories';
      if (path.startsWith('/deals')) return 'deals';
    }
    return 'home';
  });

  // Handle direct routing from WhatsApp, Facebook, or external shared links
  useEffect(() => {
    const handleUrlRoute = () => {
      if (typeof window === 'undefined') return;
      
      const path = window.location.pathname;
      const urlParams = new URLSearchParams(window.location.search);
      const queryDeal = urlParams.get('deal') || urlParams.get('p');

      if (queryDeal) {
        setSelectedDealId(queryDeal);
        setViewMode('deal');
        return;
      }

      if (path.startsWith('/deal/')) {
        const id = path.split('/deal/')[1]?.split('?')[0];
        if (id) {
          setSelectedDealId(id);
          setViewMode('deal');
          return;
        }
      }

      if (path.startsWith('/admin')) {
        setViewMode('admin');
        return;
      }

      if (path.startsWith('/categories')) {
        setViewMode('categories');
        return;
      }

      if (path.startsWith('/deals')) {
        setViewMode('deals');
        return;
      }

      setViewMode('home');
    };

    handleUrlRoute();

    window.addEventListener('popstate', handleUrlRoute);
    return () => window.removeEventListener('popstate', handleUrlRoute);
  }, []);

  const navigateToDeal = (dealId: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `/deal/${dealId}`);
    }
    setSelectedDealId(dealId);
    setViewMode('deal');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToHome = () => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
    }
    setSelectedDealId(null);
    setViewMode('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-amber-500/20 flex flex-col justify-between">
      <div>
        {viewMode !== 'admin' && (
          <Navbar
            currentView={viewMode}
            setViewMode={setViewMode}
            onGoHome={navigateToHome}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}
        
        <main>
          <Suspense fallback={<div className="p-8 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">Loading Bhakti Store...</div>}>
            {viewMode === 'admin' ? (
              <AdminPanel
                onBack={navigateToHome}
              />
            ) : viewMode === 'deal' ? (
              <AffiliateProductView 
                productId={selectedDealId || ''} 
                onBack={navigateToHome}
              />
            ) : viewMode === 'categories' ? (
              <div className="min-h-[70vh] flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
                <h2 className="text-3xl font-black text-slate-900 mb-3">Shop by Category</h2>
                <p className="text-slate-500 max-w-md mb-8 text-sm">
                  Browse items categorized into Idols, Puja Thali, Sacred Books, Fragrances, and Temple Offerings.
                </p>
                <button 
                  onClick={navigateToHome} 
                  className="bg-slate-950 text-white px-7 py-3 rounded-full text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
                >
                  Explore All Deals
                </button>
              </div>
            ) : viewMode === 'deals' ? (
              <HomePage
                onNavigateToDeal={navigateToDeal}
                onNavigateToCategories={() => setViewMode('categories')}
                searchQuery={searchQuery}
                onClearSearch={() => setSearchQuery('')}
              />
            ) : (
              <HomePage
                onNavigateToDeal={navigateToDeal}
                onNavigateToCategories={() => setViewMode('categories')}
                searchQuery={searchQuery}
                onClearSearch={() => setSearchQuery('')}
              />
            )}
          </Suspense>
        </main>
      </div>

      {viewMode !== 'admin' && <Footer />}
    </div>
  );
}
