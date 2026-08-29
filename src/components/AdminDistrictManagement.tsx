import React, { useState, useEffect } from 'react';
import { DistrictItem, DistrictCategory, ODISHA_DISTRICTS, OdishaDistrictInfo } from '../types';
import {
  getDistrictItems,
  saveDistrictItem,
  deleteDistrictItem,
  subscribeDistrictItems,
} from '../lib/districtApi';
import {
  MapPin,
  Plus,
  Trash2,
  Edit3,
  Save,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  Image as ImageIcon,
  Sparkles,
  Calendar,
  BookOpen,
  Filter,
} from 'lucide-react';
import { S3PhotoUploader } from './S3PhotoUploader';

export const AdminDistrictManagement: React.FC = () => {
  const [items, setItems] = useState<DistrictItem[]>([]);
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form / Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<DistrictItem> | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const unsub = subscribeDistrictItems((data) => {
      setItems(data);
    });
    return () => unsub();
  }, []);

  const handleOpenAddModal = (districtId?: string) => {
    const defaultDistrict = districtId && districtId !== 'all'
      ? ODISHA_DISTRICTS.find((d) => d.id === districtId) || ODISHA_DISTRICTS[0]
      : ODISHA_DISTRICTS[0];

    setEditingItem({
      id: '',
      districtId: defaultDistrict.id,
      districtNameOdia: defaultDistrict.nameOdia,
      districtNameEng: defaultDistrict.nameEng,
      category: 'temple',
      title: '',
      description: '',
      imageUrl: '',
      location: '',
      significance: '',
      famousFestivals: '',
      bestTimeToVisit: '',
      externalLink: '',
      affiliateProductTitle: '',
      affiliateProductImageUrl: '',
      affiliateTargetUrl: '',
      adTriggerText: '',
      adTimerSeconds: 5,
      affiliateAd: {
        enabled: true,
        productTitle: '',
        productImageUrl: '',
        affiliateUrl: '',
        adTriggerText: '',
        adTimerSeconds: 5,
      },
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: DistrictItem) => {
    const affiliateProductTitle = item.adTitle || item.affiliateProductTitle || item.affiliateAd?.productTitle || '';
    const affiliateProductImageUrl = item.adImageUrl || item.affiliateProductImageUrl || item.affiliateAd?.productImageUrl || '';
    const affiliateTargetUrl = item.adLink || item.affiliateTargetUrl || item.affiliateAd?.affiliateUrl || '';
    const adTriggerText = item.adTriggerText || item.affiliateAd?.adTriggerText || '';
    const adTimerSeconds = Number(item.adTimerSeconds) || Number(item.affiliateAd?.adTimerSeconds) || Number(item.affiliateAd?.countdownSeconds) || 5;

    setEditingItem({
      ...item,
      affiliateProductTitle,
      affiliateProductImageUrl,
      affiliateTargetUrl,
      adTriggerText,
      adTimerSeconds,
      affiliateAd: item.affiliateAd || {
        enabled: true,
        productTitle: affiliateProductTitle,
        productImageUrl: affiliateProductImageUrl,
        affiliateUrl: affiliateTargetUrl,
        adTriggerText,
        adTimerSeconds,
      },
    });
    setIsModalOpen(true);
  };

  const handleDistrictChange = (districtId: string) => {
    const districtObj = ODISHA_DISTRICTS.find((d) => d.id === districtId);
    if (districtObj) {
      setEditingItem((prev) => ({
        ...prev,
        districtId: districtObj.id,
        districtNameOdia: districtObj.nameOdia,
        districtNameEng: districtObj.nameEng,
      }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.title?.trim() || !editingItem.description?.trim()) {
      alert('ଦୟାକରି ଶୀର୍ଷକ ଏବଂ ବିବରଣୀ ପ୍ରଦାନ କରନ୍ତୁ। (Please provide title & description)');
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      await saveDistrictItem(editingItem);
      setMessage({
        text: '✅ ଜିଲ୍ଲା ସୂଚନା ସଫଳତାର ସହ ସଂରକ୍ଷଣ ହେଲା (District content saved successfully)!',
        type: 'success',
      });
      setIsModalOpen(false);
      setEditingItem(null);
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setMessage({
        text: '❌ ସଂରକ୍ଷଣରେ ତ୍ରୁଟି: ' + (err?.message || 'ଅଜ୍ଞାତ ତ୍ରୁଟି'),
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemId: string, title: string) => {
    if (!window.confirm(`ଆପଣ ନିଶ୍ଚିତ କି "${title}" କୁ ଡିଲିଟ୍ କରିବାକୁ ଚାହାନ୍ତି? (Confirm delete)`)) {
      return;
    }

    try {
      await deleteDistrictItem(itemId);
      setMessage({
        text: '🗑️ ସଫଳତାର ସହ ଡିଲିଟ୍ ହେଲା (Item deleted successfully)!',
        type: 'success',
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      alert('ଡିଲିଟ୍ କରିବାରେ ତ୍ରୁଟି: ' + err?.message);
    }
  };

  // Filter Items
  const filteredItems = items.filter((item) => {
    if (selectedDistrictFilter !== 'all' && item.districtId !== selectedDistrictFilter) {
      return false;
    }
    if (selectedCategoryFilter !== 'all' && item.category !== selectedCategoryFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      const matchLoc = item.location?.toLowerCase().includes(q);
      const matchDist = item.districtNameOdia?.toLowerCase().includes(q) || item.districtNameEng?.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchLoc || matchDist;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-amber-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🗺️</span>
            <h2 className="text-lg sm:text-xl font-black text-amber-950">
              District Content Manager (ଓଡ଼ିଶା ଜିଲ୍ଲା ସୂଚନା ପରିଚାଳକ)
            </h2>
          </div>
          <p className="text-xs text-amber-900/80 font-medium mt-1">
            ଓଡ଼ିଶାର ସମସ୍ତ ୩୦ଟି ଜିଲ୍ଲାର ପ୍ରସିଦ୍ଧ ମନ୍ଦିର, ପର୍ବପର୍ବାଣୀ ଏବଂ ଆଧ୍ୟାତ୍ମିକ କଥା ଏଠାରୁ ନିୟନ୍ତ୍ରଣ କରନ୍ତୁ।
          </p>
        </div>

        <button
          onClick={() => handleOpenAddModal(selectedDistrictFilter)}
          className="px-4 py-2.5 bg-gradient-to-r from-[#701a1e] to-[#8B0000] hover:from-[#8B0000] hover:to-[#a00000] text-amber-100 hover:text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition active:scale-95 shrink-0 border border-amber-400/50"
        >
          <Plus className="w-4 h-4" />
          <span>+ ନୂତନ ତଥ୍ୟ ଯୋଡ଼ନ୍ତୁ (Add Content)</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {message && (
        <div
          className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
              : 'bg-rose-50 text-rose-900 border border-rose-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* District Quick Filters */}
      <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ଜିଲ୍ଲା, ମନ୍ଦିର ବା ପର୍ବ ଖୋଜନ୍ତୁ (Search by temple, festival or keyword)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/40"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-bold text-gray-500 shrink-0">ବିଭାଗ:</span>
            {[
              { id: 'all', label: 'ସମସ୍ତ (All)' },
              { id: 'temple', label: '🛕 ମନ୍ଦିର (Temples)' },
              { id: 'festival', label: '🎉 ପର୍ବ (Festivals)' },
              { id: 'story', label: '📖 କଥା (Stories)' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedCategoryFilter === cat.id
                    ? 'bg-amber-800 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-950 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* District Selector Pills Horizontal Scroll */}
        <div className="pt-2 border-t border-amber-100">
          <div className="text-[11px] font-bold text-gray-500 mb-1.5 flex items-center justify-between">
            <span>ଜିଲ୍ଲା ବାଛନ୍ତୁ (Filter by 30 Odisha Districts):</span>
            <span className="text-amber-900 font-mono">
              ମୋଟ ଏଣ୍ଟ୍ରି: {items.length} | ଦେଖାଯାଉଛି: {filteredItems.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
            <button
              onClick={() => setSelectedDistrictFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
                selectedDistrictFilter === 'all'
                  ? 'bg-[#8B0000] text-amber-100 shadow-xs'
                  : 'bg-white hover:bg-amber-50 text-slate-800 border border-slate-200'
              }`}
            >
              🚩 ସମସ୍ତ ୩୦ ଜିଲ୍ଲା (All)
            </button>

            {ODISHA_DISTRICTS.map((dist) => {
              const count = items.filter((i) => i.districtId === dist.id).length;
              return (
                <button
                  key={dist.id}
                  onClick={() => setSelectedDistrictFilter(dist.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer flex items-center gap-1.5 ${
                    selectedDistrictFilter === dist.id
                      ? 'bg-[#8B0000] text-amber-100 shadow-xs'
                      : 'bg-white hover:bg-amber-50 text-slate-800 border border-slate-200'
                  }`}
                >
                  <span>{dist.icon}</span>
                  <span>{dist.nameOdia}</span>
                  {count > 0 && (
                    <span className="px-1.5 py-0.2 bg-amber-300 text-amber-950 rounded-full text-[10px] font-black">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Items List / Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-amber-200 p-8 text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-3xl">
            🗺️
          </div>
          <h3 className="text-base font-black text-amber-950">
            କୌଣସି ତଥ୍ୟ ମିଳିଲା ନାହିଁ (No District Content Found)
          </h3>
          <p className="text-xs text-amber-900/80 max-w-md mx-auto">
            ଏହି ଫିଲ୍ଟର୍ ପାଇଁ କୌଣସି ଏଣ୍ଟ୍ରି ନାହିଁ। ଆପଣ ନୂତନ ମନ୍ଦିର, ପର୍ବ ବା ଆଧ୍ୟାତ୍ମିକ ତଥ୍ୟ ଯୋଡ଼ିବାକୁ '+ ନୂତନ ତଥ୍ୟ ଯୋଡ଼ନ୍ତୁ' ଉପରେ କ୍ଲିକ୍ କରନ୍ତୁ।
          </p>
          <button
            onClick={() => handleOpenAddModal(selectedDistrictFilter)}
            className="px-4 py-2 bg-[#8B0000] hover:bg-[#a00000] text-amber-100 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            + ଏହି ଜିଲ୍ଲାରେ ଯୋଡ଼ନ୍ତୁ (Add to this District)
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const districtObj = ODISHA_DISTRICTS.find((d) => d.id === item.districtId);
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-amber-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                {/* Card Top: Image & Badges */}
                <div>
                  {item.imageUrl ? (
                    <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 bg-black/70 backdrop-blur-xs text-white rounded-md text-[10px] font-black">
                          {districtObj?.icon} {item.districtNameOdia || districtObj?.nameOdia}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black text-white ${
                            item.category === 'temple'
                              ? 'bg-amber-600'
                              : item.category === 'festival'
                              ? 'bg-rose-600'
                              : 'bg-purple-600'
                          }`}
                        >
                          {item.category === 'temple'
                            ? '🛕 ମନ୍ଦିର'
                            : item.category === 'festival'
                            ? '🎉 ପର୍ବପର୍ବାଣୀ'
                            : '📖 ଆଧ୍ୟାତ୍ମିକ କଥା'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gradient-to-r from-amber-50 to-amber-100 border-b border-amber-200 flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-amber-800 text-white rounded-md text-[10px] font-black">
                        {districtObj?.icon} {item.districtNameOdia || districtObj?.nameOdia}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black text-white ${
                          item.category === 'temple'
                            ? 'bg-amber-600'
                            : item.category === 'festival'
                            ? 'bg-rose-600'
                            : 'bg-purple-600'
                        }`}
                      >
                        {item.category === 'temple'
                          ? '🛕 ମନ୍ଦିର'
                          : item.category === 'festival'
                          ? '🎉 ପର୍ବ'
                          : '📖 କଥା'}
                      </span>
                    </div>
                  )}

                  {/* Card Body */}
                  <div className="p-4 space-y-2">
                    <h4 className="font-black text-slate-900 text-sm leading-snug">
                      {item.title}
                    </h4>

                    {item.location && (
                      <div className="flex items-center gap-1 text-[11px] text-amber-900 font-bold">
                        <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </div>
                    )}

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {item.description}
                    </p>

                    {item.famousFestivals && (
                      <div className="text-[11px] text-amber-900/90 font-medium bg-amber-50/70 p-2 rounded-xl border border-amber-200/50">
                        <span className="font-bold">✨ ପ୍ରମୁଖ ପର୍ବ: </span>
                        <span>{item.famousFestivals}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-3 bg-amber-50/40 border-t border-amber-100 flex items-center justify-between">
                  <div className="text-[10px] text-gray-500">
                    {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('en-IN') : ''}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold rounded-lg text-xs flex items-center gap-1 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.title)}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-xs flex items-center gap-1 transition cursor-pointer border border-rose-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ADD / EDIT MODAL                                               */}
      {/* ------------------------------------------------------------- */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border-2 border-amber-400 relative space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-amber-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {editingItem.id ? '✏️' : '➕'}
                </span>
                <h3 className="text-base sm:text-lg font-black text-amber-950">
                  {editingItem.id ? 'ଜିଲ୍ଲା ସୂଚନା ସମ୍ପାଦନା (Edit District Content)' : 'ନୂତନ ଜିଲ୍ଲା ସୂଚନା ଯୋଡ଼ନ୍ତୁ (Add District Content)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingItem(null);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. District Selection */}
                <div>
                  <label className="block font-bold text-amber-950 mb-1">
                    ଓଡ଼ିଶା ଜିଲ୍ଲା ବାଛନ୍ତୁ (Select District) *
                  </label>
                  <select
                    value={editingItem.districtId || 'puri'}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    className="w-full p-2.5 text-xs font-bold border border-amber-300 rounded-xl bg-amber-50/50 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    required
                  >
                    {ODISHA_DISTRICTS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.icon} {d.nameOdia} ({d.nameEng}) - {d.tagline}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Category Selection */}
                <div>
                  <label className="block font-bold text-amber-950 mb-1">
                    ବିଭାଗ ବାଛନ୍ତୁ (Category) *
                  </label>
                  <select
                    value={editingItem.category || 'temple'}
                    onChange={(e) =>
                      setEditingItem((prev) => ({
                        ...prev,
                        category: e.target.value as DistrictCategory,
                      }))
                    }
                    className="w-full p-2.5 text-xs font-bold border border-amber-300 rounded-xl bg-amber-50/50 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    required
                  >
                    <option value="temple">🛕 ପ୍ରସିଦ୍ଧ ମନ୍ଦିର (Famous Temple)</option>
                    <option value="festival">🎉 ପର୍ବପର୍ବାଣୀ ଓ ମେଳା (Festival & Fair)</option>
                    <option value="story">📖 ଆଧ୍ୟାତ୍ମିକ ଇତିହାସ ଓ କଥା (Spiritual Story & History)</option>
                  </select>
                </div>
              </div>

              {/* 3. Title */}
              <div>
                <label className="block font-bold text-amber-950 mb-1">
                  ଶୀର୍ଷକ / ମନ୍ଦିର / ପର୍ବର ନାମ (Title in Odia / English) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. ଶ୍ରୀ ଜଗନ୍ନାଥ ମନ୍ଦିର / ମା’ ତାରାତାରିଣୀ ପୀଠ / ରଥଯାତ୍ରା"
                  value={editingItem.title || ''}
                  onChange={(e) =>
                    setEditingItem((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full p-2.5 text-xs font-bold border border-amber-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>

              {/* 4. Location / Spot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-amber-950 mb-1">
                    ସ୍ଥାନ / ଠିକଣା (Location / Landmark)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ବଡ଼ଦାଣ୍ଡ, ପୁରୀ / ଋଷିକୁଲ୍ୟା ତଟ, ପୁରୁଷୋତ୍ତମପୁର"
                    value={editingItem.location || ''}
                    onChange={(e) =>
                      setEditingItem((prev) => ({ ...prev, location: e.target.value }))
                    }
                    className="w-full p-2.5 text-xs border border-amber-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-amber-950 mb-1">
                    ପରିଦର୍ଶନର ଶ୍ରେଷ୍ଠ ସମୟ (Best Time to Visit)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ଅକ୍ଟୋବର ରୁ ମାର୍ଚ୍ଚ / ଚୈତ୍ର ମାସ ମଙ୍ଗଳବାର"
                    value={editingItem.bestTimeToVisit || ''}
                    onChange={(e) =>
                      setEditingItem((prev) => ({
                        ...prev,
                        bestTimeToVisit: e.target.value,
                      }))
                    }
                    className="w-full p-2.5 text-xs border border-amber-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* 5. Image Upload (AWS S3 bhakti-ananda-photos) */}
              <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200">
                <S3PhotoUploader
                  value={editingItem.imageUrl || ''}
                  onChange={(url) => setEditingItem((prev) => ({ ...prev, imageUrl: url }))}
                  folder="district"
                  label="ଛବି / ଫଟୋ (District Place Photo / S3 Storage)"
                  placeholder="https://... or select photo from device"
                />
              </div>

              {/* 6. Description / History */}
              <div>
                <label className="block font-bold text-amber-950 mb-1">
                  ବିସ୍ତୃତ ବିବରଣୀ ଓ ଐତିହାସିକ ମହତ୍ତ୍ୱ (Description / History) *
                </label>
                <textarea
                  rows={4}
                  placeholder="ମନ୍ଦିରର ଇତିହାସ, ପ୍ରତିଷ୍ଠା, କିମ୍ବଦନ୍ତୀ, ପୂଜା ପଦ୍ଧତି ଏବଂ ମୁଖ୍ୟ ଆକର୍ଷଣ ବିଷୟରେ ଲେଖନ୍ତୁ..."
                  value={editingItem.description || ''}
                  onChange={(e) =>
                    setEditingItem((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full p-3 text-xs leading-relaxed border border-amber-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>

              {/* 7. Key Festivals & Spiritual Significance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-amber-950 mb-1">
                    ପ୍ରମୁଖ ପର୍ବପର୍ବାଣୀ (Famous Festivals)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ରଥଯାତ୍ରା, ଚନ୍ଦନ ଯାତ୍ରା, ସ୍ନାନ ଯାତ୍ରା"
                    value={editingItem.famousFestivals || ''}
                    onChange={(e) =>
                      setEditingItem((prev) => ({
                        ...prev,
                        famousFestivals: e.target.value,
                      }))
                    }
                    className="w-full p-2.5 text-xs border border-amber-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-amber-950 mb-1">
                    ବାହ୍ୟ ଲିଙ୍କ୍ (Map / Video / Info Link)
                  </label>
                  <input
                    type="url"
                    placeholder="https://maps.google.com/..."
                    value={editingItem.externalLink || ''}
                    onChange={(e) =>
                      setEditingItem((prev) => ({
                        ...prev,
                        externalLink: e.target.value,
                      }))
                    }
                    className="w-full p-2.5 text-xs border border-amber-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* 8. Monetization & Affiliate Ad Section */}
              <div className="p-3.5 sm:p-4 bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-amber-50/80 rounded-2xl border-2 border-dashed border-amber-300 space-y-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-amber-200">
                  <div className="flex items-center gap-2">
                    <span className="text-base">💰</span>
                    <span className="font-black text-xs text-amber-950">
                      ମନିଟାଇଜେସନ୍ / ଆଫିଲିଏଟ୍ ବିଜ୍ଞାପନ (Monetization & Affiliate Product Ad)
                    </span>
                  </div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-amber-950 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingItem.affiliateAd?.enabled !== false && Boolean(editingItem.affiliateProductImageUrl || editingItem.affiliateAd?.productImageUrl || editingItem.affiliateTargetUrl || editingItem.affiliateAd?.affiliateUrl)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setEditingItem((prev) => ({
                          ...prev,
                          affiliateAd: {
                            ...(prev?.affiliateAd || {}),
                            enabled: checked,
                          },
                        }));
                      }}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>Active (ସକ୍ରିୟ)</span>
                  </label>
                </div>

                {/* 1. Affiliate Product Title */}
                <div className="space-y-1">
                  <label className="block font-bold text-amber-950 text-xs">
                    📦 ପ୍ରଡକ୍ଟ ଶୀର୍ଷକ (Affiliate Product Title)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ଶ୍ରୀ ଜଗନ୍ନାଥ କାଷ୍ଠ ମୂର୍ତ୍ତି / ସମ୍ପୂର୍ଣ୍ଣ ଓଡ଼ିଆ ଭାଗବତ ସେଟ୍ / ପିତ୍ତଳ ଦୀପ"
                    value={editingItem.affiliateProductTitle || editingItem.affiliateAd?.productTitle || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingItem((prev) => ({
                        ...prev,
                        affiliateProductTitle: val,
                        affiliateAd: {
                          ...(prev?.affiliateAd || {}),
                          enabled: true,
                          productTitle: val,
                        },
                      }));
                    }}
                    className="w-full p-2.5 text-xs font-bold border border-amber-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                {/* 2. Affiliate Image URL & 3. Affiliate Target URL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <S3PhotoUploader
                      value={editingItem.affiliateProductImageUrl || editingItem.affiliateAd?.productImageUrl || ''}
                      onChange={(url) => {
                        setEditingItem((prev) => ({
                          ...prev,
                          affiliateProductImageUrl: url,
                          affiliateAd: {
                            ...(prev?.affiliateAd || {}),
                            enabled: true,
                            productImageUrl: url,
                          },
                        }));
                      }}
                      folder="district"
                      label="🖼️ ଆଫିଲିଏଟ୍ ଫଟୋ (Affiliate Image)"
                      placeholder="https://... or upload photo"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold text-amber-950 text-xs">
                      🔗 ଆଫିଲିଏଟ୍ ଲିଙ୍କ୍ (Affiliate Buy Link) *
                    </label>
                    <input
                      type="url"
                      placeholder="https://www.amazon.in/dp/...?tag=yourtag-21"
                      value={editingItem.affiliateTargetUrl || editingItem.affiliateAd?.affiliateUrl || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditingItem((prev) => ({
                          ...prev,
                          affiliateTargetUrl: val,
                          affiliateAd: {
                            ...(prev?.affiliateAd || {}),
                            enabled: true,
                            affiliateUrl: val,
                          },
                        }));
                      }}
                      className="w-full p-2.5 text-xs font-mono border border-amber-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Trigger Word & Countdown Timer Duration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="block font-bold text-amber-950 text-xs">
                      🎯 ଶବ୍ଦ ଟ୍ରିଗର୍ / କୀ-ୱାର୍ଡ଼ (Word Trigger in Description)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ଜଗନ୍ନାଥ, ପ୍ରସାଦ, ପୂଜା, ରଥଯାତ୍ରା (Optional)"
                      value={editingItem.adTriggerText || editingItem.affiliateAd?.adTriggerText || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditingItem((prev) => ({
                          ...prev,
                          adTriggerText: val,
                          affiliateAd: {
                            ...(prev?.affiliateAd || {}),
                            adTriggerText: val,
                          },
                        }));
                      }}
                      className="w-full p-2.5 text-xs font-bold border border-amber-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-amber-800">
                      ଯେତେବେଳେ ପାଠକ ଏହି ଶବ୍ଦ ପାଖକୁ ସ୍କ୍ରୋଲ୍ କରିବେ, ବିଜ୍ଞାପନ ଟ୍ରିଗର୍ ହେବ (IntersectionObserver)।
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold text-amber-950 text-xs">
                      ⏱️ କାଉଣ୍ଟଡାଉନ୍ ଟାଇମର୍ ସେକେଣ୍ଡ (adTimerSeconds: 5s Default)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={editingItem.adTimerSeconds || editingItem.affiliateAd?.adTimerSeconds || editingItem.affiliateAd?.countdownSeconds || 5}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 5;
                        setEditingItem((prev) => ({
                          ...prev,
                          adTimerSeconds: val,
                          affiliateAd: {
                            ...(prev?.affiliateAd || {}),
                            adTimerSeconds: val,
                            countdownSeconds: val,
                          },
                        }));
                      }}
                      className="w-full p-2.5 text-xs border border-amber-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                    />
                    <p className="text-[10px] text-amber-800">
                      ବିଜ୍ଞାପନ ପପ୍-ଅପ୍ ଆପେ ଆପେ ବନ୍ଦ ହେବା ପାଇଁ ସମୟ।
                    </p>
                  </div>
                </div>

                {/* Optional Offer Note */}
                <div className="space-y-1 pt-1">
                  <label className="block font-bold text-amber-950 text-xs">
                    📝 ସଂକ୍ଷିପ୍ତ ଅଫର ବିବରଣୀ (Short Offer Note)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 100% Original & Fast Delivery Available"
                    value={editingItem.adDescription || editingItem.affiliateAd?.productDescription || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingItem((prev) => ({
                        ...prev,
                        adDescription: val,
                        affiliateAd: {
                          ...(prev?.affiliateAd || {}),
                          productDescription: val,
                        },
                      }));
                    }}
                    className="w-full p-2.5 text-xs border border-amber-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Cancel (ବାତିଲ୍)
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-gradient-to-r from-[#701a1e] to-[#8B0000] hover:from-[#8B0000] hover:to-[#a00000] text-amber-200 hover:text-white font-extrabold rounded-xl text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'ସଂରକ୍ଷଣ ହେଉଛି...' : 'Save & Publish (ପ୍ରକାଶ କରନ୍ତୁ)'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
