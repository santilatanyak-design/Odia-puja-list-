import React, { useEffect } from 'react';
import { Clock, AlertTriangle, ShieldAlert, Calendar, X, CheckCircle2 } from 'lucide-react';
import { EXACT_OFFICE_CLOSED_MESSAGE, getOfficeStatusInfo, isOfficeOpen } from '../lib/officeHours';

interface OfficeClosedModalProps {
  isOpen: boolean;
  onClose: () => void;
  customMessage?: string;
  actionTitle?: string;
}

export const OfficeClosedModal: React.FC<OfficeClosedModalProps> = ({
  isOpen,
  onClose,
  customMessage,
  actionTitle = 'ଅଫିସ୍ ବନ୍ଦ ରହିଛି (Office Closed)',
}) => {
  // Auto-hide logic: If office is open, close modal automatically
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      if (isOfficeOpen()) {
        onClose();
      }
    }, 1000);

    // Initial check
    if (isOfficeOpen()) {
      onClose();
    }

    return () => clearInterval(interval);
  }, [isOpen, onClose]);

  if (!isOpen || isOfficeOpen()) return null;

  const info = getOfficeStatusInfo();
  const displayMsg = customMessage || EXACT_OFFICE_CLOSED_MESSAGE;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-amber-400 overflow-hidden my-auto p-5 sm:p-6 space-y-4">
        {/* Top Header Badge */}
        <div className="flex items-center justify-between border-b border-amber-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-tr from-[#701a1e] to-[#8B0000] text-amber-300 rounded-2xl border border-amber-400 shadow-md">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-amber-950 leading-tight">
                {actionTitle}
              </h3>
              <p className="text-[11px] text-rose-700 font-bold">
                {info.reason}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PROMINENT EXACT ODIA MESSAGE CALLOUT */}
        <div className="p-4 bg-amber-50 border-2 border-amber-400/80 rounded-2xl shadow-inner space-y-2">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-6 h-6 text-amber-800 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm font-black text-amber-950 leading-relaxed">
              {displayMsg}
            </div>
          </div>
        </div>

        {/* OFFICIAL WORKING HOURS SCHEDULE BOX */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2 text-slate-800 font-bold">
          <div className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
            📋 ଅଫିସିଆଲ୍ କାର୍ଯ୍ୟ ସମୟ ସାରଣୀ (Official Hours)
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200">
              <span className="flex items-center gap-1.5 text-slate-900">
                <Calendar className="w-4 h-4 text-amber-700" />
                <span>କାର୍ଯ୍ୟ ଦିବସ (Days):</span>
              </span>
              <span className="font-extrabold text-amber-950">ସୋମବାର ରୁ ଶନିବାର</span>
            </div>
            <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200">
              <span className="flex items-center gap-1.5 text-slate-900">
                <Clock className="w-4 h-4 text-emerald-700" />
                <span>ଖୋଲା ସମୟ (Hours):</span>
              </span>
              <span className="font-extrabold text-emerald-800">ସକାଳ ୧୦:୦୦ - ଦିନ ୦୨:୦୦</span>
            </div>
            <div className="flex items-center justify-between bg-rose-50 p-2 rounded-xl border border-rose-200 text-rose-900">
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-700" />
                <span>ଛୁଟି ଦିନ (Holiday):</span>
              </span>
              <span className="font-extrabold text-rose-800">ରବିବାର strictly closed</span>
            </div>
          </div>
        </div>

        {/* ACKNOWLEDGE BUTTON */}
        <button
          onClick={onClose}
          className="w-full py-3.5 bg-gradient-to-r from-[#701a1e] via-[#8B0000] to-[#701a1e] hover:from-[#8B0000] hover:to-[#a00000] text-amber-200 font-black rounded-2xl text-xs sm:text-sm shadow-md transition cursor-pointer border border-amber-400 flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-amber-300" />
          <span>ଠିକ୍ ଅଛି (ବୁଝିଗଲି)</span>
        </button>
      </div>
    </div>
  );
};
