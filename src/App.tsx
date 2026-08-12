import React, { useState, useEffect } from 'react';
import { Pujari, QrConfig } from './types';
import { getQrConfig, loginPujari, subscribeQrConfig, subscribePujaris, subscribeSiteLock } from './lib/api';
import { Language } from './lib/translations';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './components/HomePage';
import { PujariLogin } from './components/PujariLogin';
import { PujariPortal } from './components/PujariPortal';
import { StoreView } from './components/StoreView';
import { AdminPanel } from './components/AdminPanel';
import { AdminLoginModal } from './components/AdminLoginModal';
import { SiteLockOverlay } from './components/SiteLockOverlay';

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('puja_app_lang');
    return (saved === 'EN' || saved === 'OD') ? saved : 'OD';
  });
  const [currentRole, setCurrentRole] = useState<'pujari' | 'admin'>('pujari');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('puja_app_admin_auth') === 'true';
  });
  const [activePujari, setActivePujari] = useState<Pujari | null>(null);
  const [adminModalOpen, setAdminModalOpen] = useState(false);

  // View Navigation State: Default view is ALWAYS 'home' on initial page load
  const [viewMode, setViewMode] = useState<'home' | 'login' | 'store' | 'portal'>('home');

  // Global Emergency Site Lock State
  const [isSiteLocked, setIsSiteLocked] = useState<boolean>(() => {
    return localStorage.getItem('puja_app_site_locked') === 'true';
  });

  // Real-time site lock subscription
  useEffect(() => {
    const unsubLock = subscribeSiteLock((locked) => {
      setIsSiteLocked(locked);
    });
    return () => {
      unsubLock();
    };
  }, []);

  // Strict Admin Route Protection Check
  useEffect(() => {
    if (currentRole === 'admin' && !isAdminAuthenticated) {
      setCurrentRole('pujari');
      setAdminModalOpen(true);
    }
  }, [currentRole, isAdminAuthenticated]);

  const toggleLang = () => {
    setLang((prev) => {
      const next = prev === 'OD' ? 'EN' : 'OD';
      localStorage.setItem('puja_app_lang', next);
      return next;
    });
  };
  const [qrConfig, setQrConfig] = useState<QrConfig>({
    newCreationQrUrl: '',
    newCreationUpiId: 'pujasamagri@upi',
    newCreationAmount: 5,
    reDownloadQrUrl: '',
    reDownloadUpiId: 'pujasamagri@upi',
    reDownloadAmount: 2,
  });

  // Load active Pujari session and subscribe to QR config and Pujaris on initial mount
  useEffect(() => {
    initApp();

    const unsubQr = subscribeQrConfig((config) => {
      setQrConfig(config);
    });

    const unsubPujaris = subscribePujaris((pujaris) => {
      if (activePujari?.id) {
        const updated = pujaris.find((p) => p.id === activePujari.id);
        if (updated) {
          setActivePujari(updated);
        }
      }
    });

    return () => {
      unsubQr();
      unsubPujaris();
    };
  }, [activePujari?.id]);

  const initApp = async () => {
    const config = await getQrConfig();
    setQrConfig(config);

    // Check stored Pujari ID session silently in background without overriding initial Home Page landing
    const storedPujariId = localStorage.getItem('puja_app_pujari_id');
    if (storedPujariId) {
      const res = await loginPujari({ pujariId: storedPujariId, skipPinCheck: true });
      if (res.success && res.pujari) {
        setActivePujari(res.pujari);
      }
    }
  };

  const handlePujariLoginSuccess = (pujari: Pujari) => {
    setActivePujari(pujari);
    localStorage.setItem('puja_app_pujari_id', pujari.id);
    setViewMode('portal');
  };

  const handlePujariLogout = () => {
    setActivePujari(null);
    localStorage.removeItem('puja_app_pujari_id');
    setViewMode('home');
  };

  const handleRefreshPujariStatus = async () => {
    if (activePujari) {
      const res = await loginPujari({ pujariId: activePujari.id });
      if (res.success && res.pujari) {
        setActivePujari(res.pujari);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF0] text-amber-950 font-sans selection:bg-amber-200 flex flex-col w-full max-w-full overflow-x-hidden box-border">
      {/* Top Navigation Bar */}
      <Navbar
        currentRole={currentRole}
        activePujari={activePujari}
        lang={lang}
        onToggleLang={toggleLang}
        onGoHome={() => {
          setCurrentRole('pujari');
          setViewMode('home');
        }}
        onSwitchRole={(role) => {
          if (role === 'admin') {
            if (isAdminAuthenticated) {
              setCurrentRole('admin');
            } else {
              setAdminModalOpen(true);
            }
          } else {
            setCurrentRole(role);
          }
        }}
        onLogoutPujari={handlePujariLogout}
        onOpenAdminModal={() => setAdminModalOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden box-border">
        {currentRole === 'admin' && isAdminAuthenticated ? (
          <AdminPanel
            onLogoutAdmin={() => {
              setIsAdminAuthenticated(false);
              sessionStorage.removeItem('puja_app_admin_auth');
              setCurrentRole('pujari');
              setViewMode('home');
            }}
          />
        ) : viewMode === 'store' ? (
          <div className="max-w-7xl mx-auto px-2 sm:px-6 py-4">
            <button
              onClick={() => setViewMode('home')}
              className="mb-4 px-4 py-2 bg-amber-200 hover:bg-amber-300 text-amber-950 font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer border border-amber-400"
            >
              <span>←</span>
              <span>ମୁଖ୍ୟ ପୃଷ୍ଠାକୁ ଫେରନ୍ତୁ (Back to Home)</span>
            </button>
            <StoreView userPhone={activePujari?.phone} />
          </div>
        ) : viewMode === 'login' ? (
          <div className="max-w-7xl mx-auto px-2 sm:px-6 py-2">
            <div className="max-w-lg mx-auto mb-2">
              <button
                onClick={() => setViewMode('home')}
                className="px-4 py-2 bg-amber-200 hover:bg-amber-300 text-amber-950 font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer border border-amber-400"
              >
                <span>←</span>
                <span>ମୁଖ୍ୟ ପୃଷ୍ଠାକୁ ଫେରନ୍ତୁ (Back to Home)</span>
              </button>
            </div>
            <PujariLogin
              lang={lang}
              onLoginSuccess={handlePujariLoginSuccess}
              onOpenAdminModal={() => setAdminModalOpen(true)}
            />
          </div>
        ) : viewMode === 'portal' && activePujari ? (
          <PujariPortal
            pujari={activePujari}
            qrConfig={qrConfig}
            onRefreshPujari={handleRefreshPujariStatus}
            onLogout={handlePujariLogout}
          />
        ) : (
          <HomePage
            activePujari={activePujari}
            onNavigateToCreateList={() => {
              if (activePujari) {
                setViewMode('portal');
              } else {
                setViewMode('login');
              }
            }}
            onNavigateToStore={() => setViewMode('store')}
            onNavigateToLogin={() => setViewMode('login')}
          />
        )}
      </main>

      {/* Footer Section: Privacy Policy & Terms of Use */}
      <Footer />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        onSuccess={() => {
          setIsAdminAuthenticated(true);
          sessionStorage.setItem('puja_app_admin_auth', 'true');
          setCurrentRole('admin');
        }}
      />

      {/* Full-Screen Site Maintenance / Emergency Lock Overlay */}
      <SiteLockOverlay
        isLocked={isSiteLocked}
        isAdmin={currentRole === 'admin' && isAdminAuthenticated}
        onOpenAdminModal={() => setAdminModalOpen(true)}
        onUnlockAndNavigateToAdmin={() => {
          setIsAdminAuthenticated(true);
          sessionStorage.setItem('puja_app_admin_auth', 'true');
          setCurrentRole('admin');
          setIsSiteLocked(false);
        }}
      />
    </div>
  );
}
