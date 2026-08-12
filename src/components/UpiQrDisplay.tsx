import React, { useState } from 'react';
import { QrCode, Copy, Check, Loader2 } from 'lucide-react';

interface UpiQrDisplayProps {
  customQrUrl?: string;
  upiId: string;
  amount: number;
  label: string;
}

export const UpiQrDisplay: React.FC<UpiQrDisplayProps> = ({
  customQrUrl,
  upiId,
  amount,
  label,
}) => {
  const [copied, setCopied] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const cleanUpi = upiId || 'pujasamagri@upi';
  const upiUrl = `upi://pay?pa=${encodeURIComponent(cleanUpi)}&pn=${encodeURIComponent('Puja Samagri Service')}&am=${amount}&cu=INR&tn=${encodeURIComponent(label)}`;
  
  // Dynamic fallback QR Code generator URL using standard QR API
  const generatedQrApi = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUrl)}&margin=10`;

  const displayQrUrl = customQrUrl && customQrUrl.trim() !== '' ? customQrUrl : generatedQrApi;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(cleanUpi);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-amber-50/80 border border-amber-300 rounded-2xl text-center shadow-xs">
      <div className="mb-2">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-amber-200 text-amber-950 border border-amber-400">
          {label} — ₹{amount}
        </span>
      </div>

      <div className="relative p-3.5 bg-white rounded-2xl shadow-md border border-amber-300 mb-3 flex flex-col items-center justify-center min-h-[220px]">
        {imageLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-amber-50/50 backdrop-blur-2xs rounded-2xl gap-2 z-10">
            <Loader2 className="w-8 h-8 text-amber-700 animate-spin" />
            <span className="text-[11px] font-bold text-amber-900">QR କୋଡ୍ ଲୋଡ୍ ହେଉଛି...</span>
          </div>
        )}
        <img
          src={displayQrUrl}
          alt={`Payment QR Code ₹${amount}`}
          className={`w-48 h-48 object-contain rounded-lg transition-opacity duration-200 ${
            imageLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={() => setImageLoading(false)}
          onError={(e) => {
            (e.target as HTMLImageElement).src = generatedQrApi;
            setImageLoading(false);
          }}
        />
        <div className="mt-2 text-xs text-amber-950 font-bold flex items-center justify-center gap-1.5">
          <QrCode className="w-4 h-4 text-amber-700" />
          GPay / PhonePe / Paytm ଦ୍ୱାରା ସ୍କାନ୍ କରନ୍ତୁ
        </div>
      </div>

      <div className="w-full max-w-xs bg-white rounded-xl p-3 border border-amber-300 flex items-center justify-between text-xs shadow-2xs">
        <div className="truncate text-left">
          <div className="text-[10px] text-slate-600 font-bold">UPI ID:</div>
          <div className="font-extrabold text-slate-900 truncate font-mono text-xs">{cleanUpi}</div>
        </div>
        <button
          type="button"
          onClick={handleCopyUpi}
          className="ml-2 px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-extrabold rounded-lg flex items-center gap-1 transition text-xs shrink-0 cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-300" /> କପି ହେଲା
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" /> କପି କରନ୍ତୁ
            </>
          )}
        </button>
      </div>
    </div>
  );
};
