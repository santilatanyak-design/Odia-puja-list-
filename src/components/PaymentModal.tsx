import React, { useState } from 'react';
import { QrConfig, PujaList } from '../types';
import { UpiQrDisplay } from './UpiQrDisplay';
import { sanitizeUtr, isActionThrottled, GENERIC_ODIA_ERROR_MESSAGE } from '../lib/sanitize';
import { X, CheckCircle, Lock, ShieldCheck, AlertCircle } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'new_creation' | 'search_redownload' | 'edit_list';
  qrConfig: QrConfig;
  list?: PujaList | null;
  onSubmitUtr: (utrRef: string) => Promise<boolean>;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  type,
  qrConfig,
  list,
  onSubmitUtr,
}) => {
  const [utrRef, setUtrRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const amount = type === 'new_creation' ? qrConfig.newCreationAmount : qrConfig.reDownloadAmount;
  const qrUrl = type === 'new_creation' ? qrConfig.newCreationQrUrl : qrConfig.reDownloadQrUrl;
  const upiId = type === 'new_creation' ? qrConfig.newCreationUpiId : qrConfig.reDownloadUpiId;
  const title =
    type === 'new_creation'
      ? '₹୫ ନୂତନ ପୂଜା ସୂଚୀ ଦେୟ (New List Fee)'
      : type === 'edit_list'
      ? '₹୨ ସୂଚୀ ସମ୍ପାଦନ/ଅପଡେଟ୍ ଦେୟ (Update Fee)'
      : '₹୨ ସୂଚୀ ପୁନଃ-ଡାଉନଲୋଡ୍ ଦେୟ (Re-download Fee)';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isActionThrottled('submit_utr', 2000)) {
      setErrorMsg('ଅତି ଦ୍ରୁତ ଆବେଦନ! ଦୟାକରି ୨ ସେକେଣ୍ଡ ଅପେକ୍ଷା କରନ୍ତୁ।');
      return;
    }

    const cleanUtr = sanitizeUtr(utrRef);
    if (!cleanUtr || cleanUtr.length < 4) {
      setErrorMsg('ଦୟାକରି ଆପଣଙ୍କ ସଠିକ୍ UTR / Transaction reference ନମ୍ବର ଦିଅନ୍ତୁ।');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    const pujariName = list?.pujariName || 'Pujari';
    const docType = list?.yajnaDetails ? 'Nama Yajna Card' : 'Puja List';

    // 1. Send POST request to backend API route to dispatch Telegram notification
    try {
      await fetch('/api/notify-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          utrNumber: cleanUtr,
          pujariName,
          docType,
          listId: list?.id,
        }),
      });
    } catch (error) {
      console.warn("Backend Telegram API Notification Warning:", error);
    }

    // 2. Proceed with Firestore save and UI state update
    try {
      await onSubmitUtr(cleanUtr);
      setSubmittedSuccess(true);
    } catch (err) {
      console.error('Submit UTR error:', err);
      setErrorMsg(GENERIC_ODIA_ERROR_MESSAGE);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-amber-300 relative my-auto max-h-[85vh] sm:max-h-[90vh] overflow-y-auto overscroll-contain">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {submittedSuccess ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">ପେମେଣ୍ଟ ଅନୁରୋଧ ଦାଖଲ ହେଲା!</h3>
            <p className="text-xs text-slate-700 max-w-xs mx-auto font-medium">
              ଆପଣଙ୍କ UTR/ଟ୍ରାଞ୍ଜାକସନ୍ ନମ୍ବର <span className="font-mono font-bold text-slate-900 bg-amber-50 px-2 py-0.5 border border-amber-200 rounded">{utrRef}</span> ଆଡମିନ୍ ଅନୁମୋଦନ ପାଇଁ ପଠାଯାଇଛି।
            </p>
            <div className="p-3.5 bg-amber-100/80 border-2 border-amber-400 rounded-2xl text-xs sm:text-sm text-amber-950 font-black flex items-center justify-center gap-2">
              <span className="w-2.5 h-2.5 bg-amber-600 rounded-full animate-ping"></span>
              <span>⏳ ସ୍ଥିତି: "ପେମେଣ୍ଟ ଯାଞ୍ଚ ହେଉଛି - ଆଡମିନ୍ ଅନୁମୋଦନ ଅପେକ୍ଷାରେ"</span>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3.5 bg-amber-800 hover:bg-amber-900 text-white font-black rounded-2xl text-xs sm:text-sm transition cursor-pointer shadow-md mt-2 min-h-[44px]"
            >
              ସମାପ୍ତ - ସୂଚୀକୁ ଫେରନ୍ତୁ
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 bg-amber-100 text-amber-900 rounded-xl">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">{title}</h3>
            </div>
            <p className="text-xs text-slate-600 mb-4 font-medium">
              {type === 'new_creation'
                ? 'ଆପଣଙ୍କ ପ୍ରଥମ ସୂଚୀ ମାଗଣା ଥିଲା! ୨ୟ ସୂଚୀଠାରୁ ମାତ୍ର ₹୫ ଦେୟ ପ୍ରଯୁଜ୍ୟ।'
                : type === 'edit_list'
                ? 'ପୂଜା ସୂଚୀ ସମ୍ପାଦନ/ଅପଡେଟ୍ ପରେ ନୂତନ PDF ଅନଲୋକ୍ ପାଇଁ ₹୨ ସେବା ଦେୟ ପ୍ରଯୁଜ୍ୟ।'
                : 'ପୂର୍ବରୁ ପ୍ରସ୍ତୁତ ପୂଜା ସୂଚୀ ପୁନଃ-ଡାଉନଲୋଡ୍ କରିବା ପାଇଁ ₹୨ ସେବା ଦେୟ ପ୍ରଯୁଜ୍ୟ।'}
            </p>

            {/* QR Code Display Component */}
            <UpiQrDisplay
              customQrUrl={qrUrl}
              upiId={upiId}
              amount={amount}
              label={
                type === 'new_creation'
                  ? 'ନୂଆ ପୂଜା ସୂଚୀ ଦେୟ'
                  : type === 'edit_list'
                  ? 'ସୂଚୀ ଅପଡେଟ୍ ଦେୟ'
                  : 'ପୁନଃ-ଡାଉନଲୋଡ୍ ଦେୟ'
              }
            />

            {/* Form to submit UTR */}
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  UTR / UPI ଟ୍ରାଞ୍ଜାକସନ୍ ID ନମ୍ବର <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ଉଦାହରଣ: 423910829301 କିମ୍ବା Ref No"
                  value={utrRef}
                  onChange={(e) => setUtrRef(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 outline-none font-mono font-bold"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  ଉପରୋକ୍ତ QR କୋଡ୍ ସ୍କାନ୍ କରି ପେମେଣ୍ଟ କରନ୍ତୁ, ତା'ପରେ ୧୨-ଅଙ୍କ ବିଶିଷ୍ଟ UTR ନମ୍ବର ଏଠାରେ ଲେଖନ୍ତୁ।
                </p>
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white font-black rounded-2xl text-sm sm:text-base transition shadow-lg cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 min-h-[48px]"
              >
                <ShieldCheck className="w-5 h-5 text-amber-300" />
                <span>{submitting ? 'ଦାଖଲ ହେଉଛି...' : `ପେମେଣ୍ଟ UTR ଦାଖଲ କରନ୍ତୁ (₹${amount} PDF ଅନଲୋକ୍)`}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
