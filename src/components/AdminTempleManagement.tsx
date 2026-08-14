import React, { useState, useEffect } from 'react';
import { Temple, TempleBooking, ReceiptHeaderConfig } from '../types';
import {
  subscribeTemples,
  saveTemples,
  subscribeBookings,
  approveTempleBooking,
  rejectTempleBooking,
  updateBookingStatusByAdmin,
  subscribePujaTypes,
  savePujaTypes,
  getReceiptHeaderConfig,
  saveReceiptHeaderConfig,
  subscribeReceiptHeaderConfig,
  DEFAULT_RECEIPT_HEADER_CONFIG,
} from '../lib/templeApi';
import { generateTempleReceiptJPG } from '../lib/receiptGenerator';
import {
  Save,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Calendar,
  Building,
  Phone,
  MapPin,
  Image as ImageIcon,
  QrCode,
  Sparkles,
  Search,
  Check,
  AlertTriangle,
  Plus,
  Trash2,
  BookOpen,
  Edit3,
  FileText,
  RotateCcw,
} from 'lucide-react';

export const AdminTempleManagement: React.FC = () => {
  const [temples, setTemples] = useState<Temple[]>([]);
  const [bookings, setBookings] = useState<TempleBooking[]>([]);

  // Sub-tab: 'temple_settings' or 'booking_requests'
  const [subTab, setSubTab] = useState<'booking_requests' | 'temple_settings'>('booking_requests');

  // Search & Filter State for Bookings
  const [bookingFilter, setBookingFilter] = useState<
    'all' | 'pending' | 'approved' | 'waiting_list' | 'rescheduled' | 'cancelled' | 'rejected'
  >('pending');
  const [searchQuery, setSearchQuery] = useState('');

  // Admin Advanced Status Change Modal State
  const [editingBooking, setEditingBooking] = useState<TempleBooking | null>(null);
  const [targetStatus, setTargetStatus] = useState<TempleBooking['status']>('approved');
  const [adminReasonInput, setAdminReasonInput] = useState('');
  const [adminPujaDateTimeInput, setAdminPujaDateTimeInput] = useState('');
  const [isSubmittingAdminAction, setIsSubmittingAdminAction] = useState(false);

  // Puja Types Management State
  const [pujaTypes, setPujaTypes] = useState<string[]>([]);
  const [newPujaTypeInput, setNewPujaTypeInput] = useState('');
  const [editingPujaIndex, setEditingPujaIndex] = useState<number | null>(null);
  const [editingPujaText, setEditingPujaText] = useState<string>('');

  // Per-Temple Custom Puja Label Edit State
  const [editingLabelTempleIdx, setEditingLabelTempleIdx] = useState<number | null>(null);
  const [editingLabelText, setEditingLabelText] = useState<string>('');

  // Global Social Media Thumbnail State
  const [globalThumbnail, setGlobalThumbnail] = useState<string>(() => {
    return localStorage.getItem('globalThumbnail') || localStorage.getItem('main_app_thumbnail_url') || '';
  });

  // Receipt Header Management State
  const [receiptHeader, setReceiptHeader] = useState<ReceiptHeaderConfig>(() => getReceiptHeaderConfig());
  const [isSavingReceiptHeader, setIsSavingReceiptHeader] = useState(false);

  const handleGlobalThumbnailChange = (val: string) => {
    setGlobalThumbnail(val);
    localStorage.setItem('globalThumbnail', val);
    localStorage.setItem('main_app_thumbnail_url', val);
  };

  const handleSaveGlobalThumbnail = () => {
    const val = globalThumbnail.trim();
    localStorage.setItem('globalThumbnail', val);
    localStorage.setItem('main_app_thumbnail_url', val);
    alert('✅ ଥମ୍ବନେଲ୍ ଲିଙ୍କ୍ ସଫଳତାର ସହ ସେଭ୍ ହୋଇଗଲା! (Thumbnail Saved Successfully!)');
  };

  const handleSaveReceiptHeader = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingReceiptHeader(true);
    try {
      const ok = await saveReceiptHeaderConfig(receiptHeader);
      if (ok) {
        setStatusMsg({ text: '✅ ରସିଦ୍ ହେଡର୍ ସଫଳତାର ସହ ସେଭ୍ ହୋଇଗଲା! (Receipt Header Saved Successfully!)', type: 'success' });
        alert('✅ ରସିଦ୍ ହେଡର୍ ସଫଳତାର ସହ ସେଭ୍ ହୋଇଗଲା! (Receipt Header Saved Successfully!)');
        setTimeout(() => setStatusMsg(null), 4000);
      } else {
        setStatusMsg({ text: '❌ ରସିଦ୍ ହେଡର୍ ସଂରକ୍ଷଣ କରିବାରେ ତ୍ରୁଟି ହେଲା।', type: 'error' });
      }
    } finally {
      setIsSavingReceiptHeader(false);
    }
  };

  const handleResetReceiptHeader = () => {
    if (confirm('ଆପଣ ସତରେ ରସିଦ୍ ହେଡର୍‌କୁ ଡିଫଲ୍ଟ (Standard Sacred Header) କୁ ରିସେଟ୍ କରିବାକୁ ଚାହୁଁଛନ୍ତି କି?')) {
      const resetConfig: ReceiptHeaderConfig = { ...DEFAULT_RECEIPT_HEADER_CONFIG };
      setReceiptHeader(resetConfig);
      saveReceiptHeaderConfig(resetConfig);
      setStatusMsg({ text: '🔄 ରସିଦ୍ ହେଡର୍ ଡିଫଲ୍ଟକୁ ରିସେଟ୍ ହେଲା।', type: 'success' });
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  // Status Message Feedback
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const unsubT = subscribeTemples((data) => setTemples(data));
    const unsubB = subscribeBookings((data) => setBookings(data));
    const unsubP = subscribePujaTypes((data) => setPujaTypes(data));
    const unsubR = subscribeReceiptHeaderConfig((data) => setReceiptHeader(data));

    return () => {
      unsubT();
      unsubB();
      unsubP();
      unsubR();
    };
  }, []);

  const handleAddPujaType = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPujaTypeInput.trim();
    if (!trimmed) return;
    if (pujaTypes.includes(trimmed)) {
      alert('⚠️ ଏହି ପୂଜା ପ୍ରକାର ଅଗ୍ରିମ ଯୋଡ଼ାଯାଇଛି!');
      return;
    }
    const updated = [...pujaTypes, trimmed];
    setPujaTypes(updated);
    savePujaTypes(updated);
    setNewPujaTypeInput('');
    setStatusMsg({ text: `➕ ନୂତନ ପୂଜା ପ୍ରକାର '${trimmed}' ଯୋଡ଼ାଗଲା!`, type: 'success' });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleDeletePujaType = (index: number) => {
    const target = pujaTypes[index];
    if (confirm(`ଆପଣ ସତରେ '${target}' ପୂଜା ପ୍ରକାରକୁ ଡିଲିଟ୍ କରିବାକୁ ଚାହୁଁଛନ୍ତି କି?`)) {
      const updated = pujaTypes.filter((_, i) => i !== index);
      setPujaTypes(updated);
      savePujaTypes(updated);
      if (editingPujaIndex === index) {
        setEditingPujaIndex(null);
        setEditingPujaText('');
      }
      setStatusMsg({ text: '🗑️ ପୂଜା ପ୍ରକାର ହଟାଗଲା।', type: 'error' });
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  const handleStartEditPuja = (index: number, currentText: string) => {
    setEditingPujaIndex(index);
    setEditingPujaText(currentText);
  };

  const handleSaveEditPuja = (index: number) => {
    const trimmed = editingPujaText.trim();
    if (!trimmed) return;
    const updated = [...pujaTypes];
    updated[index] = trimmed;
    setPujaTypes(updated);
    savePujaTypes(updated);
    setEditingPujaIndex(null);
    setEditingPujaText('');
    setStatusMsg({ text: '✅ ପୂଜା ନାମ ସଂରକ୍ଷିତ ହେଲା!', type: 'success' });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleStartEditTempleLabel = (idx: number, currentLabel?: string) => {
    setEditingLabelTempleIdx(idx);
    setEditingLabelText(currentLabel || '🌊 ଜଳାଭିଷେକ ବୁକିଂ ଉପଲବ୍ଧ (Jal Abhishek Available)');
  };

  const handleSaveEditTempleLabel = (idx: number) => {
    const trimmed = editingLabelText.trim() || '🌊 ଜଳାଭିଷେକ ବୁକିଂ ଉପଲବ୍ଧ (Jal Abhishek Available)';
    const updatedTemples = [...temples];
    updatedTemples[idx] = { ...updatedTemples[idx], customPujaLabel: trimmed };
    setTemples(updatedTemples);
    saveTemples(updatedTemples);
    setEditingLabelTempleIdx(null);
    setEditingLabelText('');
    setStatusMsg({ text: '✅ ମନ୍ଦିର ବୁକିଂ ଲେବୁଲ୍ ପରିବର୍ତ୍ତିତ ଓ ସଂରକ୍ଷିତ ହେଲା!', type: 'success' });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleSaveAllPujaTypes = async () => {
    const ok = await savePujaTypes(pujaTypes);
    if (ok) {
      setStatusMsg({ text: '✅ ସମସ୍ତ ପୂଜା ପ୍ରକାର ସଫଳତାର ସହ ସଂରକ୍ଷିତ ହେଲା!', type: 'success' });
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  const handleTempleChange = (index: number, field: keyof Temple, value: any) => {
    setTemples((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddTemple = () => {
    const newId = `temple_${Date.now().toString().slice(-6)}`;
    const newTemple: Temple = {
      id: newId,
      name: '',
      location: '',
      pujariPhone: '',
      imageUrl: '',
      thumbnailUrl: '',
      qrCodeUrl: '',
      description: '',
      history: '',
      isJalAbhishekAvailable: true,
    };
    setTemples((prev) => [...prev, newTemple]);
    setStatusMsg({ text: '➕ ନୂତନ ମନ୍ଦିର ଯୋଡ଼ାଗଲା! Save Changes ରେ କ୍ଲିକ୍ କରି ସଂରକ୍ଷଣ କରନ୍ତୁ।', type: 'success' });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleDeleteTemple = async (index: number) => {
    const target = temples[index];
    if (confirm(`ଆପଣ ସତରେ '${target?.name || 'ଏହି ମନ୍ଦିର'}' କୁ ଡିଲିଟ୍ କରିବାକୁ ଚାହୁଁଛନ୍ତି କି?`)) {
      const updated = temples.filter((_, i) => i !== index);
      setTemples(updated);
      await saveTemples(updated);
      setStatusMsg({ text: '🗑️ ମନ୍ଦିର ହଟାଗଲା ଏବଂ ସଂରକ୍ଷିତ ହେଲା।', type: 'error' });
      setTimeout(() => setStatusMsg(null), 4000);
    }
  };

  const handleSaveTemples = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await saveTemples(temples);
    if (ok) {
      setStatusMsg({ text: '✅ ମନ୍ଦିର ତଥ୍ୟ ସଫଳତାର ସହ ସଂରକ୍ଷିତ ହେଲା! (Temple settings updated)', type: 'success' });
      alert('✅ ସମସ୍ତ ମନ୍ଦିର ତଥ୍ୟ ସଫଳତାର ସହ ସଂରକ୍ଷିତ ହେଲା! (All Temples Saved Successfully!)');
      setTimeout(() => setStatusMsg(null), 4000);
    } else {
      setStatusMsg({ text: '❌ ସଂରକ୍ଷଣ କରିବାରେ ତ୍ରୁଟି ହେଲା।', type: 'error' });
    }
  };

  const handleSaveSingleTemple = async (index: number) => {
    const target = temples[index];
    if (!target.name.trim() || !target.location.trim() || !target.pujariPhone.trim()) {
      alert('⚠️ ଦୟାକରି ମନ୍ଦିର ନାମ, ଠିକଣା ଏବଂ ପୂଜାରୀ ଫୋନ୍ ନମ୍ବର ପୂରଣ କରନ୍ତୁ!');
      return;
    }
    const ok = await saveTemples(temples);
    if (ok) {
      setStatusMsg({ text: `✅ '${target.name || 'ମନ୍ଦିର'}' ତଥ୍ୟ ସଫଳତାର ସହ ସଂରକ୍ଷିତ ହେଲା!`, type: 'success' });
      alert(`✅ '${target.name || 'ମନ୍ଦିର'}' ତଥ୍ୟ ସଫଳତାର ସହ ସେଭ୍ ହୋଇଗଲା! (Temple Saved Successfully!)`);
      setTimeout(() => setStatusMsg(null), 4000);
    } else {
      setStatusMsg({ text: '❌ ସଂରକ୍ଷଣ କରିବାରେ ତ୍ରୁଟି ହେଲା।', type: 'error' });
    }
  };

  const openAdminStatusModal = (booking: TempleBooking, initialStatus: TempleBooking['status'] = 'approved') => {
    setEditingBooking(booking);
    setTargetStatus(initialStatus);
    setAdminReasonInput(booking.adminReason || '');

    const defaultDateStr =
      booking.requestedRescheduleDate ||
      booking.pujaDateTime ||
      `${new Date(Date.now() + 86400000).toLocaleDateString('or-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })}, 08:30 AM`;
    setAdminPujaDateTimeInput(defaultDateStr);
  };

  const handleConfirmAdminStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;

    if (!adminReasonInput.trim()) {
      alert('⚠️ ଦୟାକରି କାରଣ / Remarks ଲେଖନ୍ତୁ! (Mandatory Reason is required for Admin actions)');
      return;
    }

    if ((targetStatus === 'approved' || targetStatus === 'rescheduled') && !adminPujaDateTimeInput.trim()) {
      alert('⚠️ ଦୟାକରି ପୂଜା/ଅଭିଷେକ ତାରିଖ ଓ ସମୟ ନିର୍ଦ୍ଧାରଣ କରନ୍ତୁ! (Date & Time required)');
      return;
    }

    try {
      setIsSubmittingAdminAction(true);
      const ok = await updateBookingStatusByAdmin(
        editingBooking.id,
        targetStatus,
        adminReasonInput.trim(),
        targetStatus === 'approved' || targetStatus === 'rescheduled' ? adminPujaDateTimeInput.trim() : undefined
      );

      if (ok) {
        setStatusMsg({
          text: `✅ ବୁକିଂ (${editingBooking.id}) ର ସ୍ଥିତି ${targetStatus.toUpperCase()} କୁ ପରିବର୍ତ୍ତିତ ହେଲା! Web Push Notification ପ୍ରେରଣ କରାଗଲା।`,
          type: 'success',
        });
        setTimeout(() => setStatusMsg(null), 5000);
        setEditingBooking(null);
      } else {
        alert('ତ୍ରୁଟି: ସ୍ଥିତି ବଦଳାଇ ହେଲା ନାହିଁ।');
      }
    } finally {
      setIsSubmittingAdminAction(false);
    }
  };

  // Filter Bookings
  const filteredBookings = bookings.filter((b) => {
    const matchesFilter = bookingFilter === 'all' || b.status === bookingFilter;
    const matchesSearch =
      !searchQuery ||
      b.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.userPhone.includes(searchQuery) ||
      b.templeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.utrRef.includes(searchQuery) ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingCount = bookings.filter((b) => b.status === 'pending').length;

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 text-white rounded-3xl p-5 sm:p-6 border border-amber-500/40 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-2xl">
            <Building className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-amber-100">
              🏛️ ମନ୍ଦିର ବୁକିଂ ଓ ପୂଜା ପରିଚାଳନା (Temple Management)
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              ମନ୍ଦିର ତଥ୍ୟ ସମ୍ପାଦନା • ଜଳାଭିଷେକ ବୁକିଂ ଅନୁମୋଦନ • ତାରିଖ ନିର୍ଦ୍ଧାରଣ • JPG ରସିଦ୍ ଡାଉନଲୋଡ୍
            </p>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex items-center bg-black/50 p-1 rounded-2xl border border-amber-500/30 text-xs font-bold">
          <button
            onClick={() => setSubTab('booking_requests')}
            className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 ${
              subTab === 'booking_requests'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-amber-200 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>ବୁକିଂ ଅନୁରୋଧ</span>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 bg-rose-600 text-white rounded-full text-[10px] font-black">
                {pendingCount} PENDING
              </span>
            )}
          </button>

          <button
            onClick={() => setSubTab('temple_settings')}
            className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 ${
              subTab === 'temple_settings'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-amber-200 hover:text-white'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>ମନ୍ଦିର ତଥ୍ୟ ସେଟିଂସ ({temples.length})</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {statusMsg && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm font-extrabold shadow-sm border ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-950 border-emerald-400'
              : 'bg-rose-50 text-rose-950 border-rose-400'
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* SUB-TAB 1: BOOKING REQUESTS APPROVAL */}
      {subTab === 'booking_requests' && (
        <div className="bg-white rounded-3xl border-2 border-amber-300 p-5 sm:p-6 shadow-md space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200 pb-4">
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
              <button
                onClick={() => setBookingFilter('pending')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  bookingFilter === 'pending'
                    ? 'bg-amber-700 text-white font-extrabold shadow-xs'
                    : 'bg-amber-100 text-amber-950 hover:bg-amber-200'
                }`}
              >
                ⏳ PENDING ({bookings.filter((b) => b.status === 'pending').length})
              </button>

              <button
                onClick={() => setBookingFilter('approved')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  bookingFilter === 'approved'
                    ? 'bg-emerald-700 text-white font-extrabold shadow-xs'
                    : 'bg-amber-100 text-amber-950 hover:bg-amber-200'
                }`}
              >
                ✓ APPROVED ({bookings.filter((b) => b.status === 'approved').length})
              </button>

              <button
                onClick={() => setBookingFilter('waiting_list')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  bookingFilter === 'waiting_list'
                    ? 'bg-purple-700 text-white font-extrabold shadow-xs'
                    : 'bg-amber-100 text-amber-950 hover:bg-amber-200'
                }`}
              >
                ⏳ WAITING ({bookings.filter((b) => b.status === 'waiting_list').length})
              </button>

              <button
                onClick={() => setBookingFilter('rescheduled')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  bookingFilter === 'rescheduled'
                    ? 'bg-indigo-700 text-white font-extrabold shadow-xs'
                    : 'bg-amber-100 text-amber-950 hover:bg-amber-200'
                }`}
              >
                📅 RESCHEDULED ({bookings.filter((b) => b.status === 'rescheduled').length})
              </button>

              <button
                onClick={() => setBookingFilter('cancelled')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  bookingFilter === 'cancelled'
                    ? 'bg-slate-700 text-white font-extrabold shadow-xs'
                    : 'bg-amber-100 text-amber-950 hover:bg-amber-200'
                }`}
              >
                🚫 CANCELLED ({bookings.filter((b) => b.status === 'cancelled').length})
              </button>

              <button
                onClick={() => setBookingFilter('rejected')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  bookingFilter === 'rejected'
                    ? 'bg-rose-700 text-white font-extrabold shadow-xs'
                    : 'bg-amber-100 text-amber-950 hover:bg-amber-200'
                }`}
              >
                ✕ REJECTED ({bookings.filter((b) => b.status === 'rejected').length})
              </button>

              <button
                onClick={() => setBookingFilter('all')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  bookingFilter === 'all'
                    ? 'bg-slate-900 text-white font-extrabold shadow-xs'
                    : 'bg-amber-100 text-amber-950 hover:bg-amber-200'
                }`}
              >
                ALL ({bookings.length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-amber-700 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="ଖୋଜନ୍ତୁ (Search name, ID, UTR)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-amber-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/50 font-medium"
              />
            </div>
          </div>

          {/* Bookings Table / Cards */}
          {filteredBookings.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs font-semibold bg-amber-50/50 rounded-2xl border border-dashed border-amber-200">
              କୌଣସି ବୁକିଂ ଅନୁରୋଧ ମିଳିଲା ନାହିଁ।
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBookings.map((b) => {
                const matchedTemple = temples.find((t) => t.id === b.templeId);
                return (
                  <div
                    key={b.id}
                    className={`p-4 rounded-2xl border-2 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                      b.status === 'approved'
                        ? 'bg-emerald-50/60 border-emerald-300'
                        : b.status === 'rescheduled'
                        ? 'bg-indigo-50/60 border-indigo-300'
                        : b.status === 'waiting_list'
                        ? 'bg-purple-50/60 border-purple-300'
                        : b.status === 'cancelled'
                        ? 'bg-slate-100 border-slate-300 opacity-80'
                        : b.status === 'rejected'
                        ? 'bg-rose-50/60 border-rose-300'
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
                            ✓ APPROVED
                          </span>
                        )}
                        {b.status === 'rescheduled' && (
                          <span className="px-2.5 py-0.5 bg-indigo-600 text-white font-extrabold rounded-full text-[10px]">
                            📅 RESCHEDULED
                          </span>
                        )}
                        {b.status === 'waiting_list' && (
                          <span className="px-2.5 py-0.5 bg-purple-600 text-white font-extrabold rounded-full text-[10px]">
                            ⏳ WAITING LIST
                          </span>
                        )}
                        {b.status === 'pending' && (
                          <span className="px-2.5 py-0.5 bg-amber-500 text-amber-950 font-extrabold rounded-full text-[10px]">
                            ⏳ PENDING VERIFICATION
                          </span>
                        )}
                        {b.status === 'cancelled' && (
                          <span className="px-2.5 py-0.5 bg-slate-600 text-white font-extrabold rounded-full text-[10px]">
                            🚫 CANCELLED
                          </span>
                        )}
                        {b.status === 'rejected' && (
                          <span className="px-2.5 py-0.5 bg-rose-600 text-white font-extrabold rounded-full text-[10px]">
                            ✕ REJECTED
                          </span>
                        )}
                      </div>

                      <div className="text-slate-800 font-semibold">
                        ଭକ୍ତ: <strong className="text-slate-950">{b.userName}</strong> ({b.userPhone}) • ଠିକଣା: {b.userAddress}
                      </div>

                      {b.gotraRasi && (
                        <div className="text-slate-700 font-medium">
                          ଗୋତ୍ର / ରାଶି: <span className="font-bold text-amber-950">{b.gotraRasi}</span>
                        </div>
                      )}

                      <div className="text-amber-950 font-bold bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-300 inline-block">
                        🪔 ପୂଜା ପ୍ରକାର (Puja Type): <strong className="font-extrabold text-amber-900">{b.bookingType || 'Jal Abhishek (ଜଳାଭିଷେକ)'}</strong>
                      </div>

                      <div className="text-slate-700 font-mono text-[11px] bg-white/80 p-1.5 rounded-lg border border-amber-200 inline-block">
                        UTR / REF: <strong className="text-slate-950 font-extrabold">{b.utrRef}</strong> • Platform Fee Paid: ₹5 (Verified)
                      </div>

                      {/* User Request Date Change Banner */}
                      {b.isRescheduleRequested && b.requestedRescheduleDate && (
                        <div className="p-2 bg-amber-100 border border-amber-400 rounded-xl text-amber-950 text-xs font-bold flex items-center justify-between gap-2">
                          <span>⚡ Devotee requested date change to: <strong>{b.requestedRescheduleDate}</strong></span>
                          <button
                            onClick={() => openAdminStatusModal(b, 'rescheduled')}
                            className="px-2.5 py-1 bg-indigo-700 text-white rounded-lg text-[10px] font-black cursor-pointer hover:bg-indigo-800 shrink-0"
                          >
                            Approve Date Change
                          </button>
                        </div>
                      )}

                      {(b.status === 'approved' || b.status === 'rescheduled') && b.pujaDateTime && (
                        <div className="text-emerald-900 font-bold bg-emerald-100/90 p-2 rounded-xl border border-emerald-300 flex items-center gap-1.5 text-xs">
                          <Calendar className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span>ନିର୍ଦ୍ଧାରିତ ପୂଜା/ଅଭିଷେକ ସମୟ: <strong>{b.pujaDateTime}</strong></span>
                        </div>
                      )}

                      {(b.adminReason || b.rejectionReason) && (
                        <div className="text-slate-800 text-[11px] font-medium bg-white/80 p-2 rounded-xl border border-slate-200">
                          📢 <strong>Reason/Remarks:</strong> {b.adminReason || b.rejectionReason}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        onClick={() => openAdminStatusModal(b, 'approved')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-xs transition flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>

                      <button
                        onClick={() => openAdminStatusModal(b, 'rescheduled')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition flex items-center gap-1 cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Reschedule</span>
                      </button>

                      <button
                        onClick={() => openAdminStatusModal(b, 'waiting_list')}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl text-xs transition flex items-center gap-1 cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Waiting List</span>
                      </button>

                      <button
                        onClick={() => openAdminStatusModal(b, 'cancelled')}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs transition flex items-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>

                      {(b.status === 'approved' || b.status === 'rescheduled') && (
                        <button
                          onClick={() => generateTempleReceiptJPG(b, matchedTemple)}
                          className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-black rounded-xl text-xs shadow-xs transition flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-amber-300" />
                          <span>JPG Receipt</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: DYNAMIC TEMPLE CMS & PUJA TYPE MANAGER */}
      {subTab === 'temple_settings' && (
        <div className="space-y-6">
          {/* SECTION A: PUJA TYPE MANAGER CARD */}
          <div className="bg-white rounded-3xl border-2 border-amber-400 p-5 shadow-md space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-amber-950 flex items-center gap-2">
                  <span>🪔</span>
                  <span>Manage Puja Types (ପୂଜା ନାମ ପରିଚାଳନା)</span>
                </h3>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  ନୂତନ ପୂଜା ନାମ ଯୋଡ଼ନ୍ତୁ, ସମ୍ପାଦନା (Edit) କରନ୍ତୁ କିମ୍ବା ଡିଲିଟ୍ କରନ୍ତୁ। ଏହି ତାଲିକା ୟୁଜରଙ୍କ ବୁକିଂ ଫର୍ମ ଡ୍ରପଡାଉନ୍‌ରେ ଦେଖାଯିବ।
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveAllPujaTypes}
                className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white font-extrabold rounded-xl text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Save className="w-4 h-4 text-amber-300" />
                <span>ସବୁ ସଂରକ୍ଷଣ କରନ୍ତୁ (Save All)</span>
              </button>
            </div>

            {/* Add New Puja Type Input */}
            <form onSubmit={handleAddPujaType} className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <input
                type="text"
                placeholder="ନୂତନ ପୂଜା ନାମ ଲେଖନ୍ତୁ (e.g. Rudrabhishek, Mangala Arati)..."
                value={newPujaTypeInput}
                onChange={(e) => setNewPujaTypeInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border-2 border-amber-300 text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/50"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-xl text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add (ଯୋଡ଼ନ୍ତୁ)</span>
              </button>
            </form>

            {/* List of Puja Types with Edit & Delete */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {pujaTypes.map((pt, idx) => {
                const isEditing = editingPujaIndex === idx;
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2.5 bg-amber-50/90 rounded-2xl border-2 border-amber-300 shadow-2xs"
                  >
                    <span className="font-mono text-[10px] text-amber-900 font-extrabold bg-amber-200 px-2 py-1 rounded-lg shrink-0">
                      #{idx + 1}
                    </span>

                    {isEditing ? (
                      <input
                        type="text"
                        value={editingPujaText}
                        onChange={(e) => setEditingPujaText(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded-xl border-2 border-amber-500 text-xs font-extrabold text-amber-950 bg-white focus:outline-none focus:ring-2 focus:ring-amber-600"
                        autoFocus
                      />
                    ) : (
                      <span className="flex-1 font-bold text-amber-950 text-xs truncate px-1" title={pt}>
                        {pt}
                      </span>
                    )}

                    <div className="flex items-center gap-1 shrink-0">
                      {isEditing ? (
                        <button
                          type="button"
                          onClick={() => handleSaveEditPuja(idx)}
                          className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Save</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStartEditPuja(idx, pt)}
                          className="px-2.5 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-950 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-800" />
                          <span>Edit</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeletePujaType(idx)}
                        title="Delete Puja Type"
                        className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-xl transition cursor-pointer flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* GLOBAL SOCIAL MEDIA THUMBNAIL SETTING */}
          <div className="p-5 bg-white border-2 border-amber-300 rounded-3xl space-y-3 shadow-sm">
            <label className="block font-black text-amber-950 text-xs sm:text-sm">
              🌐 ଗ୍ଲୋବାଲ୍ ସୋସିଆଲ୍ ମିଡିଆ ଥମ୍ବନେଲ୍ ଲିଙ୍କ୍ (Global Thumbnail URL)
            </label>
            <p className="text-[11px] text-amber-800 font-medium">
              ଏହି ଲିଙ୍କ୍ ଆପ୍ ଶେୟାର୍ (Homepage Share) କରିବା ସମୟରେ Facebook / WhatsApp / Telegram ରେ ପ୍ରଦର୍ଶିତ ହେବ।
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={globalThumbnail}
                onChange={(e) => handleGlobalThumbnailChange(e.target.value)}
                placeholder="https://... (Enter global social share thumbnail image URL)"
                className="flex-1 px-3.5 py-2.5 rounded-2xl border-2 border-amber-300 text-xs font-mono text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/50"
              />
              <button
                type="button"
                onClick={handleSaveGlobalThumbnail}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-2xl transition shadow-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
              >
                💾 ସେଭ୍ କରନ୍ତୁ (Save Thumbnail)
              </button>
            </div>
          </div>

          {/* RECEIPT HEADER CONFIGURATION SETTINGS */}
          <div className="p-5 bg-white border-2 border-amber-300 rounded-3xl space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200 pb-3">
              <div>
                <h3 className="font-black text-amber-950 text-sm sm:text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-700" />
                  <span>🧾 ରସିଦ୍ ହେଡର୍ ସମ୍ପାଦନା (Temple Puja Receipt Header Settings)</span>
                </h3>
                <p className="text-[11px] text-amber-800 font-medium mt-0.5">
                  ଏଠାରେ ଆପଣ ଅଫିସିଆଲ୍ ପୂଜା ରସିଦ୍ (Puja Receipt JPG) ର ହେଡର୍ ଟାଇଟଲ୍ ସିଧାସଳଖ ଏଡିଟ୍ କରି ସେଭ୍ କରିପାରିବେ।
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetReceiptHeader}
                className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                title="Reset to default sacred header"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Default</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-black text-amber-950">
                  🕉️ ଶୀର୍ଷ ପୋର୍ଟାଲ୍ ବ୍ୟାନର (Top Sacred Banner)
                </label>
                <input
                  type="text"
                  value={receiptHeader.topBanner}
                  onChange={(e) => setReceiptHeader({ ...receiptHeader, topBanner: e.target.value })}
                  placeholder="🕉️ ଓଡ଼ିଶା ଅଫିସିଆଲ ମନ୍ଦିର ପୂଜା ସେବା 🕉️"
                  className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-amber-300 text-xs font-bold text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/50"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-black text-amber-950">
                  📜 ରସିଦ୍ ମୁଖ୍ୟ ଶୀର୍ଷକ (Receipt Main Title - English)
                </label>
                <input
                  type="text"
                  value={receiptHeader.mainTitle}
                  onChange={(e) => setReceiptHeader({ ...receiptHeader, mainTitle: e.target.value })}
                  placeholder="TEMPLE PUJA & JAL ABHISHEK RECEIPT"
                  className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-amber-300 text-xs font-bold text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/50"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-black text-amber-950">
                  🚩 ରସିଦ୍ ଉପ-ଶୀର୍ଷକ (Receipt Subtitle / Tagline - Odia)
                </label>
                <input
                  type="text"
                  value={receiptHeader.subTitle}
                  onChange={(e) => setReceiptHeader({ ...receiptHeader, subTitle: e.target.value })}
                  placeholder="(ପୂଜା ଏବଂ ଜଳାଭିଷେକ ବୁକିଂ ସ୍ୱୀକୃତି ରସିଦ୍)"
                  className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-amber-300 text-xs font-bold text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/50"
                />
              </div>
            </div>

            {/* LIVE RECEIPT HEADER PREVIEW BOX */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-[10px] font-black text-amber-900 uppercase tracking-wider">
                👁️ ରସିଦ୍ ହେଡର୍ ଲାଇଭ୍ ପ୍ରିଭ୍ୟୁ (Live Receipt Header Preview):
              </label>
              <div className="p-4 rounded-2xl border-4 border-[#701A1E] bg-[#FFFDF7] text-center shadow-inner relative overflow-hidden">
                <div className="p-3 border-2 border-[#D97706] bg-[#FEF3C7] rounded-xl space-y-1">
                  <div className="text-sm sm:text-base font-serif font-black text-[#701A1E] tracking-wide">
                    {receiptHeader.topBanner.trim() || '🕉️ ଓଡ଼ିଶା ଅଫିସିଆଲ ମନ୍ଦିର ପୂଜା ସେବା 🕉️'}
                  </div>
                  <div className="text-xs sm:text-sm font-sans font-black text-[#92400E] tracking-wider uppercase">
                    {receiptHeader.mainTitle.trim() || 'TEMPLE PUJA & JAL ABHISHEK RECEIPT'}
                  </div>
                  <div className="text-[11px] sm:text-xs font-sans font-bold text-[#451A03]">
                    {receiptHeader.subTitle.trim() || '(ପୂଜା ଏବଂ ଜଳାଭିଷେକ ବୁକିଂ ସ୍ୱୀକୃତି ରସିଦ୍)'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleSaveReceiptHeader}
                disabled={isSavingReceiptHeader}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-white font-black text-xs rounded-2xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4 text-amber-300" />
                <span>{isSavingReceiptHeader ? 'ସେଭ୍ ହେଉଛି...' : '💾 ରସିଦ୍ ହେଡର୍ ସେଭ୍ କରନ୍ତୁ (Save Receipt Header)'}</span>
              </button>
            </div>
          </div>

          {/* SECTION B: UNLIMITED TEMPLES MANAGEMENT FORM */}
          <form onSubmit={handleSaveTemples} className="space-y-6">
          <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-3xl text-amber-950 text-xs font-bold flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-amber-700 shrink-0" />
              <span>
                ℹ️ ଏଠାରେ ଆପଣ ଅସୀମିତ (Unlimited) ମନ୍ଦିର ଯୋଡ଼ିପାରିବେ, ଇତିହାସ ଲେଖିପାରିବେ ଏବଂ ସମ୍ପାଦନା / ଡିଲିଟ୍ କରିପାରିବେ।
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddTemple}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-2xl text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ ନୂତନ ମନ୍ଦିର ଯୋଡ଼ନ୍ତୁ (Add Temple)</span>
              </button>

              <button
                type="submit"
                className="px-5 py-2 bg-amber-800 hover:bg-amber-900 text-white font-black rounded-2xl text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Save className="w-4 h-4 text-amber-300" />
                <span>ସଂରକ୍ଷଣ କରନ୍ତୁ (Save Changes)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {temples.map((temple, idx) => (
              <div
                key={temple.id || idx}
                className="bg-white rounded-3xl border-2 border-amber-300 p-5 shadow-md space-y-4 text-xs font-sans relative flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-amber-200 pb-2 gap-2">
                    <span className="font-extrabold text-amber-900 text-sm flex items-center gap-1.5">
                      <span>🏛️</span>
                      <span>ମନ୍ଦିର #{idx + 1}</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] bg-amber-100 text-amber-950 px-2 py-0.5 rounded-md font-bold">
                        ID: {temple.id}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteTemple(idx)}
                        title="Delete Temple"
                        className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Temple Image Preview & URL */}
                  <div className="space-y-1.5">
                    <label className="block font-bold text-amber-950">🖼️ ମନ୍ଦିର ଫଟୋ URL (Image URL)</label>
                    <div className="w-full aspect-square bg-amber-50 rounded-2xl overflow-hidden border-2 border-amber-300 mb-2 max-h-48">
                      {temple.imageUrl && temple.imageUrl.trim() ? (
                        <img
                          src={temple.imageUrl}
                          alt={temple.name || 'Temple'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1627894483216-2138af692e32?q=80&w=800&auto=format&fit=crop';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-amber-700/60 p-4 text-center">
                          <span className="text-3xl mb-1">🏛️</span>
                          <span className="text-[11px] font-bold">ଫଟୋ URL ଦିଅନ୍ତୁ (No Image Preview)</span>
                        </div>
                      )}
                    </div>
                    <input
                      type="url"
                      value={temple.imageUrl}
                      onChange={(e) => handleTempleChange(idx, 'imageUrl', e.target.value)}
                      placeholder="https://... (Enter main temple image URL)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/50"
                    />
                  </div>

                  {/* Thumbnail / Banner Image URL */}
                  <div className="space-y-1">
                    <label className="block font-bold text-amber-950">🏷️ ଫଟୋ ଥମ୍ବନେଲ୍ ଲିଙ୍କ୍ (Thumbnail Image URL)</label>
                    <input
                      type="url"
                      value={temple.thumbnailUrl || ''}
                      onChange={(e) => handleTempleChange(idx, 'thumbnailUrl', e.target.value)}
                      placeholder="https://... (Thumbnail image for social share preview)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/50"
                    />
                  </div>

                  {/* Temple Name */}
                  <div className="space-y-1">
                    <label className="block font-bold text-amber-950">🏛️ ମନ୍ଦିର ନାମ (Temple Name) *</label>
                    <input
                      type="text"
                      required
                      value={temple.name}
                      onChange={(e) => handleTempleChange(idx, 'name', e.target.value)}
                      placeholder="e.g. ଶ୍ରୀ ଲିଙ୍ଗରାଜ ମନ୍ଦିର (Shree Lingaraj Temple)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/50"
                    />
                  </div>

                  {/* Location Address */}
                  <div className="space-y-1">
                    <label className="block font-bold text-amber-950">📍 ଠିକଣା (Location Address) *</label>
                    <input
                      type="text"
                      required
                      value={temple.location}
                      onChange={(e) => handleTempleChange(idx, 'location', e.target.value)}
                      placeholder="e.g. ଏକାମ୍ର କ୍ଷେତ୍ର, ଭୁବନେଶ୍ୱର (Bhubaneswar, Odisha)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/50"
                    />
                  </div>

                  {/* Pujari Phone */}
                  <div className="space-y-1">
                    <label className="block font-bold text-amber-950">📞 ପୂଜାରୀ ମୋବାଇଲ୍ (Pujari Phone) *</label>
                    <input
                      type="tel"
                      required
                      value={temple.pujariPhone}
                      onChange={(e) => handleTempleChange(idx, 'pujariPhone', e.target.value)}
                      placeholder="e.g. 9861054321"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/50"
                    />
                  </div>

                  {/* Short Description */}
                  <div className="space-y-1">
                    <label className="block font-bold text-amber-950">📝 ସଂକ୍ଷିପ୍ତ ସୂଚନା (Short Subtitle)</label>
                    <input
                      type="text"
                      value={temple.description || ''}
                      onChange={(e) => handleTempleChange(idx, 'description', e.target.value)}
                      placeholder="e.g. ପବିତ୍ର ଜଳାଭିଷେକ ଓ ସ୍ୱତନ୍ତ୍ର ପୂଜା ସେବା।"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/50"
                    />
                  </div>

                  {/* Temple History / Description (ମନ୍ଦିର ଇତିହାସ) Field */}
                  <div className="space-y-1">
                    <label className="block font-black text-amber-950 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                      <span>📜 Temple History / Description (ମନ୍ଦିର ଇତିହାସ)</span>
                    </label>
                    <textarea
                      rows={4}
                      value={temple.history || ''}
                      onChange={(e) => handleTempleChange(idx, 'history', e.target.value)}
                      placeholder="ଏଠାରେ ମନ୍ଦିରର ଇତିହାସ, ସ୍ଥାପନା କାଳ, ପ୍ରସିଦ୍ଧି ଏବଂ ମାହାତ୍ମ୍ୟ ସମ୍ପର୍କରେ ସମ୍ପୂର୍ଣ୍ଣ ଲେଖନ୍ତୁ..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/50 font-medium leading-relaxed"
                    />
                  </div>

                  {/* QR Code Image URL */}
                  <div className="space-y-1">
                    <label className="block font-bold text-amber-950">💳 Paytm / UPI QR Code Image URL</label>
                    <input
                      type="url"
                      value={temple.qrCodeUrl || ''}
                      onChange={(e) => handleTempleChange(idx, 'qrCodeUrl', e.target.value)}
                      placeholder="https://... (Enter UPI payment QR code URL)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/50"
                    />
                  </div>

                  {/* Jal Abhishek / Custom Puja Label Toggle & Inline Editor */}
                  <div className="space-y-1.5 pt-2 border-t border-amber-200">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`jal-toggle-${idx}`}
                        checked={temple.isJalAbhishekAvailable !== false}
                        onChange={(e) => handleTempleChange(idx, 'isJalAbhishekAvailable', e.target.checked)}
                        className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500 cursor-pointer shrink-0"
                      />

                      {editingLabelTempleIdx === idx ? (
                        <div className="flex-1 flex items-center gap-1.5 min-w-0">
                          <input
                            type="text"
                            value={editingLabelText}
                            onChange={(e) => setEditingLabelText(e.target.value)}
                            placeholder="e.g. Tulasi Lagi Available"
                            className="flex-1 px-2.5 py-1 rounded-xl border-2 border-amber-500 text-xs font-bold text-amber-950 bg-white focus:outline-none focus:ring-2 focus:ring-amber-600"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEditTempleLabel(idx)}
                            className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1 shrink-0 shadow-2xs"
                            title="Save Label"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>💾</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-between gap-1 min-w-0">
                          <label htmlFor={`jal-toggle-${idx}`} className="font-extrabold text-amber-950 cursor-pointer text-xs truncate" title={temple.customPujaLabel || '🌊 ଜଳାଭିଷେକ ବୁକିଂ ଉପଲବ୍ଧ (Jal Abhishek Available)'}>
                            {temple.customPujaLabel || '🌊 ଜଳାଭିଷେକ ବୁକିଂ ଉପଲବ୍ଧ (Jal Abhishek Available)'}
                          </label>
                          <button
                            type="button"
                            onClick={() => handleStartEditTempleLabel(idx, temple.customPujaLabel)}
                            className="px-2 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 rounded-xl text-xs font-extrabold transition cursor-pointer shrink-0 flex items-center gap-1"
                            title="Edit Label"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-800" />
                            <span>✏️ Edit</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-amber-200 mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveSingleTemple(idx)}
                    className="py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  >
                    <Save className="w-3.5 h-3.5 text-emerald-200" />
                    <span>💾 ସେଭ୍ କରନ୍ତୁ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTemple(idx)}
                    className="py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ଡିଲିଟ୍</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-amber-300">
            <button
              type="button"
              onClick={handleAddTemple}
              className="px-5 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-2xl text-xs shadow-lg transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ ଅନ୍ୟ ଏକ ନୂତନ ମନ୍ଦିର ଯୋଡ଼ନ୍ତୁ (Add Another Temple)</span>
            </button>

            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-white font-extrabold rounded-2xl text-xs shadow-lg transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>💾 ସମସ୍ତ ମନ୍ଦିର ତଥ୍ୟ ସଂରକ୍ଷଣ କରନ୍ତୁ (Save All Temples)</span>
            </button>
          </div>
        </form>
      </div>
      )}

      {/* ADMIN STATUS CHANGE & REASON MODAL */}
      {editingBooking && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl border-2 border-amber-500 shadow-2xl p-5 sm:p-6 w-full max-w-lg space-y-4 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-amber-200 pb-3">
              <h3 className="text-base font-black text-amber-950 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <span>ବୁକିଂ ସ୍ଥିତି ପରିବର୍ତ୍ତନ (Manage Booking #{editingBooking.id})</span>
              </h3>
              <button
                onClick={() => setEditingBooking(null)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmAdminStatusUpdate} className="space-y-4 text-xs font-sans">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 space-y-1">
                <div className="font-extrabold text-amber-950">
                  ଭକ୍ତ: {editingBooking.userName} ({editingBooking.userPhone})
                </div>
                <div className="text-slate-600">
                  ମନ୍ଦିର: <strong>{editingBooking.templeName}</strong> • UTR: <span className="font-mono">{editingBooking.utrRef}</span>
                </div>
                {editingBooking.isRescheduleRequested && editingBooking.requestedRescheduleDate && (
                  <div className="text-indigo-900 font-extrabold bg-indigo-100/80 p-1.5 rounded-lg border border-indigo-200 mt-1">
                    ⚡ Devotee requested date: {editingBooking.requestedRescheduleDate}
                  </div>
                )}
              </div>

              {/* Status Selector */}
              <div>
                <label className="block font-black text-slate-900 mb-1.5">
                  ନୂତନ ସ୍ଥିତି ଚୟନ କରନ୍ତୁ (Select Action / Status) *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetStatus('approved')}
                    className={`py-2 px-2.5 rounded-xl border font-black transition text-[11px] cursor-pointer flex items-center justify-center gap-1 ${
                      targetStatus === 'approved'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                        : 'bg-emerald-50 text-emerald-950 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Approve</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetStatus('rescheduled')}
                    className={`py-2 px-2.5 rounded-xl border font-black transition text-[11px] cursor-pointer flex items-center justify-center gap-1 ${
                      targetStatus === 'rescheduled'
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                        : 'bg-indigo-50 text-indigo-950 border-indigo-200 hover:bg-indigo-100'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>Reschedule</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetStatus('waiting_list')}
                    className={`py-2 px-2.5 rounded-xl border font-black transition text-[11px] cursor-pointer flex items-center justify-center gap-1 ${
                      targetStatus === 'waiting_list'
                        ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                        : 'bg-purple-50 text-purple-950 border-purple-200 hover:bg-purple-100'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>Waiting List</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetStatus('cancelled')}
                    className={`py-2 px-2.5 rounded-xl border font-black transition text-[11px] cursor-pointer flex items-center justify-center gap-1 ${
                      targetStatus === 'cancelled'
                        ? 'bg-slate-700 text-white border-slate-800 shadow-xs'
                        : 'bg-slate-100 text-slate-900 border-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Cancel</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetStatus('rejected')}
                    className={`py-2 px-2.5 rounded-xl border font-black transition text-[11px] cursor-pointer flex items-center justify-center gap-1 ${
                      targetStatus === 'rejected'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                        : 'bg-rose-50 text-rose-950 border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>

              {/* Date & Time Input (For Approved / Rescheduled) */}
              {(targetStatus === 'approved' || targetStatus === 'rescheduled') && (
                <div>
                  <label className="block text-xs font-extrabold text-amber-950 mb-1">
                    ପୂଜା / ଜଳାଭିଷେକ ତାରିଖ ଓ ସମୟ (Assign Date & Time) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., 18-Aug-2026, 08:30 AM"
                    value={adminPujaDateTimeInput}
                    onChange={(e) => setAdminPujaDateTimeInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-amber-400 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/30"
                  />
                </div>
              )}

              {/* Mandatory Reason Input */}
              <div>
                <label className="block text-xs font-extrabold text-slate-900 mb-1">
                  କାରଣ / ସ୍ପଷ୍ଟୀକରଣ (Mandatory Reason / Remarks) *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder={
                    targetStatus === 'rescheduled'
                      ? 'e.g., Pujari is unwell / Date change requested by user accepted'
                      : targetStatus === 'waiting_list'
                      ? 'e.g., Heavy temple crowd, placed in evening slot waiting list'
                      : targetStatus === 'cancelled'
                      ? 'e.g., Cancelled on devotee request or temple maintenance'
                      : 'e.g., Payment verified, slot assigned successfully'
                  }
                  value={adminReasonInput}
                  onChange={(e) => setAdminReasonInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-amber-400 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/20"
                />
                <p className="text-[10px] text-slate-500 mt-1 font-medium">
                  ⚡ ଏହି କାରଣଟି ଭକ୍ତଙ୍କୁ ନୋଟିଫିକେସନ୍‌ ଓ Receipts ମାଧ୍ୟମରେ ଦେଖାଯିବ।
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBooking(null)}
                  className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold rounded-xl text-xs cursor-pointer"
                >
                  ବାତିଲ୍ (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdminAction}
                  className="flex-1 py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-extrabold rounded-xl text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmittingAdminAction ? 'Updating...' : 'Save & Notify User'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
