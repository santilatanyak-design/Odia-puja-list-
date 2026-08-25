import React, { useEffect, useState } from 'react';
import { Download, CheckCircle2, ShieldCheck, Smartphone } from 'lucide-react';
import { isInAppBrowser, isAndroid, openInNativeChrome } from '../utils/pwaHelper';
import { PwaInstallModal } from './PwaInstallModal';

interface AdminInstallSectionProps {
  onInstalled?: () => void;
}

export const AdminInstallSection: React.FC<AdminInstallSectionProps> = ({ onInstalled }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [justInstalled, setJustInstalled] = useState<boolean>(false);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);

  useEffect(() => {
    // 1. Detect if already running in standalone PWA app mode
    if (typeof window !== 'undefined') {
      const isDisplayModeStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isNavStandalone = (window.navigator as any).standalone === true;
      const isPwaParam = new URLSearchParams(window.location.search).get('pwa') === 'admin';
      if (isDisplayModeStandalone || isNavStandalone || isPwaParam) {
        setIsStandalone(true);
      }

      // Check captured global deferred prompt if available
      if ((window as any).__PWA_ADMIN_PROMPT__) {
        setDeferredPrompt((window as any).__PWA_ADMIN_PROMPT__);
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (typeof window !== 'undefined') {
        (window as any).__PWA_ADMIN_PROMPT__ = e;
      }
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setJustInstalled(true);
      setDeferredPrompt(null);
      if (typeof window !== 'undefined') {
        (window as any).__PWA_ADMIN_PROMPT__ = null;
        localStorage.setItem('pwa_admin_installed', 'true');
      }
      if (onInstalled) {
        onInstalled();
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [onInstalled]);

  const handleInstallApp = async () => {
    if (typeof document !== 'undefined') {
      const dynamicManifest = document.getElementById('dynamic-pwa-manifest') as HTMLLinkElement;
      if (dynamicManifest) {
        dynamicManifest.href = '/admin-manifest.json';
      }
    }

    // Check if inside in-app browser on Android
    if (isInAppBrowser() && isAndroid()) {
      const currentAdminUrl = `${window.location.origin}/admin?pwa=admin`;
      const redirected = openInNativeChrome(currentAdminUrl);
      if (redirected) return;
    }

    const prompt = deferredPrompt || (typeof window !== 'undefined' ? (window as any).__PWA_ADMIN_PROMPT__ || (window as any).__PWA_INSTALL_PROMPT__ : null);
    if (prompt) {
      try {
        prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === 'accepted') {
          setIsStandalone(true);
          setJustInstalled(true);
          setDeferredPrompt(null);
          if (typeof window !== 'undefined') {
            (window as any).__PWA_ADMIN_PROMPT__ = null;
            (window as any).__PWA_INSTALL_PROMPT__ = null;
            localStorage.setItem('pwa_admin_installed', 'true');
          }
          if (onInstalled) {
            onInstalled();
          }
        }
      } catch (err) {
        console.error('Admin PWA prompt error:', err);
      }
    } else {
      setShowInstallModal(true);
    }
  };

  return (
    <div className="w-full mt-6 pt-5 border-t border-slate-700/60">
      <div className="bg-gradient-to-r from-slate-900 via-[#701a1e]/40 to-slate-900 border-2 border-amber-500/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5 text-left w-full sm:w-auto">
          <div className="p-3 bg-amber-500/20 text-amber-400 border border-amber-400/40 rounded-2xl shrink-0 shadow-inner">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black text-amber-200">
                ପ୍ରାଇଭେଟ୍ ଆଡମିନ୍ PWA ଆପ୍ (Private Admin App)
              </h4>
              <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-black rounded-md text-[10px]">
                ADMIN ONLY
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              ମୋବାଇଲ୍ ହୋମ୍ ସ୍କ୍ରିନ୍‌ରେ ଆପ୍ ଡାଉନଲୋଡ୍ କରନ୍ତୁ। ଖୋଲିବା ମାତ୍ରେ ସିଧାସଳଖ ଆଡମିନ୍ ପୋର୍ଟାଲ୍ ଖୋଲିବ।
            </p>
          </div>
        </div>

        <div className="w-full sm:w-auto shrink-0 flex items-center justify-end">
          {isStandalone || justInstalled ? (
            <div className="w-full sm:w-auto px-4 py-2.5 bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 rounded-xl text-xs font-black flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>ଆଡମିନ୍ ଆପ୍ ସଂସ୍ଥାପିତ ଅଛି (Installed)</span>
            </div>
          ) : (
            <button
              onClick={handleInstallApp}
              type="button"
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black rounded-xl border-2 border-amber-500 shadow-lg transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 text-xs"
            >
              <Download className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <ShieldCheck className="w-3.5 h-3.5 text-slate-950" />
              <span>Install Admin App (ଡାଉନଲୋଡ୍)</span>
            </button>
          )}
        </div>
      </div>

      {/* PWA Install Modal replacing alert */}
      <PwaInstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        lang="OD"
      />
    </div>
  );
};
