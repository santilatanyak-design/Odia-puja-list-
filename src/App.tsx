import React, { useState, useEffect } from 'react';
import { Pujari, QrConfig } from './types';
import { getQrConfig, loginPujari, subscribeQrConfig, subscribePujaris, subscribeSiteLock } from './lib/api';
import { Language } from './lib/translations';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { PujariLogin } from './components/PujariLogin';
import { PujariPortal } from './components/PujariPortal';
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

    // Check stored Pujari ID session
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
  };

  const handlePujariLogout = () => {
    setActivePujari(null);
    localStorage.removeItem('puja_app_pujari_id');
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
            }}
          />
        ) : !activePujari ? (
          <PujariLogin
            lang={lang}
            onLoginSuccess={handlePujariLoginSuccess}
            onOpenAdminModal={() => setAdminModalOpen(true)}
          />
        ) : (
          <PujariPortal
            pujari={activePujari}
            qrConfig={qrConfig}
            onRefreshPujari={handleRefreshPujariStatus}
            onLogout={handlePujariLogout}
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
