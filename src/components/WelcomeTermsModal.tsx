import React, { useState } from 'react';
import { acceptTerms } from '../lib/api';
import { Sparkles, CheckCircle2, ShieldAlert, Award, FileCheck, ArrowRight } from 'lucide-react';

interface WelcomeTermsModalProps {
  isOpen: boolean;
  pujariId: string;
  pujariName: string;
  onAccepted: () => void;
}

export const WelcomeTermsModal: React.FC<WelcomeTermsModalProps> = ({
  isOpen,
  pujariId,
  pujariName,
  onAccepted,
}) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAgree = async () => {
    try {
      setLoading(true);
      const success = await acceptTerms(pujariId);
      if (success) {
        onAccepted();
      } else {
        // Fallback: continue anyway to avoid blocking user if network glitches
        onAccepted();
      }
    } catch (err) {
      console.error('Error accepting terms:', err);
      onAccepted();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border-2 border-amber-400 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header Decorative Bar */}
        <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 text-white p-6 sm:p-7 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />
          
          <div className="w-14 h-14 bg-amber-500/20 rounded-2xl border border-amber-300/40 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Sparkles className="w-8 h-8 text-amber-200" />
          </div>

          <div className="text-amber-200 text-xs font-bold uppercase tracking-widest mb-1 flex items-center justify-center gap-1.5">
            <span>ॐ</span> <span>ଓଁ ଶ୍ରୀ ଗଣେଶାୟ ନମଃ</span> <span>卐</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
            ସ୍ୱାଗତମ୍! ଆପଣଙ୍କ ଆକାଉଣ୍ଟ ଆପ୍ରୁଭ୍ ହୋଇଯାଇଛି
          </h2>

          <p className="text-xs sm:text-sm text-amber-100 font-medium mt-1">
            ଶ୍ରଦ୍ଧେୟ <strong className="text-amber-200 font-extrabold">{pujariName}</strong>, ଆପଣଙ୍କ ପୂଜାରୀ ଆକାଉଣ୍ଟ ସକ୍ରିୟ ଅଛି।
          </p>
        </div>

        {/* Scrollable Terms Content */}
        <div className="p-5 sm:p-7 space-y-5 text-slate-800 text-xs sm:text-sm leading-relaxed max-h-[60vh] overflow-y-auto">
          
          {/* SECTION 1: BENEFITS */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-2.5">
            <h3 className="font-extrabold text-amber-950 text-sm sm:text-base flex items-center gap-2 border-b border-amber-200 pb-2">
              <Award className="w-5 h-5 text-amber-700 shrink-0" />
              <span>୧. ସୁବିଧା ସମୂହ (Benefits)</span>
            </h3>
            <ul className="space-y-2 font-bold text-slate-800">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>ଜୀବନସାରା ସମସ୍ତ ପୂଜା ଡାଟା ସୁରକ୍ଷିତ ଏବଂ ସହଜରେ ସଞ୍ଚୟ ହୋଇରହିବ।</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>ଅତି ଆକର୍ଷଣୀୟ ଓ ସୁନ୍ଦର ୧-ପୃଷ୍ଠା A4 PDF ପୂଜା ସାମଗ୍ରୀ ସୂଚୀ ପ୍ରସ୍ତୁତି ଓ ଡାଉନଲୋଡ୍।</span>
              </li>
            </ul>
          </div>

          {/* SECTION 2: RULES & PRICING */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2 border-b border-slate-200 pb-2">
              <FileCheck className="w-5 h-5 text-amber-700 shrink-0" />
              <span>୨. ଆପ୍ ନିୟମ ଓ ଦେୟ (Rules & Pricing)</span>
            </h3>
            <div className="space-y-2 text-xs font-bold text-slate-800">
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <span>୧ମ ପୂଜା ସୂଚୀ ତିଆରି (1st List Creation):</span>
                <span className="font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg text-xs">
                  ୧୦୦% ମାଗଣା (FREE)
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <span>ନୂତନ ପୂଜା ସୂଚୀ ତିଆରି (New List Creation):</span>
                <span className="font-extrabold text-amber-950 bg-amber-100 px-2.5 py-1 rounded-lg text-xs">
                  ₹୫ ପ୍ରତି PDF
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <span>ପୁରୁଣା ସୂଚୀ ଖୋଜିବା ଓ ପୁନଃ-ଡାଉନଲୋଡ୍:</span>
                <span className="font-extrabold text-amber-950 bg-amber-100 px-2.5 py-1 rounded-lg text-xs">
                  ₹୨ ପ୍ରତି PDF
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 3: WARNING */}
          <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 space-y-2">
            <h3 className="font-extrabold text-rose-950 text-sm flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
              <span>୩. ସତର୍କ ସୂଚନା (Warning)</span>
            </h3>
            <p className="text-xs sm:text-sm font-extrabold text-rose-900 leading-relaxed bg-white/80 p-3 rounded-xl border border-rose-200">
              "ସିଷ୍ଟମ୍ ରେ ସମସ୍ତ ଡାଉନଲୋଡ୍ ରେକର୍ଡ ହେଉଛି। ମିଛ ଦାବି କଲେ ଆକାଉଣ୍ଟ ତୁରନ୍ତ ବ୍ଲକ୍ କରାଯିବ।"
            </p>
          </div>

        </div>

        {/* Modal Action Footer */}
        <div className="p-5 sm:p-6 bg-slate-50 border-t border-slate-200 flex flex-col items-center gap-2">
          <button
            onClick={handleAgree}
            disabled={loading}
            className="w-full py-4 bg-amber-700 hover:bg-amber-800 text-white font-black text-sm sm:text-base rounded-2xl transition shadow-lg hover:shadow-xl cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 group"
          >
            <span>{loading ? 'ସ୍ୱୀକୃତି ଦାଖଲ ହେଉଛି...' : 'ମୁଁ ରାଜି ଅଛି (I Agree)'}</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <span className="text-[11px] font-bold text-slate-500 text-center">
            ଏହି ସର୍ତ୍ତାବଳୀ ଗ୍ରହଣ କଲେ ଆପଣ ପୂଜା ସାମଗ୍ରୀ ସୂଚୀ ପ୍ରସ୍ତୁତ କରିପାରିବେ।
          </span>
        </div>

      </div>
    </div>
  );
};
