import React, { useRef, useState } from 'react';
import { PujaList, Pujari } from '../types';
import { Printer, Share2, ArrowLeft, Check, Sparkles } from 'lucide-react';
import { recordDownload } from '../lib/api';
import { isOfficeOpen } from '../lib/officeHours';
import { OfficeClosedModal } from './OfficeClosedModal';

interface NamaYajnaPDFViewProps {
  list: PujaList;
  pujari?: Pujari;
  onBack: () => void;
}

// Dropbox Direct Asset Links (dl=1)
const ASSET_RADHA_KRISHNA =
  'https://www.dropbox.com/scl/fi/hh7aqrozxyshd3oysum8r/20260806_161038.png?rlkey=fe7yhwcw209i2fakupnz3g6gs&st=agiy7pwl&dl=1';
const ASSET_TOP_DECORATIVE =
  'https://www.dropbox.com/scl/fi/hte6ccep3o9qi21oj30hf/ChatGPT-Image-Aug-6-2026-04_09_42-PM.png?rlkey=nj9rs2vjbzuguny6eow2ashab&st=9h490ubt&dl=1';
const ASSET_KALASH_BOTTOM =
  'https://www.dropbox.com/scl/fi/7oqsr47uj3znigxklqq60/ChatGPT-Image-Aug-6-2026-04_13_59-PM.png?rlkey=84is9cmrum515gduox66du2eq&st=xkvyg5pb&dl=1';

export const NamaYajnaPDFView: React.FC<NamaYajnaPDFViewProps> = ({ list, pujari, onBack }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [officeClosedModalOpen, setOfficeClosedModalOpen] = useState(false);

  const yajna = list.yajnaDetails || {
    yajnaType: list.pujaName || 'ଅଷ୍ଟପ୍ରହରୀ ନାମଯଜ୍ଞ',
    datesTithi: list.date ? `ତାରିଖ: ${list.date}` : 'ବୈଶାଖ ଶୁକ୍ଳପକ୍ଷ',
    venue: list.location || 'ଶ୍ରୀ ଶ୍ରୀ ରାଧାକୃଷ୍ଣ ମନ୍ଦିର ପ୍ରାଙ୍ଗଣ',
    committeeName: list.yajamanaName || 'ଶ୍ରୀ ଶ୍ରୀ ରାଧାକୃଷ୍ଣ ନାମଯଜ୍ଞ ପରିଚାଳନା କମିଟି',
    adhibasaInfo: list.time ? `ସନ୍ଧ୍ୟା ${list.time} ରେ ଅଧିବାସ` : 'ସନ୍ଧ୍ୟା ୦୬:୦୦ ଘଟିକାରେ ଅଧିବାସ',
    namaArambhaInfo: 'ସକାଳ ୦୬:୦୦ ଘଟିକାରେ ଶ୍ରୀନାମ ଆରମ୍ଭ',
    purnahutiInfo: 'ଦିବା ୧୨:୦୦ ଘଟିକାରେ ପୂର୍ଣ୍ଣାହୁତି ଓ ନଗର ପରିକ୍ରମା',
    prasadSebaInfo: 'ଅପରାହ୍ନ ୧୨:୩୦ ରୁ ପ୍ରସାଦ ସେବନ',
    invitationText:
      'ସବିନୟ ନିବେଦନ ଏହିକି ଯେ, ଆମ୍ଭ ଗ୍ରାମର ସମସ୍ତ ଗ୍ରାମବାସୀଙ୍କ ମିଳିତ ସହଯୋଗରେ ଏହି ପବିତ୍ର ନାମଯଜ୍ଞ ମହୋତ୍ସବ ଅନୁଷ୍ଠିତ ହେବାକୁ ଯାଉଅଛି। ଏଣୁ ଆପଣମାନେ ସପରିବାର ଏହି ଯଜ୍ଞ ସ୍ଥଳରେ ଉପସ୍ଥିତ ରହି ଭଗବାନଙ୍କ ନାମସଂକୀର୍ତ୍ତନ ଶ୍ରବଣ କରି ପ୍ରସାଦ ସେବନ ପୂର୍ବକ ପୁଣ୍ୟ ହାସଲ କରିବାକୁ ସାଦର ନିମନ୍ତ୍ରଣ କରୁଅଛୁ।',
    organizers: 'ସମସ୍ତ ଗ୍ରାମବାସୀବୃନ୍ଦ',
    contactPhone: list.contact || pujari?.phone || '',
  };

  const handlePrint = () => {
    if (!isOfficeOpen()) {
      setOfficeClosedModalOpen(true);
      return;
    }
    // Record download asynchronously so print dialog opens synchronously on direct user gesture
    recordDownload(list.id).catch((e) => console.warn('Record download warning:', e));
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleCopyShare = () => {
    const text = `🌸 ${yajna.yajnaType} ନିମନ୍ତ୍ରଣ ପତ୍ର 🌸\n\n📍 ସ୍ଥାନ: ${yajna.venue}\n📅 ତିଥି/ତାରିଖ: ${yajna.datesTithi}\n\n🚩 ନିମନ୍ତ୍ରକ: ${yajna.committeeName}\n📞 ଯୋଗାଯୋଗ: ${yajna.contactPhone}\n\nଆପଣ ସପରିବାର ସାଦର ଆମନ୍ତ୍ରିତ!`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-2 sm:p-4 flex flex-col items-center justify-start print:p-0 print:bg-white print:text-black">
      {/* Embedded Print CSS to guarantee clean PDF print rendering */}
      <style>{`
        @media print {
          body, html {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .namayajna-card-container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 12px !important;
            box-shadow: none !important;
            border-width: 5px !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Top Controls Bar (Hidden during Print) */}
      <div className="w-full max-w-xl flex flex-wrap items-center justify-between gap-3 mb-4 bg-slate-900 border-2 border-amber-500/40 p-3 sm:p-4 rounded-3xl shadow-xl backdrop-blur-md print:hidden">
        <button
          onClick={onBack}
          type="button"
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 transition border border-amber-500/30 cursor-pointer min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ଫେରନ୍ତୁ (Back)</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyShare}
            type="button"
            className="px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 transition border border-amber-500/40 cursor-pointer min-h-[44px]"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? 'କପି ହେଲା!' : 'ଶେୟାର'}</span>
          </button>

          <button
            onClick={handlePrint}
            type="button"
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 transition shadow-lg cursor-pointer active:scale-95 min-h-[44px]"
          >
            <Printer className="w-4 h-4" />
            <span>ପ୍ରିଣ୍ଟ / PDF</span>
          </button>
        </div>
      </div>

      {/* Compact A4 Proportional PageMaker Invitation Card */}
      <div
        ref={cardRef}
        className="namayajna-card-container w-full max-w-xl bg-gradient-to-b from-[#FFFDF5] via-[#FFF9E8] to-[#FFF4D6] text-slate-950 p-3.5 sm:p-5 relative border-[8px] border-amber-900 font-serif leading-snug shadow-2xl print:p-3 print:max-w-none print:shadow-none print:w-full print:border-[5px]"
        style={{
          boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.45)',
        }}
      >
        {/* Outer Sambalpuri Inner Frame */}
        <div className="border-2 border-double border-red-800 p-2.5 sm:p-3.5 relative bg-white/90 shadow-inner pdf-kalash-watermark">
          {/* Corner Floral Motifs */}
          <div className="absolute -top-3 -left-3 text-red-800 font-bold text-base select-none">❖</div>
          <div className="absolute -top-3 -right-3 text-red-800 font-bold text-base select-none">❖</div>
          <div className="absolute -bottom-3 -left-3 text-red-800 font-bold text-base select-none">❖</div>
          <div className="absolute -bottom-3 -right-3 text-red-800 font-bold text-base select-none">❖</div>

          {/* Top Decorative Graphic Asset (Asset 2) */}
          <div className="w-full flex justify-center mb-1">
            <img
              src={ASSET_TOP_DECORATIVE}
              alt="Top Decorative Motif"
              referrerPolicy="no-referrer"
              className="max-h-12 sm:max-h-16 object-contain drop-shadow-xs"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          {/* Deity Invocation Header */}
          <div className="text-center mb-2">
            <div className="text-[11px] sm:text-xs font-black text-red-900 tracking-widest uppercase">
              || ଓଁ ଶ୍ରୀ ଶ୍ରୀ ରାଧାକୃଷ୍ଣାୟ ନମଃ ||
            </div>

            {/* Main Title Banner Box */}
            <div className="my-1.5 inline-block bg-gradient-to-r from-amber-900 via-rose-900 to-amber-900 text-amber-100 border border-amber-500 px-5 sm:px-6 py-1.5 rounded-lg shadow-xs">
              <h1 className="text-lg sm:text-xl font-black tracking-wide text-amber-100">
                {yajna.yajnaType || 'ଶ୍ରୀ ଶ୍ରୀ ଅଷ୍ଟପ୍ରହରୀ ନାମଯଜ୍ଞ'}
              </h1>
              <p className="text-[10px] sm:text-xs font-bold text-amber-300 mt-0.5 tracking-wider">
                ନିମନ୍ତ୍ରଣ ପତ୍ର (Invitation Card)
              </p>
            </div>
          </div>

          {/* Radha Krishna Main Center Illustration Graphic (Asset 1) */}
          <div className="my-2 flex flex-col items-center justify-center">
            <div className="p-1 bg-gradient-to-tr from-amber-500 via-red-600 to-amber-400 rounded-full shadow-md max-w-[130px] sm:max-w-[155px]">
              <div className="bg-amber-50 rounded-full p-0.5 border border-amber-900 overflow-hidden">
                <img
                  src={ASSET_RADHA_KRISHNA}
                  alt="Radha Krishna"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto max-h-32 sm:max-h-38 object-contain rounded-full"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            </div>
          </div>

          {/* Hare Krishna Mahamantra (Clean Borderless Banner) */}
          <div className="my-2 py-1.5 px-2 bg-amber-100/80 rounded-lg text-center text-xs font-black text-amber-950 leading-snug">
            « ହରେ କୃଷ୍ଣ ହରେ କୃଷ୍ଣ କୃଷ୍ଣ କୃଷ୍ଣ ହରେ ହରେ । ହରେ ରାମ ହରେ ରାମ ରାମ ରାମ ହରେ ହରେ ॥ »
          </div>

          {/* Salutation & Invitation Text */}
          <div className="my-2.5 text-slate-900 text-xs leading-relaxed">
            <div className="font-black text-red-950 text-xs sm:text-sm mb-1 underline decoration-amber-600 underline-offset-2">
              ଶ୍ରଦ୍ଧାସ୍ପଦ ସୁଜନେଷୁ,
            </div>
            <p className="text-justify indent-6 font-semibold text-slate-900">
              {yajna.invitationText}
            </p>
          </div>

          {/* Venue & Date Key Details */}
          <div className="my-2.5 p-2.5 bg-amber-100/70 rounded-lg space-y-1 text-xs font-extrabold text-amber-950">
            <div className="flex items-start gap-1.5">
              <span className="text-red-800 shrink-0">📍</span>
              <div>
                <span className="font-black text-red-950 underline">ଯଜ୍ଞ ସ୍ଥଳ (Venue):</span>{' '}
                <span className="text-slate-900 font-semibold">{yajna.venue}</span>
              </div>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-red-800 shrink-0">📅</span>
              <div>
                <span className="font-black text-red-950 underline">ତିଥି / ତାରିଖ (Date &amp; Tithi):</span>{' '}
                <span className="text-slate-900 font-semibold">{yajna.datesTithi}</span>
              </div>
            </div>
          </div>

          {/* PURPLE PROGRAM SCHEDULE CONTAINER (Clean Borderless Text Lines) */}
          <div className="my-3 bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 text-purple-50 p-3 rounded-xl shadow-md">
            <div className="flex items-center justify-center gap-1.5 mb-2 pb-1 border-b border-amber-400/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <h3 className="text-center font-black text-amber-300 text-xs sm:text-sm tracking-wide uppercase">
                ❖ କାର୍ଯ୍ୟସୂଚୀ ନିଘଣ୍ଟ (Yajna Schedule) ❖
              </h3>
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            </div>

            {/* Clean Borderless List of Schedule Items */}
            <div className="space-y-1.5 text-xs px-1">
              <div className="flex flex-wrap items-baseline justify-between border-b border-purple-800/60 pb-1 gap-1">
                <span className="text-amber-300 font-extrabold">୧. ଅଧିବାସ (Adhibasa):</span>
                <span className="text-purple-100 font-medium">{yajna.adhibasaInfo}</span>
              </div>

              <div className="flex flex-wrap items-baseline justify-between border-b border-purple-800/60 pb-1 gap-1">
                <span className="text-amber-300 font-extrabold">୨. ଶ୍ରୀନାମ ଆରମ୍ଭ (Nama Arambha):</span>
                <span className="text-purple-100 font-medium">{yajna.namaArambhaInfo}</span>
              </div>

              <div className="flex flex-wrap items-baseline justify-between border-b border-purple-800/60 pb-1 gap-1">
                <span className="text-amber-300 font-extrabold">୩. ପୂର୍ଣ୍ଣାହୁତି &amp; ପରିକ୍ରମା:</span>
                <span className="text-purple-100 font-medium">{yajna.purnahutiInfo}</span>
              </div>

              {yajna.prasadSebaInfo && (
                <div className="flex flex-wrap items-baseline justify-between pb-0.5 gap-1">
                  <span className="text-amber-300 font-extrabold">୪. ଅନ୍ନପ୍ରସାଦ ସେବନ:</span>
                  <span className="text-purple-100 font-medium">{yajna.prasadSebaInfo}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Section with Kalash Graphic (Asset 3) Flanking Committee Details */}
          <div className="mt-3 pt-2 border-t border-amber-900 flex items-center justify-between gap-2">
            {/* Left Kalash Graphic Asset 3 */}
            <div className="w-10 sm:w-12 h-10 sm:h-12 shrink-0 flex items-center justify-center">
              <img
                src={ASSET_KALASH_BOTTOM}
                alt="Kalash Motif Left"
                referrerPolicy="no-referrer"
                className="max-h-full max-w-full object-contain drop-shadow-xs"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            {/* Committee / Organizers Center Signature */}
            <div className="text-center flex-1">
              <div className="text-[11px] sm:text-xs font-black text-red-950 underline">
                ନିମନ୍ତ୍ରକ (Invited By):
              </div>
              <div className="text-xs sm:text-sm font-black text-amber-950 mt-0.5">
                {yajna.committeeName}
              </div>
              <div className="text-[11px] font-bold text-slate-800">
                ଓ {yajna.organizers || 'ସମସ୍ତ ଗ୍ରାମବାସୀବୃନ୍ଦ'}
              </div>
              {yajna.contactPhone && (
                <div className="text-[11px] font-sans font-black text-red-950 mt-1 flex items-center justify-center gap-1">
                  <span>📞 ମୋବାଇଲ୍:</span>
                  <span>{yajna.contactPhone}</span>
                </div>
              )}
              {pujari?.name && (
                <div className="text-[10px] font-sans text-slate-600 mt-0.5">
                  ପୁରୋହିତ: {pujari.name} (ID: {pujari.id})
                </div>
              )}
            </div>

            {/* Right Kalash Graphic Asset 3 */}
            <div className="w-10 sm:w-12 h-10 sm:h-12 shrink-0 flex items-center justify-center">
              <img
                src={ASSET_KALASH_BOTTOM}
                alt="Kalash Motif Right"
                referrerPolicy="no-referrer"
                className="max-h-full max-w-full object-contain drop-shadow-xs scale-x-[-1]"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          </div>

          {/* Card Footer Watermark & Reference */}
          <div className="mt-2.5 pt-1.5 border-t border-amber-300/80 text-[9px] sm:text-[10px] text-amber-950 flex items-center justify-between font-sans font-bold">
            <span>ପୂଜା ସାମଗ୍ରୀ ସେବା ଆପ୍ (Puja Samagri App)</span>
            <span>କାର୍ଡ ରେଫରେନ୍ସ: {list.id}</span>
          </div>
        </div>
      </div>

      <OfficeClosedModal
        isOpen={officeClosedModalOpen}
        onClose={() => setOfficeClosedModalOpen(false)}
      />
    </div>
  );
};
