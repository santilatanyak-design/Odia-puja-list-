import React, { useState } from 'react';
import { verifyAdminMasterId } from '../lib/api';
import { sanitizeIdentifier, isActionThrottled, GENERIC_ODIA_ERROR_MESSAGE } from '../lib/sanitize';
import { KeyRound, ShieldCheck, X, AlertCircle } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [masterId, setMasterId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isActionThrottled('admin_login', 1500)) {
      setErrorMsg('ଅତି ଦ୍ରୁତ ଆବେଦନ! ଦୟାକରି ୧-୨ ସେକେଣ୍ଡ ଅପେକ୍ଷା କରନ୍ତୁ।');
      return;
    }

    const cleanMasterId = sanitizeIdentifier(masterId);
    if (!cleanMasterId) {
      setErrorMsg('ଦୟାକରି ସଠିକ୍ ଆଡମିନ୍ ମାଷ୍ଟର ID ଦିଅନ୍ତୁ।');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      const valid = await verifyAdminMasterId(cleanMasterId);
      if (valid) {
        onSuccess();
        onClose();
        setMasterId('');
      } else {
        setErrorMsg('ଅସିଦ୍ଧ ଆଡମିନ୍ ମାଷ୍ଟର ID। ଦୟାକରି ସଠିକ୍ ID ଦିଅନ୍ତୁ।');
      }
    } catch (err) {
      console.error('Admin Login Error:', err);
      setErrorMsg(GENERIC_ODIA_ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border-2 border-amber-300 relative my-auto max-h-[85vh] overflow-y-auto overscroll-contain">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-tr from-[#701a1e] to-[#8B0000] text-amber-300 rounded-2xl border border-amber-400 shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-amber-950">ଆଡମିନ୍ ମାଷ୍ଟର ଲଗଇନ୍</h3>
            <p className="text-xs text-amber-900/80 font-bold">ଅଫିସିଆଲ୍ ଆଡମିନ୍ ପୋର୍ଟାଲ୍ ପ୍ରବେଶ</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-amber-950 mb-1">
              ଆଡମିନ୍ ମାଷ୍ଟର ID (Admin Master ID)
            </label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="୬-ଅଙ୍କ ବିଶିଷ୍ଟ Master ID ଦିଅନ୍ତୁ"
                value={masterId}
                onChange={(e) => setMasterId(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-amber-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none font-mono font-bold"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-[#701a1e] to-[#8B0000] hover:from-[#8B0000] hover:to-[#a00000] text-amber-100 font-black rounded-2xl text-xs sm:text-sm transition shadow-md cursor-pointer disabled:opacity-50 border border-amber-400"
          >
            {loading ? 'ଯାଞ୍ଚ ହେଉଛି...' : 'ଆଡମିନ୍ ପୋର୍ଟାଲରେ ପ୍ରବେଶ କରନ୍ତୁ'}
          </button>
        </form>
      </div>
    </div>
  );
};
