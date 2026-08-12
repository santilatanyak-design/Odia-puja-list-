import React, { useState } from 'react';
import { Lock, Wrench, ShieldCheck, AlertOctagon, KeyRound, AlertCircle, X, Sparkles } from 'lucide-react';
import { verifyAdminMasterId, setSiteLock } from '../lib/api';
import { sanitizeIdentifier, isActionThrottled, GENERIC_ODIA_ERROR_MESSAGE } from '../lib/sanitize';

interface SiteLockOverlayProps {
  isLocked: boolean;
  isAdmin: boolean;
  onOpenAdminModal: () => void;
  onUnlockAndNavigateToAdmin?: () => void;
}

export const SiteLockOverlay: React.FC<SiteLockOverlayProps> = ({
  isLocked,
  isAdmin,
  onOpenAdminModal,
  onUnlockAndNavigateToAdmin,
}) => {
  const [showBackdoor, setShowBackdoor] = useState(false);
  const [backdoorPin, setBackdoorPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // EXEMPT ADMIN ROUTE: If site is not locked or if the user is in Admin view, DO NOT display overlay
  if (!isLocked || isAdmin) return null;

  const handleBackdoorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isActionThrottled('backdoor_unlock', 1500)) {
      setErrorMsg('ଅତି ଦ୍ରୁତ ଆବେଦନ! ଦୟାକରି ୧-୨ ସେକେଣ୍ଡ ଅପେକ୍ଷା କରନ୍ତୁ।');
      return;
    }

    const cleanPin = sanitizeIdentifier(backdoorPin);
    if (!cleanPin) {
      setErrorMsg('ଦୟାକରି ସଠିକ୍ ଆଡମିନ୍ PIN / Master ID ଦିଅନ୍ତୁ।');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      const valid = await verifyAdminMasterId(cleanPin);
      if (valid) {
        // Instantly unlock the site globally
        await setSiteLock(false);
        setBackdoorPin('');
        setShowBackdoor(false);
        if (onUnlockAndNavigateToAdmin) {
          onUnlockAndNavigateToAdmin();
        } else {
          onOpenAdminModal();
        }
      } else {
        setErrorMsg('ଅସିଦ୍ଧ ଆଡମିନ୍ Master ID! ଦୟାକରି ସଠିକ୍ PIN/ID ଦିଅନ୍ତୁ।');
      }
    } catch (err) {
      console.error('Backdoor unlock error:', err);
      setErrorMsg(GENERIC_ODIA_ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/98 text-white backdrop-blur-2xl flex flex-col items-center justify-center p-4 sm:p-8 text-center select-none overflow-y-auto min-h-screen">
      <div className="max-w-lg w-full bg-slate-900/90 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-amber-500/10 space-y-6 relative overflow-hidden my-auto">
        {/* Glowing Background Accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* CLICKABLE LOCK & WRENCH ICON (BACKDOOR TRIGGER) */}
        <div className="relative flex flex-col items-center justify-center gap-2 group">
          <button
            onClick={() => setShowBackdoor((prev) => !prev)}
            type="button"
            className="relative cursor-pointer focus:outline-none transition-transform transform active:scale-95 hover:scale-105"
            title="🔑 Click to open Admin Backdoor Unlock Prompt"
          >
            <div className="p-5 bg-amber-500/20 hover:bg-amber-500/30 border-2 border-amber-500/60 hover:border-amber-400 rounded-3xl text-amber-400 shadow-xl animate-pulse">
              <Lock className="w-12 h-12 sm:w-16 sm:h-16" />
            </div>
            <div className="absolute -bottom-2 -right-2 p-2 bg-rose-600 hover:bg-rose-500 text-white rounded-full border-2 border-slate-900 shadow-md">
              <Wrench className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
          </button>
          <span className="text-[11px] font-bold text-amber-400/80 tracking-wide uppercase group-hover:text-amber-300 transition">
            (🔑 ଲକ୍/ୱ୍ରେଞ୍ଚ୍ ଆଇକନ୍ କ୍ଲିକ୍ କରି ଆଡମିନ୍ ଅନଲକ୍ କରନ୍ତୁ)
          </span>
        </div>

        {/* BACKDOOR INLINE ADMIN LOGIN PROMPT */}
        {showBackdoor ? (
          <div className="p-5 bg-slate-950/90 border-2 border-amber-400/80 rounded-2xl text-left space-y-4 animate-fadeIn shadow-2xl relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-300 font-black text-sm">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <span>🔑 Admin Backdoor Unlock</span>
              </div>
              <button
                type="button"
                onClick={() => setShowBackdoor(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBackdoorSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-amber-200 mb-1">
                  ଆଡମିନ୍ PIN / Master ID
                </label>
                <input
                  type="password"
                  required
                  placeholder="Master ID ଦିଅନ୍ତୁ"
                  value={backdoorPin}
                  onChange={(e) => setBackdoorPin(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-amber-500/40 rounded-xl text-white text-sm focus:ring-2 focus:ring-amber-400 outline-none font-mono font-bold"
                />
              </div>

              {errorMsg && (
                <div className="p-2 bg-rose-950/80 border border-rose-500 rounded-lg text-xs text-rose-200 flex items-center gap-2 font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>{loading ? 'ଯାଞ୍ଚ ହେଉଛି...' : '🔓 ତୁରନ୍ତ ସାଇଟ୍ ଅନଲକ୍ କରନ୍ତୁ'}</span>
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold text-xs sm:text-sm rounded-full">
              <AlertOctagon className="w-4 h-4 text-amber-400" />
              <span>ରକ୍ଷଣାବେକ୍ଷଣ ଜାରି ରହିଛି (Maintenance Active)</span>
            </div>

            {/* Exact Requested Message */}
            <div className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-black text-amber-200 leading-snug">
                ୱେବସାଇଟ୍ରେ କିଛି ପରିବର୍ତ୍ତନ କରାଯାଉଛି। କିଛି ସମୟ ପରେ ସାଇଟ୍ ପୁଣି ଖୋଲିବ। ଦୟାକରି ଅପେକ୍ଷା କରନ୍ତୁ।
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                System maintenance and updates are currently in progress by the administrator. All portal services will automatically resume once updates complete.
              </p>
            </div>

            {/* Security Notice */}
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-[11px] sm:text-xs text-slate-400 text-center font-mono">
              🔒 Safe Mode Enabled • All user transactions and lists are preserved securely.
            </div>
          </>
        )}

        {/* Discreet Admin Portal Link */}
        <div className="pt-4 border-t border-slate-800 flex flex-col items-center gap-2">
          <p className="text-slate-500 text-[11px] font-medium">ଆପଣ ଆଡମିନ୍ ଅଟନ୍ତି କି? (Are you an Administrator?)</p>
          <button
            onClick={onOpenAdminModal}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-amber-500/40 text-amber-300 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shadow-md"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>ଆଡମିନ୍ ଲଗଇନ୍ / ଅନଲକ୍ (Admin Master Access)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
