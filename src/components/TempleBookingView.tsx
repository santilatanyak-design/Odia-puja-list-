import React, { useState, useEffect } from 'react';
import { Temple, TempleBooking } from '../types';
import {
  subscribeTemples,
  subscribeBookings,
  submitTempleBooking,
  requestBookingReschedule,
  cancelUserBooking,
  subscribePujaTypes,
  getPujaTypesFromLocal,
} from '../lib/templeApi';
import { generateTempleReceiptJPG } from '../lib/receiptGenerator';
import {
  Share2,
  Calendar,
  MapPin,
  Phone,
  CheckCircle2,
  AlertCircle,
  QrCode,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Download,
  Clock,
  User,
  X,
  Copy,
  Check,
  BookOpen,
  Search,
  FileText,
  ShoppingBag,
} from 'lucide-react';

interface TempleBookingViewProps {
  userPhone?: string;
}

// Dynamic Open Graph & Twitter Meta Tag Injector for 1:1 Square Social Previews
export const injectSquareOpenGraphMetaTags = (temple: Temple, shareUrl?: string) => {
  if (typeof document === 'undefined') return;

  const url = shareUrl || `${window.location.origin}${window.location.pathname}?templeId=${temple.id}`;
  const title = `${temple.name} - ପୂଜା ଓ ଜଳାଭିଷେକ ବୁକିଂ`;
  const description = `🚩 ${temple.name} (${temple.location || 'Odisha'}) ରେ ଜଳାଭିଷେକ ଏବଂ ସ୍ୱତନ୍ତ୍ର ପୂଜା ବୁକିଂ କରନ୍ତୁ।`;
  const imageUrl = temple.imageUrl || (temple as any).image || '';

  if (title) {
    document.title = title;
  }

  const updateOrSetMeta = (attrName: 'name' | 'property', attrValue: string, contentValue: string) => {
    let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attrName, attrValue);
      document.head.appendChild(el);
    }
    el.setAttribute('content', contentValue);
  };

  // Twitter Card -> summary forces 1:1 square preview
  updateOrSetMeta('name', 'twitter:card', 'summary');
  updateOrSetMeta('name', 'twitter:title', title);
  updateOrSetMeta('name', 'twitter:description', description);
  updateOrSetMeta('name', 'twitter:image', imageUrl);

  // Open Graph 1:1 Square Dimensions & Meta Specs
  updateOrSetMeta('property', 'og:type', 'website');
  updateOrSetMeta('property', 'og:title', title);
  updateOrSetMeta('property', 'og:description', description);
  updateOrSetMeta('property', 'og:url', url);
  updateOrSetMeta('property', 'og:image', imageUrl);
  updateOrSetMeta('property', 'og:image:width', '800');
  updateOrSetMeta('property', 'og:image:height', '800');
};

// Dynamic Meta Tag Injection (Runs immediately on page load to swap og:title & og:image)
export const swapMetaTagsOnPageLoad = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  try {
    const params = new URLSearchParams(window.location.search);
    const templeId = params.get('templeId');
    if (!templeId) return;

    let temples: Temple[] = [];
    const raw = localStorage.getItem('temple_system_temples_json') || localStorage.getItem('savedTemples');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        temples = parsed;
      }
    }

    const matchedTemple = temples.find((t) => t.id === templeId);
    if (matchedTemple) {
      injectSquareOpenGraphMetaTags(matchedTemple);
    }
  } catch (err) {
    console.warn('Dynamic meta tag swap error on page load:', err);
  }
};

// Execute immediately on script evaluation
if (typeof window !== 'undefined') {
  swapMetaTagsOnPageLoad();
}

export const TempleBookingView: React.FC<TempleBookingViewProps> = ({ userPhone = '' }) => {
  const [temples, setTemples] = useState<Temple[]>([]);
  const [bookings, setBookings] = useState<TempleBooking[]>([]);

  // Booking Modal Flow State
  const [selectedTemple, setSelectedTemple] = useState<Temple | null>(null);
  const [selectedHistoryTemple, setSelectedHistoryTemple] = useState<Temple | null>(null);
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3>(1);

  // Puja Types State
  const [pujaTypes, setPujaTypes] = useState<string[]>(() => getPujaTypesFromLocal());

  // Form Fields
  const [userName, setUserName] = useState('');
  const [phone, setPhone] = useState(userPhone);
  const [userAddress, setUserAddress] = useState('');
  const [gotraRasi, setGotraRasi] = useState('');
  const [bookingType, setBookingType] = useState<string>('');
  const [utrRef, setUtrRef] = useState('');
  const [isConsentChecked, setIsConsentChecked] = useState(false);

  // Submit Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Copy state for share button
  const [copiedTempleId, setCopiedTempleId] = useState<string | null>(null);

  // User Reschedule & Cancel Modal States
  const [rescheduleBookingId, setRescheduleBookingId] = useState<string | null>(null);
  const [requestedNewDate, setRequestedNewDate] = useState('');
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState(false);

  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const [userCancelReasonInput, setUserCancelReasonInput] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  // Track My Booking Portal States
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [trackNameInput, setTrackNameInput] = useState('');
  const [trackPhoneInput, setTrackPhoneInput] = useState(userPhone || '');
  const [hasSearchedTrack, setHasSearchedTrack] = useState(false);
  const [trackResults, setTrackResults] = useState<TempleBooking[]>([]);

  // Re-sync track results automatically when bookings change
  useEffect(() => {
    if (hasSearchedTrack) {
      const name = trackNameInput.trim().toLowerCase();
      const phoneNum = trackPhoneInput.trim().replace(/\D/g, '');

      const matches = bookings.filter((b) => {
        const matchPhone = phoneNum ? b.userPhone.replace(/\D/g, '').includes(phoneNum) : true;
        const matchName = name ? b.userName.toLowerCase().includes(name) || b.id.toLowerCase().includes(name) : true;
        return matchPhone && matchName;
      });

      setTrackResults(matches);
    }
  }, [bookings, hasSearchedTrack, trackNameInput, trackPhoneInput]);

  const handleSearchTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const name = trackNameInput.trim().toLowerCase();
    const phoneNum = trackPhoneInput.trim().replace(/\D/g, '');

    if (!name && !phoneNum) {
      alert('ଦୟାକରି ଆପଣଙ୍କ ନାମ କିମ୍ବା ମୋବାଇଲ୍ ନମ୍ବର ପ୍ରବେଶ କରନ୍ତୁ। (Please enter Name or Mobile Number)');
      return;
    }

    const matches = bookings.filter((b) => {
      const matchPhone = phoneNum ? b.userPhone.replace(/\D/g, '').includes(phoneNum) : true;
      const matchName = name ? b.userName.toLowerCase().includes(name) || b.id.toLowerCase().includes(name) : true;
      return matchPhone && matchName;
    });

    setTrackResults(matches);
    setHasSearchedTrack(true);
  };

  // Deep-linking URL check & Puja Types Subscription
  useEffect(() => {
    const unsubTemples = subscribeTemples((data) => setTemples(data));
    const unsubBookings = subscribeBookings((data) => setBookings(data));
    const unsubPujas = subscribePujaTypes((data) => {
      setPujaTypes(data);
      if (data.length > 0 && (!bookingType || !data.includes(bookingType))) {
        setBookingType(data[0]);
      }
    });

    // Check URL parameters for direct deep-link to temple
    const params = new URLSearchParams(window.location.search);
    const templeParam = params.get('templeId');
    if (templeParam) {
      setTimeout(() => {
        const targetCard = document.getElementById(`temple-card-${templeParam}`);
        if (targetCard) {
          targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }

    return () => {
      unsubTemples();
      unsubBookings();
      unsubPujas();
    };
  }, []);

  // Dynamic 1:1 Square Open Graph meta tag injection on deep-link load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const templeParam = params.get('templeId');
    if (templeParam && temples.length > 0) {
      const target = temples.find((t) => t.id === templeParam);
      if (target) {
        injectSquareOpenGraphMetaTags(target);
      }
    }
  }, [temples]);

  // Update phone if prop changes
  useEffect(() => {
    if (userPhone && !phone) {
      setPhone(userPhone);
    }
  }, [userPhone]);

  const openBookingModal = (temple: Temple) => {
    setSelectedTemple(temple);
    setBookingStep(1);
    setSubmitSuccess(null);
    setSubmitError(null);
    setUtrRef('');
    setIsConsentChecked(false);
    if (pujaTypes.length > 0 && (!bookingType || !pujaTypes.includes(bookingType))) {
      setBookingType(pujaTypes[0]);
    }
  };

  const closeBookingModal = () => {
    setSelectedTemple(null);
    setBookingStep(1);
    setSubmitError(null);
    setIsConsentChecked(false);
  };

  const handleNextToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !phone.trim() || !userAddress.trim()) {
      setSubmitError('ଦୟାକରି ଆପଣଙ୍କର ପୂରା ନାମ, ମୋବାଇଲ୍ ନମ୍ବର ଏବଂ ଠିକଣା ପୂରଣ କରନ୍ତୁ।');
      return;
    }
    setSubmitError(null);
    setBookingStep(2);
  };

  // Handle User Reschedule Submission
  const handleUserRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleBookingId || !requestedNewDate.trim()) return;
    try {
      setIsSubmittingReschedule(true);
      const ok = await requestBookingReschedule(rescheduleBookingId, requestedNewDate.trim());
      if (ok) {
        alert('ଆପଣଙ୍କର ପୂଜା ତାରିଖ ପରିବର୍ତ୍ତନ ଅନୁରୋଧ ଦାଖଲ ହେଲା। ଆଡମିନ୍‌ଙ୍କ ଅନୁମୋଦନ ଅପେକ୍ଷା କରନ୍ତୁ।');
        setRescheduleBookingId(null);
        setRequestedNewDate('');
      } else {
        alert('ତ୍ରୁଟି: ତାରିଖ ପରିବର୍ତ୍ତନ ହୋଇପାରିଲା ନାହିଁ।');
      }
    } finally {
      setIsSubmittingReschedule(false);
    }
  };

  // Handle User Cancellation
  const handleUserCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelBookingId) return;
    try {
      setIsSubmittingCancel(true);
      const ok = await cancelUserBooking(cancelBookingId, userCancelReasonInput.trim() || 'User requested cancellation');
      if (ok) {
        alert('ଆପଣଙ୍କର ବୁକିଂ ବାତିଲ୍ (Cancelled) ହୋଇଗଲା।');
        setCancelBookingId(null);
        setUserCancelReasonInput('');
      } else {
        alert('ତ୍ରୁଟି: ବୁକିଂ ବାତିଲ୍ ହୋଇପାରିଲା ନାହିଁ।');
      }
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrRef.trim() || utrRef.trim().length < 4) {
      setSubmitError('ଦୟାକରି ସଠିକ୍ UTR / Payment Proof ନମ୍ବର ପ୍ରବେଶ କରନ୍ତୁ।');
      return;
    }

    if (!isConsentChecked) {
      setSubmitError('ଦୟାକରି ନିମ୍ନଲିଖିତ ସମ୍ମତି ବାକ୍ସ (Consent Checkbox) ଟିକ୍ କରନ୍ତୁ।');
      return;
    }

    if (!selectedTemple) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const res = await submitTempleBooking({
        templeId: selectedTemple.id,
        templeName: selectedTemple.name,
        templeLocation: selectedTemple.location,
        pujariPhone: selectedTemple.pujariPhone,
        userName: userName.trim(),
        userPhone: phone.trim(),
        userAddress: userAddress.trim(),
        gotraRasi: gotraRasi.trim(),
        bookingType,
        utrRef: utrRef.trim(),
      });

      if (res.success) {
        setSubmitSuccess(res.bookingId);
      } else {
        setSubmitError('ବୁକିଂ ଦାଖଲ କରିବାରେ ତ୍ରୁଟି ହେଲା। ଦୟାକରି ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।');
      }
    } catch (err) {
      setSubmitError('ତ୍ରୁଟି: ବୁକିଂ ହୋଇପାରିଲା ନାହିଁ।');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Deep Share Handler with Mobile Priority Web Share API
  const handleShareTemple = async (temple: Temple) => {
    const templeImg = temple.imageUrl || (temple as any).image || '';
    const shareUrl = `${window.location.origin}${window.location.pathname}?templeId=${temple.id}`;
    
    // Dynamically inject 1:1 Square Open Graph & Twitter Card meta tags for Social Media Previews
    injectSquareOpenGraphMetaTags(temple, shareUrl);

    const shareTitle = `${temple.name} - ପୂଜା ଓ ଜଳାଭିଷେକ ବୁକିଂ`;
    const shareText = `🙏 ଦର୍ଶନ ଏବଂ ପୂଜା ବୁକିଂ କରନ୍ତୁ: ${temple.name}\n\nମନ୍ଦିର ଫଟୋ: ${templeImg}\n\nଏଠାରେ ବୁକିଂ କରନ୍ତୁ: `;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        console.log('Native share dismissed or failed:', err);
      }
    }

    // Fallback: Copy Link or Direct WhatsApp API
    const fullMsg = `${shareText}\n${shareUrl}`;
    try {
      await navigator.clipboard.writeText(fullMsg);
      setCopiedTempleId(temple.id);
      setTimeout(() => setCopiedTempleId(null), 3000);
    } catch (clipErr) {
      // WhatsApp fallback
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(fullMsg)}`, '_blank');
    }
  };

  // Filter user bookings for "My Bookings"
  const userBookings = bookings.filter((b) => phone && b.userPhone.includes(phone.trim()));

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 p-2 sm:p-4 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#701a1e] via-[#8B0000] to-[#5c0f12] text-white rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-amber-400 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-amber-400/20 text-amber-200 border border-amber-400/50 rounded-full text-xs font-black">
              <span>🚩 ଓଡ଼ିଶାର ପ୍ରସିଦ୍ଧ ମନ୍ଦିର ସେବା</span>
            </div>

            <button
              onClick={() => setIsTrackModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 font-black text-xs rounded-2xl shadow-xl border-2 border-amber-200 transition cursor-pointer flex items-center gap-1.5 transform hover:scale-105 active:scale-95"
            >
              <Search className="w-4 h-4 text-amber-950 shrink-0" />
              <span>Track Booking (ବୁକିଂ ଷ୍ଟାଟସ୍)</span>
            </button>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-amber-100 tracking-tight leading-tight">
            ମନ୍ଦିର ପୂଜା ଏବଂ ଜଳାଭିଷେକ ବୁକିଂ ସେବା
          </h2>
          <p className="text-xs sm:text-sm text-amber-200/90 font-medium leading-relaxed">
            ଘରେ ବସି ପ୍ରସିଦ୍ଧ ମନ୍ଦିର ମାନଙ୍କରେ ଜଳାଭିଷେକ ଓ ସ୍ୱତନ୍ତ୍ର ପୂଜା ବୁକିଂ କରନ୍ତୁ। ଆଡମିନ୍‌ଙ୍କ ସ୍ୱୀକୃତି ପରେ ତୁରନ୍ତ ଡିଜିଟାଲ୍ ସ୍ୱୀକୃତ JPG ରସିଦ୍ ଡାଉନଲୋଡ୍ କରନ୍ତୁ।
          </p>
        </div>
      </div>

      {/* TEMPLES DISPLAY GRID */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-lg sm:text-xl font-black text-amber-950 flex items-center gap-2">
            <span>🏛️</span>
            <span>ଉପଲବ୍ଧ ମନ୍ଦିର ସମୂହ (Available Temples)</span>
          </h3>
          <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
            {temples.length} ଟି ମନ୍ଦିର
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {temples.map((temple) => (
            <div
              key={temple.id}
              id={`temple-card-${temple.id}`}
              className="bg-white rounded-3xl border-2 border-amber-300/80 shadow-md hover:shadow-2xl transition duration-300 overflow-hidden flex flex-col justify-between group"
            >
              <div>
                {/* Temple Image & Badges (1:1 Aspect Ratio) */}
                <div className="w-full aspect-square bg-amber-100 relative overflow-hidden">
                  <img
                    src={temple.imageUrl}
                    alt={temple.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1627894483216-2138af692e32?q=80&w=800&auto=format&fit=crop';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                    {temple.isJalAbhishekAvailable !== false && (
                      <span className="bg-amber-500 text-amber-950 font-black text-[10px] px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 border border-amber-300">
                        <span>{temple.customPujaLabel || '🌊 ଜଳାଭିଷେକ ଉପଲବ୍ଧ'}</span>
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h4 className="text-base sm:text-lg font-black drop-shadow text-amber-100 leading-snug">
                      {temple.name}
                    </h4>
                  </div>
                </div>

                {/* Body Info */}
                <div className="p-4 sm:p-5 space-y-3 text-xs">
                  <div className="flex items-start gap-2 text-slate-700 font-semibold">
                    <MapPin className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <span>{temple.location}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700 font-semibold">
                    <Phone className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>ପୂଜାରୀ ନମ୍ବର: <strong className="font-mono text-amber-950">{temple.pujariPhone}</strong></span>
                  </div>

                  {temple.description && (
                    <p className="text-[11px] text-amber-900/80 bg-amber-50 p-2.5 rounded-xl border border-amber-200 font-medium">
                      {temple.description}
                    </p>
                  )}

                  {/* Read History Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedHistoryTemple(temple)}
                    className="w-full py-2 px-3 bg-amber-100/90 hover:bg-amber-200 text-amber-950 rounded-xl border border-amber-300/80 font-extrabold text-[11px] transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-800" />
                    <span>ମନ୍ଦିର ଇତିହାସ (Read Temple History)</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-amber-50/60 border-t border-amber-200/80 flex items-center gap-2">
                <button
                  onClick={() => openBookingModal(temple)}
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-white font-extrabold rounded-2xl text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 text-amber-300" />
                  <span>ବୁକିଂ କରନ୍ତୁ (Book Now)</span>
                </button>

                <button
                  onClick={() => handleShareTemple(temple)}
                  title="Share Temple"
                  className="px-3 py-2.5 bg-amber-200 hover:bg-amber-300 text-amber-950 font-black rounded-2xl text-xs border border-amber-400 transition cursor-pointer flex items-center gap-1 shrink-0"
                >
                  {copiedTempleId === temple.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      <span className="text-[10px]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-amber-900" />
                      <span className="hidden sm:inline text-[10px]">Share</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MY SUBMITTED BOOKINGS LIST */}
      {userBookings.length > 0 && (
        <div className="bg-white rounded-3xl border-2 border-amber-300 p-5 sm:p-6 shadow-md space-y-4">
          <h3 className="text-base sm:text-lg font-black text-amber-950 flex items-center gap-2 border-b border-amber-200 pb-3">
            <span>📋</span>
            <span>ମୋର ବୁକିଂ ସମୂହ (My Bookings - {phone})</span>
          </h3>

          <div className="space-y-3">
            {userBookings.map((b) => {
              const matchedTemple = temples.find((t) => t.id === b.templeId);
              const isActiveBooking = b.status !== 'cancelled' && b.status !== 'rejected';

              return (
                <div
                  key={b.id}
                  className={`p-4 rounded-2xl border-2 transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    b.status === 'approved'
                      ? 'bg-emerald-50/80 border-emerald-300'
                      : b.status === 'rescheduled'
                      ? 'bg-indigo-50/80 border-indigo-300'
                      : b.status === 'waiting_list'
                      ? 'bg-purple-50/80 border-purple-300'
                      : b.status === 'cancelled'
                      ? 'bg-slate-100 border-slate-300 opacity-80'
                      : b.status === 'rejected'
                      ? 'bg-rose-50/80 border-rose-300'
                      : 'bg-amber-50/80 border-amber-300'
                  }`}
                >
                  <div className="space-y-1.5 text-xs min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] bg-white px-2.5 py-0.5 rounded-md border-2 border-amber-400 font-black text-amber-950 shadow-xs">
                        ID: {b.id}
                      </span>
                      <strong className="text-sm font-black text-amber-950">{b.templeName}</strong>

                      {b.status === 'approved' && (
                        <span className="px-2.5 py-0.5 bg-emerald-600 text-white font-extrabold rounded-full text-[10px]">
                          ✓ APPROVED (ଅନୁମୋଦିତ)
                        </span>
                      )}
                      {b.status === 'rescheduled' && (
                        <span className="px-2.5 py-0.5 bg-indigo-600 text-white font-extrabold rounded-full text-[10px]">
                          📅 RESCHEDULED (ସମୟ ପରିବର୍ତ୍ତିତ)
                        </span>
                      )}
                      {b.status === 'waiting_list' && (
                        <span className="px-2.5 py-0.5 bg-purple-600 text-white font-extrabold rounded-full text-[10px]">
                          ⏳ WAITING LIST (ୱେଟିଂ ଲିଷ୍ଟ୍)
                        </span>
                      )}
                      {b.status === 'pending' && (
                        <span className="px-2.5 py-0.5 bg-amber-500 text-amber-950 font-extrabold rounded-full text-[10px]">
                          ⏳ PENDING VERIFICATION
                        </span>
                      )}
                      {b.status === 'cancelled' && (
                        <span className="px-2.5 py-0.5 bg-slate-600 text-white font-extrabold rounded-full text-[10px]">
                          🚫 CANCELLED (ବାତିଲ୍)
                        </span>
                      )}
                      {b.status === 'rejected' && (
                        <span className="px-2.5 py-0.5 bg-rose-600 text-white font-extrabold rounded-full text-[10px]">
                          ✕ REJECTED
                        </span>
                      )}
                    </div>

                    <div className="text-slate-700 font-medium">
                      ଭକ୍ତ: <strong className="text-slate-900">{b.userName}</strong> • ଠିକଣା: {b.userAddress}
                    </div>

                    <div className="text-slate-600 text-[11px] font-mono">
                      Platform Fee Paid: ₹5 (Verified) • UTR: {b.utrRef}
                    </div>

                    {(b.status === 'approved' || b.status === 'rescheduled') && b.pujaDateTime && (
                      <div className="mt-1 text-emerald-900 font-bold bg-emerald-100/90 p-2 rounded-xl border border-emerald-300 flex items-center gap-1.5 text-xs">
                        <Calendar className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>ନିର୍ଦ୍ଧାରିତ ପୂଜା / ଜଳାଭିଷେକ ସମୟ: <strong>{b.pujaDateTime}</strong></span>
                      </div>
                    )}

                    {b.isRescheduleRequested && b.requestedRescheduleDate && (
                      <div className="text-amber-900 font-semibold bg-amber-100/90 p-2 rounded-xl border border-amber-300 flex items-center gap-1.5 text-xs mt-1">
                        <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>ଅନୁରୋଧିତ ନୂତନ ତାରିଖ: <strong>{b.requestedRescheduleDate}</strong> (Pending Admin Approval)</span>
                      </div>
                    )}

                    {(b.adminReason || b.rejectionReason) && (
                      <div className="text-slate-800 text-[11px] font-semibold bg-white/80 p-2 rounded-xl border border-slate-200 mt-1">
                        📢 <strong>Admin Note / Reason:</strong> {b.adminReason || b.rejectionReason}
                      </div>
                    )}
                  </div>

                  {/* Right side controls */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {(b.status === 'approved' || b.status === 'rescheduled') && (
                      <button
                        onClick={() => generateTempleReceiptJPG(b, matchedTemple)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>JPG Receipt</span>
                      </button>
                    )}

                    {isActiveBooking && (
                      <>
                        <button
                          onClick={() => {
                            setRescheduleBookingId(b.id);
                            setRequestedNewDate(b.pujaDateTime || '');
                          }}
                          className="px-3 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-900 border border-indigo-300 font-extrabold rounded-xl text-xs transition cursor-pointer flex items-center gap-1"
                        >
                          <Calendar className="w-3.5 h-3.5 text-indigo-700" />
                          <span>Request Date Change</span>
                        </button>

                        <button
                          onClick={() => {
                            setCancelBookingId(b.id);
                            setUserCancelReasonInput('');
                          }}
                          className="px-3 py-2 bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 font-extrabold rounded-xl text-xs transition cursor-pointer flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5 text-rose-700" />
                          <span>Cancel Booking</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MULTI-STEP BOOKING MODAL */}
      {selectedTemple && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border-2 border-amber-400 shadow-2xl w-full max-w-lg overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#701a1e] via-[#8B0000] to-[#5c0f12] text-white p-4 sm:p-5 flex items-center justify-between border-b border-amber-400">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider">
                  STEP {bookingStep} OF 3
                </span>
                <h3 className="text-base sm:text-lg font-black text-amber-100 leading-tight">
                  {selectedTemple.name}
                </h3>
                {selectedTemple.isJalAbhishekAvailable !== false && (
                  <span className="inline-block mt-1 bg-amber-400/20 text-amber-200 border border-amber-400/40 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                    {selectedTemple.customPujaLabel || '🌊 ଜଳାଭିଷେକ ବୁକିଂ ଉପଲବ୍ଧ (Jal Abhishek Available)'}
                  </span>
                )}
              </div>
              <button
                onClick={closeBookingModal}
                className="p-1.5 hover:bg-white/20 rounded-full transition text-amber-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Progress Stepper */}
            <div className="bg-amber-100/80 px-4 py-2.5 border-b border-amber-200 flex items-center justify-between text-xs font-bold text-amber-950">
              <span className={bookingStep === 1 ? 'text-amber-900 font-extrabold underline' : 'text-amber-700/60'}>
                ୧. ଭକ୍ତଙ୍କ ତଥ୍ୟ
              </span>
              <span>→</span>
              <span className={bookingStep === 2 ? 'text-amber-900 font-extrabold underline' : 'text-amber-700/60'}>
                ୨. ପ୍ଲାଟଫର୍ମ ଫି (₹୫)
              </span>
              <span>→</span>
              <span className={bookingStep === 3 ? 'text-amber-900 font-extrabold underline' : 'text-amber-700/60'}>
                ୩. UTR ଦାଖଲ
              </span>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {submitError && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {submitSuccess ? (
                <div className="py-6 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 border-2 border-emerald-400 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-emerald-950">
                      ବୁକିଂ ଅନୁରୋଧ ସଫଳତାପୂର୍ବକ ଦାଖଲ ହେଲା!
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      ଆପଣଙ୍କର ବୁକିଂ ID: <strong className="font-mono text-amber-900">{submitSuccess}</strong>
                    </p>
                  </div>
                  <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-xs text-amber-900 leading-relaxed font-medium">
                    ଆଡମିନ୍ ଆପଣଙ୍କ UTR ଯାଞ୍ଚ କରି ପୂଜା / ଜଳାଭିଷେକ ପାଇଁ ତାରିଖ ଓ ସମୟ ନିର୍ଦ୍ଧାରଣ କରିବେ। ଅନୁମୋଦନ ପରେ ଏହି ସ୍ଥାନରୁ JPG ରସିଦ୍ ଡାଉନଲୋଡ୍ କରିପାରିବେ।
                  </div>
                  <button
                    onClick={closeBookingModal}
                    className="w-full py-3 bg-amber-800 hover:bg-amber-900 text-white font-black rounded-2xl text-xs shadow-md cursor-pointer transition"
                  >
                    ବନ୍ଦ କରନ୍ତୁ (Close)
                  </button>
                </div>
              ) : bookingStep === 1 ? (
                /* STEP 1: USER DETAILS FORM */
                <form onSubmit={handleNextToPayment} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-extrabold text-amber-950 mb-1">
                      ଭକ୍ତଙ୍କ ପୂରା ନାମ (Full Name) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ଉଦାହରଣ: ରମେଶ ଚନ୍ଦ୍ର ସାହୁ"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/50 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-extrabold text-amber-950 mb-1">
                      ମୋବାଇଲ୍ ନମ୍ବର (Mobile Number) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit Mobile Number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/50 font-mono font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-extrabold text-amber-950 mb-1">
                      ଠିକଣା / ଗ୍ରାମ / ସହର (Address) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ଉଦାହରଣ: ପୁରୀ, ଓଡ଼ିଶା"
                      value={userAddress}
                      onChange={(e) => setUserAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/50 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-extrabold text-amber-950 mb-1">
                      ଗୋତ୍ର / ରାଶି (Gotra / Rasi - Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="ଉଦାହରଣ: କାଶ୍ୟପ ଗୋତ୍ର, ମେଷ ରାଶି"
                      value={gotraRasi}
                      onChange={(e) => setGotraRasi(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/50 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-extrabold text-amber-950 mb-1">
                      ପୂଜାର ପ୍ରକାର (Select Puja Type) *
                    </label>
                    <select
                      required
                      value={bookingType}
                      onChange={(e) => setBookingType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border-2 border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/50 font-bold text-amber-950 cursor-pointer"
                    >
                      {pujaTypes.length === 0 ? (
                        <option value="Jal Abhishek (ଜଳାଭିଷେକ)">Jal Abhishek (ଜଳାଭିଷେକ)</option>
                      ) : (
                        pujaTypes.map((pt) => (
                          <option key={pt} value={pt}>
                            {pt}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-white font-extrabold rounded-2xl text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer mt-4"
                  >
                    <span>ଆଗକୁ ବଢନ୍ତୁ (Next to Payment)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : bookingStep === 2 ? (
                /* STEP 2: PAYMENT & QR CODE */
                <div className="space-y-4 text-xs text-center">
                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-300 space-y-1">
                    <span className="font-extrabold text-amber-950 block text-sm">
                      ପ୍ଲାଟଫର୍ମ ଫି (Platform Fee)
                    </span>
                    <div className="text-2xl font-black text-amber-900">₹୫ (Rupees Five)</div>
                    <p className="text-[11px] text-amber-800 font-medium">
                      Pay ₹5 Platform Fee to confirm your booking.
                    </p>
                  </div>

                  {/* QR Code Display */}
                  <div className="bg-white border-2 border-amber-400 rounded-2xl p-4 shadow-md inline-block mx-auto max-w-xs">
                    <img
                      src={
                        selectedTemple.qrCodeUrl ||
                        'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=400&auto=format&fit=crop'
                      }
                      alt="Paytm QR Code"
                      className="w-48 h-48 object-cover mx-auto rounded-xl border border-amber-200"
                    />
                    <div className="mt-2 text-[11px] font-black text-amber-950">
                      Scan QR Code with Paytm / PhonePe / Google Pay
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setBookingStep(1)}
                      className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>ପଛକୁ ଯାଆନ୍ତୁ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingStep(3)}
                      className="flex-1 py-2.5 bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-white font-extrabold rounded-xl text-xs shadow-md cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>ପେମେଣ୍ଟ୍ କଲି (Next: Enter UTR)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                /* STEP 3: UTR INPUT & FINAL SUBMISSION */
                <form onSubmit={handleSubmitBooking} className="space-y-4 text-xs">
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-950 text-[11px] font-medium leading-relaxed">
                    ✅ ପେମେଣ୍ଟ୍ ସଫଳ ହେବା ପରେ, ଆପଣଙ୍କ UPI ଆପ୍ (Paytm / PhonePe / GPay) ରୁ <strong>12-Digit UTR / Ref Number</strong> କପି କରି ଏଠାରେ ପୂରଣ କରନ୍ତୁ।
                  </div>

                  <div>
                    <label className="block font-extrabold text-amber-950 mb-1">
                      UTR / Payment Proof Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., 423456789012"
                      value={utrRef}
                      onChange={(e) => setUtrRef(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border-2 border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/50 font-mono text-sm font-bold"
                    />
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1 text-[11px] font-semibold text-amber-900">
                    <div>ମନ୍ଦିର: {selectedTemple.name}</div>
                    <div>ଭକ୍ତଙ୍କ ନାମ: {userName}</div>
                    <div>ଦେୟ ସ୍ଥିତି: Platform Fee Paid ₹5 (Verified)</div>
                  </div>

                  {/* Mandatory Platform Fee Consent Checkbox */}
                  <div className="p-3 bg-amber-50/90 border-2 border-amber-300 rounded-xl flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="platform-fee-consent"
                      required
                      checked={isConsentChecked}
                      onChange={(e) => setIsConsentChecked(e.target.checked)}
                      className="w-4 h-4 mt-0.5 text-amber-700 rounded border-amber-400 focus:ring-amber-500 cursor-pointer shrink-0"
                    />
                    <label htmlFor="platform-fee-consent" className="text-[11px] font-extrabold text-amber-950 cursor-pointer leading-snug">
                      ମୁଁ ସହମତ ଯେ ଏହି ୫ ଟଙ୍କା କେବଳ ପ୍ଲାଟଫର୍ମ ବୁକିଂ ଫି ଅଟେ। ମନ୍ଦିରରେ ପୂଜା ପାଇଁ ଆବଶ୍ୟକୀୟ ଦକ୍ଷିଣା ବା ଖର୍ଚ୍ଚ ମୁଁ ନିଜେ ସିଧାସଳଖ ପୂଜାରୀଙ୍କୁ ଦେବି।
                    </label>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setBookingStep(2)}
                      className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>ପଛକୁ</span>
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 text-white font-extrabold rounded-xl text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isSubmitting ? 'ଦାଖଲ ହେଉଛି...' : 'Submit Booking'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
      {/* USER RESCHEDULE MODAL */}
      {rescheduleBookingId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl border-2 border-indigo-400 shadow-2xl w-full max-w-md overflow-hidden p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
              <h3 className="text-base font-black text-indigo-950 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-700" />
                <span>ତାରିଖ ପରିବର୍ତ୍ତନ ଅନୁରୋଧ (Request Date Change)</span>
              </h3>
              <button
                onClick={() => setRescheduleBookingId(null)}
                className="p-1 hover:bg-slate-100 rounded-full cursor-pointer text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUserRescheduleSubmit} className="space-y-3.5 text-xs">
              <p className="text-slate-600 font-medium">
                ବୁକିଂ ID: <strong className="font-mono text-indigo-950">{rescheduleBookingId}</strong> ପାଇଁ ଆପଣ ପସନ୍ଦ କରୁଥିବା ନୂତନ ତାରିଖ ଓ ସମୟ ପ୍ରବେଶ କରନ୍ତୁ:
              </p>

              <div>
                <label className="block font-extrabold text-slate-800 mb-1">
                  ଅନୁରୋଧିତ ନୂତନ ତାରିଖ ଏବଂ ସମୟ (Preferred New Date & Time) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., 20-Aug-2026, 09:00 AM"
                  value={requestedNewDate}
                  onChange={(e) => setRequestedNewDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-indigo-50/30 font-semibold text-slate-900"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 font-medium leading-relaxed">
                ℹ️ ଆପଣଙ୍କ ଅନୁରୋଧ ଆଡମିନ୍‌ଙ୍କ ନିକଟକୁ ଯିବ। ଆଡମିନ୍ ଅନୁମୋଦନ କରିବା ପରେ ଏହା ନିଶ୍ଚିତ ହେବ।
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRescheduleBookingId(null)}
                  className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl cursor-pointer"
                >
                  ବାତିଲ୍ (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReschedule}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingReschedule ? 'ଦାଖଲ ହେଉଛି...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USER CANCEL BOOKING MODAL */}
      {cancelBookingId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl border-2 border-rose-400 shadow-2xl w-full max-w-md overflow-hidden p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <h3 className="text-base font-black text-rose-950 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <span>ବୁକିଂ ବାତିଲ୍ କରନ୍ତୁ (Cancel Booking)</span>
              </h3>
              <button
                onClick={() => setCancelBookingId(null)}
                className="p-1 hover:bg-slate-100 rounded-full cursor-pointer text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUserCancelSubmit} className="space-y-3.5 text-xs">
              <p className="text-slate-700 font-medium">
                ଆପଣ ସତରେ ବୁକିଂ ID: <strong className="font-mono text-rose-950">{cancelBookingId}</strong> କୁ ବାତିଲ୍ କରିବାକୁ ଚାହୁଁଛନ୍ତି କି?
              </p>

              <div>
                <label className="block font-extrabold text-slate-800 mb-1">
                  ବାତିଲ୍ କରିବାର କାରଣ (Cancellation Reason - Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g., Personal emergency / Change of plans"
                  value={userCancelReasonInput}
                  onChange={(e) => setUserCancelReasonInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-rose-50/20 font-medium text-slate-900 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelBookingId(null)}
                  className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl cursor-pointer"
                >
                  ନା, ରଖନ୍ତୁ (Keep Booking)
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCancel}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingCancel ? 'ବାତିଲ୍ ହେଉଛି...' : 'Yes, Cancel Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEMPLE HISTORY & DESCRIPTION MODAL */}
      {selectedHistoryTemple && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl border-2 border-amber-500 shadow-2xl p-5 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4 animate-in fade-in zoom-in-95 duration-200 font-sans">
            <div className="flex items-center justify-between border-b border-amber-200 pb-3">
              <h3 className="text-base font-black text-amber-950 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-700" />
                <span>ମନ୍ଦିର ଇତିହାସ ଓ ମାହାତ୍ମ୍ୟ (Temple History)</span>
              </h3>
              <button
                onClick={() => setSelectedHistoryTemple(null)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="w-full aspect-square bg-amber-50 rounded-2xl overflow-hidden border-2 border-amber-300 max-h-60 shadow-inner">
                <img
                  src={selectedHistoryTemple.imageUrl}
                  alt={selectedHistoryTemple.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1627894483216-2138af692e32?q=80&w=800&auto=format&fit=crop';
                  }}
                />
              </div>

              <div>
                <h4 className="text-lg font-extrabold text-amber-950">{selectedHistoryTemple.name}</h4>
                <p className="text-slate-700 font-bold flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-700" />
                  <span>{selectedHistoryTemple.location}</span>
                </p>
              </div>

              <div className="p-4 bg-amber-50/90 border-2 border-amber-200 rounded-2xl text-xs sm:text-sm text-amber-950 font-medium leading-relaxed space-y-2 whitespace-pre-line shadow-xs">
                <div className="font-black text-amber-900 border-b border-amber-300/80 pb-1.5 flex items-center gap-1.5">
                  <span>📜</span>
                  <span>ମନ୍ଦିର ପୌରାଣିକ ଇତିହାସ (Temple History & Importance):</span>
                </div>
                <div className="leading-relaxed">
                  {selectedHistoryTemple.history || selectedHistoryTemple.description || 'ଏହି ମନ୍ଦିରର ଇତିହାସ ଏବଂ ମାହାତ୍ମ୍ୟ ଆଡମିନ୍‌ଙ୍କ ଦ୍ୱାରା ଶୀଘ୍ର ଯୋଡ଼ାଯିବ।'}
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-700 font-semibold bg-white p-2.5 rounded-xl border border-amber-200">
                <Phone className="w-4 h-4 text-amber-700 shrink-0" />
                <span>ପୂଜାରୀ ଯୋଗାଯୋଗ ନମ୍ବର: <strong className="font-mono text-amber-950">{selectedHistoryTemple.pujariPhone}</strong></span>
              </div>
            </div>

            <div className="pt-2 border-t border-amber-200 flex gap-2">
              <button
                onClick={() => setSelectedHistoryTemple(null)}
                className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold rounded-xl text-xs cursor-pointer"
              >
                ବନ୍ଦ କରନ୍ତୁ (Close)
              </button>
              <button
                onClick={() => {
                  const target = selectedHistoryTemple;
                  setSelectedHistoryTemple(null);
                  openBookingModal(target);
                }}
                className="flex-1 py-2.5 bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-white font-extrabold rounded-xl text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-300" />
                <span>ବୁକିଂ କରନ୍ତୁ (Book Now)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TRACK MY BOOKING / ORDERS MODAL */}
      {isTrackModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border-2 border-amber-400 shadow-2xl w-full max-w-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 font-sans">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#701a1e] via-[#8B0000] to-[#5c0f12] text-white p-4 sm:p-5 flex items-center justify-between border-b border-amber-400">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-400/20 rounded-xl border border-amber-400/50 text-amber-300">
                  <Search className="w-5 h-5 shrink-0" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-amber-100 leading-tight">
                    Track Booking / ବୁକିଂ ଷ୍ଟାଟସ୍ (My Orders)
                  </h3>
                  <p className="text-[11px] text-amber-200/90 font-medium">
                    ଆପଣଙ୍କ ନାମ ଏବଂ ମୋବାଇଲ୍ ନମ୍ବର ଦେଇ ବୁକିଂ ସ୍ଥିତି ଯାଞ୍ଚ କରନ୍ତୁ
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTrackModalOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-full transition text-amber-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Form Box */}
            <div className="p-4 sm:p-5 space-y-4 max-h-[80vh] overflow-y-auto bg-amber-50/30">
              <form onSubmit={handleSearchTrack} className="bg-white p-4 rounded-2xl border-2 border-amber-300 shadow-xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-extrabold text-amber-950 mb-1">
                      ଭକ୍ତଙ୍କ ନାମ (Devotee Name) *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Sahoo"
                      value={trackNameInput}
                      onChange={(e) => setTrackNameInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/50 font-medium text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-extrabold text-amber-950 mb-1">
                      ମୋବାଇଲ୍ ନମ୍ବର (Mobile Number) *
                    </label>
                    <input
                      type="tel"
                      placeholder="10-digit Mobile Number"
                      value={trackPhoneInput}
                      onChange={(e) => setTrackPhoneInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/50 font-mono font-medium text-slate-900"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-white font-extrabold rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Search className="w-4 h-4 text-amber-300" />
                    <span>Search My Booking (ଖୋଜନ୍ତୁ)</span>
                  </button>

                  {(trackNameInput || trackPhoneInput || hasSearchedTrack) && (
                    <button
                      type="button"
                      onClick={() => {
                        setTrackNameInput('');
                        setTrackPhoneInput('');
                        setHasSearchedTrack(false);
                        setTrackResults([]);
                      }}
                      className="px-3.5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </form>

              {/* Search Results Display Area */}
              {hasSearchedTrack && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-black text-amber-950">
                      📋 ଖୋଜାଯାଇଥିବା ବୁକିଂ ଫଳାଫଳ ({trackResults.length} Found)
                    </span>
                  </div>

                  {trackResults.length === 0 ? (
                    <div className="p-6 bg-white rounded-2xl border-2 border-dashed border-amber-300 text-center space-y-2">
                      <div className="text-3xl">🔍</div>
                      <h4 className="text-sm font-extrabold text-amber-950">
                        କୌଣସି ବୁକିଂ ମିଳିଲା ନାହିଁ (No Bookings Found)
                      </h4>
                      <p className="text-xs text-slate-600 max-w-sm mx-auto">
                        ଆପଣ ଦେଇଥିବା ନାମ ଏବଂ ମୋବାଇଲ୍ ନମ୍ବର ଯାଞ୍ଚ କରନ୍ତୁ କିମ୍ବା ନୂତନ ପୂଜା ବୁକିଂ କରନ୍ତୁ।
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {trackResults.map((b) => {
                        const matchedTemple = temples.find((t) => t.id === b.templeId);
                        const isActive = b.status !== 'cancelled' && b.status !== 'rejected';

                        return (
                          <div
                            key={b.id}
                            className={`p-4 sm:p-5 rounded-2xl border-2 shadow-md transition space-y-3 font-sans ${
                              b.status === 'approved'
                                ? 'bg-emerald-50/90 border-emerald-400'
                                : b.status === 'rescheduled'
                                ? 'bg-indigo-50/90 border-indigo-400'
                                : b.status === 'waiting_list'
                                ? 'bg-purple-50/90 border-purple-400'
                                : b.status === 'cancelled'
                                ? 'bg-slate-100 border-slate-300 opacity-85'
                                : b.status === 'rejected'
                                ? 'bg-rose-50/90 border-rose-400'
                                : 'bg-amber-50/90 border-amber-400'
                            }`}
                          >
                            {/* Card Top Row - Flipkart Style Header */}
                            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-amber-200/80 pb-2.5">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-xs bg-white px-2.5 py-0.5 rounded-md border-2 border-amber-400 font-black text-amber-950 shadow-2xs">
                                    ID: {b.id}
                                  </span>
                                  <span className="text-xs font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                                    🪔 {b.bookingType || 'Jal Abhishek'}
                                  </span>
                                </div>
                                <h4 className="text-base font-black text-amber-950 mt-1">
                                  {b.templeName}
                                </h4>
                              </div>

                              {/* Flipkart Style Status Pill */}
                              <div>
                                {b.status === 'approved' && (
                                  <span className="px-3 py-1 bg-emerald-600 text-white font-black text-xs rounded-full shadow-xs inline-flex items-center gap-1">
                                    ✓ APPROVED (ଅନୁମୋଦିତ)
                                  </span>
                                )}
                                {b.status === 'rescheduled' && (
                                  <span className="px-3 py-1 bg-indigo-600 text-white font-black text-xs rounded-full shadow-xs inline-flex items-center gap-1">
                                    📅 DATE CHANGED (ସମୟ ପରିବର୍ତ୍ତିତ)
                                  </span>
                                )}
                                {b.status === 'waiting_list' && (
                                  <span className="px-3 py-1 bg-purple-600 text-white font-black text-xs rounded-full shadow-xs inline-flex items-center gap-1">
                                    ⏳ WAITING LIST
                                  </span>
                                )}
                                {b.status === 'pending' && (
                                  <span className="px-3 py-1 bg-amber-500 text-amber-950 font-black text-xs rounded-full shadow-xs inline-flex items-center gap-1">
                                    ⏳ PENDING VERIFICATION
                                  </span>
                                )}
                                {b.status === 'cancelled' && (
                                  <span className="px-3 py-1 bg-slate-700 text-white font-black text-xs rounded-full shadow-xs inline-flex items-center gap-1">
                                    🚫 CANCELLED (ବାତିଲ୍)
                                  </span>
                                )}
                                {b.status === 'rejected' && (
                                  <span className="px-3 py-1 bg-rose-600 text-white font-black text-xs rounded-full shadow-xs inline-flex items-center gap-1">
                                    ✕ REJECTED
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Devotee Info Body */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-800">
                              <div>
                                <span className="text-slate-500 font-semibold">ଭକ୍ତଙ୍କ ନାମ:</span>{' '}
                                <strong className="font-extrabold text-slate-900">{b.userName}</strong>
                              </div>
                              <div>
                                <span className="text-slate-500 font-semibold">ମୋବାଇଲ୍:</span>{' '}
                                <strong className="font-mono font-bold text-slate-900">{b.userPhone}</strong>
                              </div>
                              <div>
                                <span className="text-slate-500 font-semibold">ଠିକଣା:</span>{' '}
                                <span className="font-medium text-slate-900">{b.userAddress}</span>
                              </div>
                              {b.gotraRasi && (
                                <div>
                                  <span className="text-slate-500 font-semibold">ଗୋତ୍ର / ରାଶି:</span>{' '}
                                  <span className="font-medium text-slate-900">{b.gotraRasi}</span>
                                </div>
                              )}
                              <div className="col-span-1 sm:col-span-2 text-slate-600 font-mono text-[11px] bg-white/80 p-2 rounded-xl border border-slate-200">
                                Platform Fee Paid: ₹5 (Verified) • Payment Proof UTR: <strong>{b.utrRef}</strong>
                              </div>
                            </div>

                            {/* Scheduled Time Box */}
                            {(b.status === 'approved' || b.status === 'rescheduled') && b.pujaDateTime && (
                              <div className="text-emerald-900 font-extrabold bg-emerald-100/90 p-2.5 rounded-xl border border-emerald-300 flex items-center gap-2 text-xs">
                                <Calendar className="w-4 h-4 text-emerald-700 shrink-0" />
                                <span>ନିର୍ଦ୍ଧାରିତ ପୂଜା / ଜଳାଭିଷେକ ସମୟ: <strong className="text-emerald-950 underline">{b.pujaDateTime}</strong></span>
                              </div>
                            )}

                            {/* Reschedule Request Box */}
                            {b.isRescheduleRequested && b.requestedRescheduleDate && (
                              <div className="text-amber-900 font-semibold bg-amber-100/90 p-2.5 rounded-xl border border-amber-300 flex items-center gap-2 text-xs">
                                <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                                <span>ଅନୁରୋଧିତ ନୂତନ ତାରିଖ: <strong>{b.requestedRescheduleDate}</strong> (Pending Admin Approval)</span>
                              </div>
                            )}

                            {/* Admin Reason / Note Box */}
                            {(b.adminReason || b.rejectionReason) && (
                              <div className="p-3 bg-amber-100/90 border-2 border-amber-300 rounded-xl text-xs text-amber-950 font-semibold flex items-start gap-2 shadow-2xs">
                                <span className="text-base shrink-0">📢</span>
                                <div>
                                  <span className="font-extrabold text-amber-900 block">Admin Note / Reason:</span>
                                  <span className="font-bold text-amber-950">{b.adminReason || b.rejectionReason}</span>
                                </div>
                              </div>
                            )}

                            {/* Card Action Buttons Footer */}
                            <div className="pt-2 border-t border-amber-200 flex flex-wrap items-center justify-end gap-2">
                              {(b.status === 'approved' || b.status === 'rescheduled') && (
                                <button
                                  type="button"
                                  onClick={() => generateTempleReceiptJPG(b, matchedTemple)}
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Download className="w-4 h-4" />
                                  <span>Download JPG Receipt (ରସିଦ୍ ଡାଉନଲୋଡ୍)</span>
                                </button>
                              )}

                              {isActive && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRescheduleBookingId(b.id);
                                      setRequestedNewDate(b.pujaDateTime || '');
                                    }}
                                    className="px-3 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-900 border border-indigo-300 font-extrabold rounded-xl text-xs transition cursor-pointer flex items-center gap-1"
                                  >
                                    <Calendar className="w-3.5 h-3.5 text-indigo-700" />
                                    <span>Request Date Change</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCancelBookingId(b.id);
                                      setUserCancelReasonInput('');
                                    }}
                                    className="px-3.5 py-2 bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 font-extrabold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
                                  >
                                    <X className="w-4 h-4 text-rose-700" />
                                    <span>Cancel My Booking (ବାତିଲ୍ କରନ୍ତୁ)</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-amber-100/80 border-t border-amber-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsTrackModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-black rounded-xl text-xs cursor-pointer transition shadow-xs"
              >
                ବନ୍ଦ କରନ୍ତୁ (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
