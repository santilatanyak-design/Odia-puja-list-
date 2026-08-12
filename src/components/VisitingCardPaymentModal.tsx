import React, { useState } from 'react';
import { Pujari, QrConfig } from '../types';
import { X, QrCode, AlertTriangle, MessageCircle, Copy, Check, Send, ShieldAlert, Sparkles } from 'lucide-react';

interface VisitingCardPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  pujari: Pujari;
  qrConfig: QrConfig;
  onSubmitUtr: (utrRef: string) => Promise<void>;
}

export const VisitingCardPaymentModal: React.FC<VisitingCardPaymentModalProps> = ({
  isOpen,
  onClose,
  pujari,
  qrConfig,
  onSubmitUtr,
}) => {
  const [utr, setUtr] = useState(pujari.cardUtrRef || '');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const upiId = qrConfig.newCreationUpiId || 'pujaportal@upi';
  const qrUrl = qrConfig.newCreationQrUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=PujaPortal&am=5&cu=INR`)}`;
  const whatsappNumber = '919437000000'; // Default admin WhatsApp support line
  const whatsappMsg = encodeURIComponent(
    `ନମସ୍କାର ଆଡମିନ୍, ମୁଁ Digital Visiting Card Unlock ପାଇଁ ₹5 ପେମେଣ୍ଟ କରିଛି।\nପୂଜାରୀ ନାମ: ${pujari.name}\nପୂଜାରୀ ID: ${pujari.id}\nମୋବାଇଲ୍: ${pujari.phone}`
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMsg}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUtr = utr.trim();
    if (!cleanUtr) {
      setErrorMsg('ଦୟାକରି ୧୨ ଡିଜିଟ୍‌ର UTR / ଟ୍ରାଞ୍ଜାକସନ୍ ID ଦିଅନ୍ତୁ।');
      return;
    }
    if (cleanUtr.length < 4) {
      setErrorMsg('UTR ନମ୍ବର ଅତି କମରେ ୪ ଅକ୍ଷର ବା ଅଙ୍କ ହୋଇଥିବା ଆବଶ୍ୟକ।');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      await onSubmitUtr(cleanUtr);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'UTR ଦାଖଲ କରିବାରେ ବିଫଳ ହେଲା। ଦୟାକରି ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-amber-300 flex flex-col max-h-[92vh]">
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-[#701a1e] via-[#8B0000] to-[#701a1e] text-white p-4 sm:p-5 flex items-center justify-between border-b-2 border-amber-400">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-400/20 text-amber-300 rounded-xl border border-amber-400/40">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-amber-100 leading-tight">
                🎴 Digital Visiting Card Unlock
              </h3>
              <p className="text-xs text-amber-200/90 font-bold">
                ₹5 Payment (ଲାଇଫ୍‌ଟାଇମ୍ ଅନଲକ୍)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-amber-200 hover:text-white hover:bg-amber-400/20 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL SCROLLABLE BODY */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* PRICE BADGE */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 border-2 border-amber-400 rounded-2xl p-3 text-center space-y-1">
            <p className="text-xs font-black text-amber-950 uppercase tracking-wider">
              Visiting Card Unlock Price
            </p>
            <div className="text-2xl sm:text-3xl font-black text-amber-950 flex items-center justify-center gap-2">
              <span>₹5</span>
              <span className="text-xs font-extrabold text-amber-800 bg-amber-200 px-2.5 py-0.5 rounded-full border border-amber-300">
                Lifetime Access
              </span>
            </div>
          </div>

          {/* STATIC ADMIN UPI QR CODE */}
          <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
            <p className="text-xs font-bold text-slate-700 mb-2">
              ଯେକୌଣସି UPI App (PhonePe / Google Pay / Paytm) ଦ୍ୱାରା ₹5 ସ୍କାନ୍ କରି ପଠାନ୍ତୁ:
            </p>
            <div className="bg-white p-2.5 rounded-2xl border-2 border-amber-300 shadow-md">
              <img
                src={qrUrl}
                alt="Admin UPI QR Code"
                className="w-40 h-40 sm:w-48 sm:h-48 object-contain rounded-lg"
              />
            </div>

            {/* COPY UPI ID */}
            <div className="mt-2.5 flex items-center justify-between bg-amber-100/80 text-amber-950 px-3 py-1.5 rounded-xl border border-amber-300 w-full max-w-xs text-xs font-extrabold">
              <span className="truncate">UPI: {upiId}</span>
              <button
                type="button"
                onClick={handleCopyUpi}
                className="ml-2 text-amber-900 hover:text-amber-950 flex items-center gap-1 shrink-0 cursor-pointer font-black"
              >
                {copiedUpi ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                    <span className="text-emerald-800">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* LEGAL DISCLAIMER (NO REFUND POLICY) */}
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-3 flex items-start gap-2.5 text-amber-950 text-xs font-semibold">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-amber-950">
                No Refund Policy (ନୋ-ରିଫଣ୍ଡ ନୀତି):
              </p>
              <p className="text-[11px] text-amber-900 leading-snug mt-0.5">
                This is a digital service. Once unlocked, no refunds will be provided.
                (ଏହା ଏକ ଡିଜିଟାଲ୍ ସେବା। ଅନଲକ୍ ହେବା ପରେ କୌଣସି ଅର୍ଥ ଫେରସ୍ତ ଦିଆଯିବ ନାହିଁ।)
              </p>
            </div>
          </div>

          {/* WHATSAPP SUPPORT LINK */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300 rounded-2xl p-2.5 flex items-center justify-center gap-2 text-xs font-black transition cursor-pointer shadow-2xs"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>ସାହାଯ୍ୟ ପାଇଁ WhatsApp Support ସହ କଥା ହୁଅନ୍ତୁ</span>
          </a>

          {/* UTR SUBMISSION FORM */}
          <form onSubmit={handleSubmit} className="space-y-3 pt-1 border-t border-slate-200">
            <div>
              <label className="block text-xs font-black text-slate-800 mb-1">
                UTR / Transaction Reference Number (12 Digit UTR):
              </label>
              <input
                type="text"
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                placeholder=" e.g. 423456789012"
                className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-amber-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                required
              />
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-500 text-slate-950 font-black rounded-2xl text-sm shadow-lg border border-amber-300 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>ଦାଖଲ ହେଉଛି...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>UTR ଦାଖଲ କରନ୍ତୁ (Submit UTR)</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
