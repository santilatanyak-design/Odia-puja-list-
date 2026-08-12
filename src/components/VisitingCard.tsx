import React from 'react';
import { Pujari } from '../types';
import { Phone, MapPin, Sparkles } from 'lucide-react';

interface VisitingCardProps {
  pujari: Pujari;
  cardRef?: React.RefObject<HTMLDivElement | null>;
  title?: string;
  specializations?: string[];
  profilePhotoUrl?: string;
}

export const VisitingCard: React.FC<VisitingCardProps> = ({
  pujari,
  cardRef,
  title = 'ଅଭିଜ୍ଞ ବୈଦିକ ପୂଜାରୀ ଓ ଜ୍ୟୋତିଷ ବିଶାରଦ',
  specializations = [
    'ଗୃହ ପ୍ରବେଶ',
    'ସତ୍ୟନାରାୟଣ ପୂଜା',
    'ବିବାହ ବ୍ରତ',
    'ନାମ ଯଜ୍ଞ',
    'ରୁଦ୍ରାଭିଷେକ',
  ],
  profilePhotoUrl,
}) => {
  const cleanPhone = (pujari.phone || '').trim();
  const qrData = encodeURIComponent(
    `TEL:${cleanPhone}\nNAME:${pujari.name}\nPUJARI_ID:${pujari.id}`
  );
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}&color=500c0f&bgcolor=ffffff`;

  return (
    <div className="w-full flex flex-col items-center justify-center">
      {/* 16:9 ASPECT RATIO VISITING CARD CONTAINER */}
      <div
        ref={cardRef}
        className="relative w-full max-w-[680px] aspect-[16/9] rounded-2xl shadow-2xl overflow-hidden border-4 border-amber-400 text-amber-50 p-4 sm:p-6 flex flex-col justify-between font-sans select-none box-border"
        style={{
          background: 'linear-gradient(135deg, #4A0105 0%, #750A10 50%, #3B0104 100%)',
          borderColor: '#f59e0b',
          boxShadow: '0 15px 35px rgba(0,0,0,0.5), inset 0 0 15px rgba(251, 191, 36, 0.2)',
          color: '#fffbeb',
        }}
      >
        {/* GOLDEN INNER ORNATE BORDER PATTERN */}
        <div
          className="absolute inset-2 rounded-xl pointer-events-none"
          style={{ border: '1px solid rgba(251, 191, 36, 0.5)' }}
        />
        <div
          className="absolute top-3 left-3 w-4 h-4 pointer-events-none"
          style={{ borderTop: '2px solid #fde68a', borderLeft: '2px solid #fde68a' }}
        />
        <div
          className="absolute top-3 right-3 w-4 h-4 pointer-events-none"
          style={{ borderTop: '2px solid #fde68a', borderRight: '2px solid #fde68a' }}
        />
        <div
          className="absolute bottom-3 left-3 w-4 h-4 pointer-events-none"
          style={{ borderBottom: '2px solid #fde68a', borderLeft: '2px solid #fde68a' }}
        />
        <div
          className="absolute bottom-3 right-3 w-4 h-4 pointer-events-none"
          style={{ borderBottom: '2px solid #fde68a', borderRight: '2px solid #fde68a' }}
        />

        {/* DEVOTIONAL BACKGROUND WATERMARK PATTERN */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
          <span className="text-[140px] sm:text-[180px] leading-none font-black" style={{ color: '#fcd34d' }}>
            🕉️
          </span>
        </div>

        {/* TOP HEADER BAR */}
        <div
          className="relative z-10 flex items-center justify-between w-full pb-2"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            borderBottom: '1px solid rgba(251, 191, 36, 0.4)',
          }}
        >
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-lg sm:text-xl font-bold shrink-0" style={{ color: '#fcd34d' }}>🕉️</span>
            <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase" style={{ color: '#fef08a' }}>
              || ଐଁ ହ୍ରୀଂ ଶ୍ରୀଂ ॥ ଶ୍ରୀ ଜଗନ୍ନାଥାୟ ନମଃ ||
            </span>
          </div>
          <div
            className="text-[9px] sm:text-[11px] font-black px-2.5 py-0.5 rounded-full shrink-0"
            style={{
              backgroundColor: 'rgba(251, 191, 36, 0.2)',
              color: '#fcd34d',
              border: '1px solid rgba(251, 191, 36, 0.5)',
              whiteSpace: 'nowrap',
            }}
          >
            ID: {pujari.id}
          </div>
        </div>

        {/* CARD MIDDLE BODY SECTION */}
        <div
          className="relative z-10 flex items-center justify-between w-full my-auto gap-3 sm:gap-4"
          style={{ width: '100%', boxSizing: 'border-box' }}
        >
          {/* PROFILE PHOTO / AVATAR (LEFT COLUMN - 28%) */}
          <div
            className="flex flex-col items-center justify-center text-center shrink-0"
            style={{ width: '28%', minWidth: '85px', boxSizing: 'border-box' }}
          >
            <div
              className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 shadow-xl shrink-0 overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 50%, #fef08a 100%)',
                border: '2px solid #fcd34d',
                boxSizing: 'border-box',
              }}
            >
              {profilePhotoUrl || pujari.profilePhotoUrl ? (
                <img
                  src={profilePhotoUrl || pujari.profilePhotoUrl}
                  alt={pujari.name}
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div
                  className="w-full h-full rounded-full flex flex-col items-center justify-center font-black"
                  style={{
                    background: 'linear-gradient(135deg, #b45309 0%, #78350f 50%, #451a03 100%)',
                    color: '#fef08a',
                  }}
                >
                  <span className="text-xl sm:text-2xl">🕉️</span>
                  <span className="text-[9px] font-extrabold tracking-tighter uppercase" style={{ color: '#fcd34d' }}>
                    Pujari
                  </span>
                </div>
              )}
              {/* Sacred Tilak Emblem */}
              <div
                className="absolute bottom-0 right-1/2 translate-x-1/2 text-[8px] font-black px-1.5 py-0.5 rounded-full border shadow-xs"
                style={{
                  backgroundColor: '#fbbf24',
                  color: '#451a03',
                  borderColor: '#fef08a',
                  whiteSpace: 'nowrap',
                }}
              >
                ପୂଜାରୀ
              </div>
            </div>
          </div>

          {/* PUJARI DETAILS & SPECIALIZATIONS (RIGHT COLUMN - 72%) */}
          <div
            className="flex flex-col justify-center space-y-1 sm:space-y-1.5 flex-1"
            style={{ width: '72%', boxSizing: 'border-box' }}
          >
            <div>
              <h2 className="text-base sm:text-xl font-black tracking-tight leading-tight flex items-center gap-1.5" style={{ color: '#fef3c7' }}>
                <span>{pujari.name.startsWith('ପଣ୍ଡିତ') ? pujari.name : `ପଣ୍ଡିତ ${pujari.name}`}</span>
                <Sparkles className="w-3.5 h-3.5 inline shrink-0" style={{ color: '#fcd34d' }} />
              </h2>
              <p className="text-[10px] sm:text-xs font-bold leading-tight" style={{ color: 'rgba(252, 211, 77, 0.95)' }}>
                {title}
              </p>
            </div>

            {/* SPECIALIZATIONS BADGES */}
            <div className="flex flex-wrap gap-1 pt-0.5">
              {specializations.slice(0, 5).map((spec, idx) => (
                <span
                  key={idx}
                  className="text-[8px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-md inline-flex items-center gap-1 shrink-0"
                  style={{
                    backgroundColor: 'rgba(30, 4, 6, 0.85)',
                    color: '#fef08a',
                    border: '1px solid rgba(251, 191, 36, 0.4)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span style={{ color: '#fbbf24' }}>❖</span>
                  <span>{spec}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* BOTTOM CONTACT & DYNAMIC QR BAR */}
        <div
          className="relative z-10 flex items-center justify-between w-full pt-2 px-2.5 py-1.5 rounded-xl"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            backgroundColor: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            borderTop: '1px solid rgba(251, 191, 36, 0.4)',
          }}
        >
          <div className="space-y-1 flex-1 min-w-0 pr-2" style={{ boxSizing: 'border-box' }}>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-extrabold" style={{ color: '#fef08a' }}>
              <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: '#fbbf24' }} />
              <span>{cleanPhone || 'ଯୋଗାଯୋଗ ନମ୍ବର'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold truncate" style={{ color: 'rgba(252, 211, 77, 0.9)' }}>
              <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: '#fbbf24' }} />
              <span className="truncate">{pujari.address || 'ଓଡ଼ିଶା'}</span>
            </div>
          </div>

          {/* DYNAMIC QR CODE */}
          <div
            className="flex items-center gap-2 p-1 rounded-lg shadow-md shrink-0"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.98)',
              border: '1px solid #fcd34d',
              minWidth: '110px',
              justifyContent: 'center',
              boxSizing: 'border-box',
            }}
          >
            <img
              src={qrCodeUrl}
              alt="Pujari Contact QR"
              crossOrigin="anonymous"
              className="w-9 h-9 sm:w-10 sm:h-10 object-contain shrink-0"
              style={{ width: '40px', height: '40px' }}
            />
            <div className="flex flex-col text-[8px] font-black leading-tight pr-1" style={{ color: '#451a03', whiteSpace: 'nowrap' }}>
              <span>SCAN TO</span>
              <span>CONNECT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
