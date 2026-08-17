import React, { useState, useEffect } from 'react';
import { DailyPanchang, SpiritualStory } from '../types';
import {
  getDailyPanchang,
  saveDailyPanchang,
  subscribeDailyPanchang,
  getSpiritualStories,
  saveSpiritualStory,
  deleteSpiritualStory,
  subscribeSpiritualStories,
  DEFAULT_PANCHANG,
  DEFAULT_STORIES,
} from '../lib/contentApi';
import {
  Calendar,
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Sun,
  Moon,
  Clock,
  Image,
  RefreshCw,
} from 'lucide-react';

export const AdminContent: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'panchang' | 'stories'>('panchang');

  // Panchang State
  const [panchangForm, setPanchangForm] = useState<DailyPanchang>(DEFAULT_PANCHANG);
  const [savingPanchang, setSavingPanchang] = useState(false);
  const [panchangMsg, setPanchangMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Stories State
  const [stories, setStories] = useState<SpiritualStory[]>([]);
  const [editingStory, setEditingStory] = useState<Partial<SpiritualStory> | null>(null);
  const [savingStory, setSavingStory] = useState(false);
  const [storyMsg, setStoryMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const unsubPanchang = subscribeDailyPanchang((data) => {
      if (data) setPanchangForm(data);
    });

    const unsubStories = subscribeSpiritualStories((data) => {
      if (Array.isArray(data)) {
        setStories(data);
      }
    });

    return () => {
      unsubPanchang();
      unsubStories();
    };
  }, []);

  const handlePanchangChange = (field: keyof DailyPanchang, value: string) => {
    setPanchangForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSavePanchang = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPanchang(true);
    setPanchangMsg(null);
    try {
      await saveDailyPanchang(panchangForm);
      setPanchangMsg({ text: '✅ ଦୈନିକ ପଞ୍ଜିକା ସଫଳତାର ସହ ସଂରକ୍ଷଣ ହେଲା (Panchang updated successfully)!', type: 'success' });
      setTimeout(() => setPanchangMsg(null), 4000);
    } catch (err) {
      setPanchangMsg({ text: '❌ ପଞ୍ଜିକା ସଂରକ୍ଷଣରେ ତ୍ରୁଟି ଘଟିଲା।', type: 'error' });
    } finally {
      setSavingPanchang(false);
    }
  };

  const handleSaveStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStory || !editingStory.title || !editingStory.content) {
      alert('ଦୟାକରି କାହାଣୀର ଶୀର୍ଷକ ଏବଂ ବିବରଣୀ ଦିଅନ୍ତୁ।');
      return;
    }
    setSavingStory(true);
    setStoryMsg(null);
    try {
      await saveSpiritualStory(editingStory);
      setEditingStory(null);
      setStoryMsg({ text: '✅ ଆଧ୍ୟାତ୍ମିକ କାହାଣୀ ସଫଳତାର ସହ ସଂରକ୍ଷଣ ହେଲା (Story saved)!', type: 'success' });
      setTimeout(() => setStoryMsg(null), 4000);
    } catch (err) {
      setStoryMsg({ text: '❌ କାହାଣୀ ସଂରକ୍ଷଣରେ ତ୍ରୁଟି ଘଟିଲା।', type: 'error' });
    } finally {
      setSavingStory(false);
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!window.confirm('ଆପଣ ନିଶ୍ଚିତ ଏହି କାହାଣୀକୁ ଡିଲିଟ୍ କରିବାକୁ ଚାହାଁନ୍ତି କି?')) return;
    try {
      await deleteSpiritualStory(storyId);
      setStoryMsg({ text: '🗑️ କାହାଣୀ ଡିଲିଟ୍ ହୋଇଗଲା।', type: 'success' });
      setTimeout(() => setStoryMsg(null), 3000);
    } catch (err) {
      setStoryMsg({ text: '❌ କାହାଣୀ ଡିଲିଟ୍ କରିବାରେ ତ୍ରୁଟି।', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Section Header */}
      <div className="bg-gradient-to-r from-amber-800 to-amber-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-amber-400 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="px-3 py-0.5 bg-amber-400/20 text-amber-300 text-xs font-black rounded-full border border-amber-400/40">
            ADMIN CONTENT PANEL
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-amber-100 flex items-center gap-2">
            <span>📅 ଦୈନିକ ପଞ୍ଜିକା ଓ ଆଧ୍ୟାତ୍ମିକ କଥା ପରିଚାଳନା</span>
          </h2>
          <p className="text-xs text-amber-200 font-medium">
            ଆଜିର ଶୁଭ ପଞ୍ଜିକା, ତିଥି, ନକ୍ଷତ୍ର, ରାହୁକାଳ ଏବଂ ନୂତନ ଆଧ୍ୟାତ୍ମିକ ବ୍ଲଗ୍ ଲେଖା ସଂପାଦନ କରନ୍ତୁ।
          </p>
        </div>

        {/* Sub Tab Switcher */}
        <div className="flex items-center bg-amber-900/80 p-1.5 rounded-2xl border border-amber-500/40 gap-1">
          <button
            type="button"
            onClick={() => setActiveSubTab('panchang')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'panchang'
                ? 'bg-amber-400 text-amber-950 shadow-md font-black'
                : 'text-amber-200 hover:text-white hover:bg-amber-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>ଦୈନିକ ପଞ୍ଜିକା (Panchang)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('stories')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'stories'
                ? 'bg-amber-400 text-amber-950 shadow-md font-black'
                : 'text-amber-200 hover:text-white hover:bg-amber-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>ଆଧ୍ୟାତ୍ମିକ କାହାଣୀ ({stories.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: DAILY PANCHANG EDITOR */}
      {/* ========================================================================= */}
      {activeSubTab === 'panchang' && (
        <form onSubmit={handleSavePanchang} className="bg-white rounded-3xl p-5 sm:p-7 border border-amber-300 shadow-md space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-amber-200">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-700" />
                <span>ଆଜିର ଓଡ଼ିଆ ଦୈନିକ ପଞ୍ଜିକା ସମ୍ପାଦନା (Edit Daily Panchang)</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                ଏହି ତଥ୍ୟ ଆପ୍‌ର ମୁଖ୍ୟ ପଞ୍ଜିକା ପୃଷ୍ଠାରେ ପ୍ରଦର୍ଶିତ ହେବ।
              </p>
            </div>

            <button
              type="submit"
              disabled={savingPanchang}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-white font-extrabold rounded-2xl text-xs sm:text-sm shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {savingPanchang ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-amber-300" />
                  <span>Save Panchang (ସଂରକ୍ଷଣ କରନ୍ତୁ)</span>
                </>
              )}
            </button>
          </div>

          {panchangMsg && (
            <div
              className={`p-4 rounded-2xl text-xs font-extrabold flex items-center gap-2 ${
                panchangMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-50 text-rose-800 border border-rose-300'
              }`}
            >
              {panchangMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{panchangMsg.text}</span>
            </div>
          )}

          {/* Section 1: Date & Basic Astronomical Indicators */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider bg-amber-100 px-3 py-1 rounded-lg inline-block">
              ୧- ତାରିଖ, ମାସ ଓ ତିଥି ବିବରଣୀ (Basic Date & Tithi)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">📅 English Date (YYYY-MM-DD)</label>
                <input
                  type="date"
                  value={panchangForm.date}
                  onChange={(e) => handlePanchangChange('date', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">📜 ଓଡ଼ିଆ ସାଲ ଓ ତାରିଖ (Odia Date Text)</label>
                <input
                  type="text"
                  value={panchangForm.odiaDateText}
                  onChange={(e) => handlePanchangChange('odiaDateText', e.target.value)}
                  placeholder="e.g. ଭାଦ୍ରବ ୧୩, ୧୪୩୩ ସାଲ"
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">🌙 ଓଡ଼ିଆ ମାସ ଓ ରାଶି (Month)</label>
                <input
                  type="text"
                  value={panchangForm.odiaMonth}
                  onChange={(e) => handlePanchangChange('odiaMonth', e.target.value)}
                  placeholder="e.g. ଭାଦ୍ରବ (ସିଂହ ମାସ)"
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">🌓 ପକ୍ଷ (Paksha)</label>
                <input
                  type="text"
                  value={panchangForm.paksha}
                  onChange={(e) => handlePanchangChange('paksha', e.target.value)}
                  placeholder="e.g. ଶୁକ୍ଳ ପକ୍ଷ (Shukla Paksha)"
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
              <div className="space-y-1 sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700">🕉️ ତିଥି ଓ ସମୟସୀମା (Tithi Details)</label>
                <input
                  type="text"
                  value={panchangForm.tithi}
                  onChange={(e) => handlePanchangChange('tithi', e.target.value)}
                  placeholder="e.g. ତ୍ରୟୋଦଶୀ ଦିବା ୧୨:୪୦ ପର୍ଯ୍ୟନ୍ତ, ତଦନ୍ତେ ଚତୁର୍ଦ୍ଦଶୀ"
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">🌟 ନକ୍ଷତ୍ର (Nakshatra)</label>
                <input
                  type="text"
                  value={panchangForm.nakshatra}
                  onChange={(e) => handlePanchangChange('nakshatra', e.target.value)}
                  placeholder="e.g. ଶ୍ରବଣା ନକ୍ଷତ୍ର ରାତ୍ରି ୦୨:୧୫ ପର୍ଯ୍ୟନ୍ତ"
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">✨ ଯୋଗ (Yoga)</label>
                <input
                  type="text"
                  value={panchangForm.yoga}
                  onChange={(e) => handlePanchangChange('yoga', e.target.value)}
                  placeholder="e.g. ଶୋଭନ ଯୋଗ"
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">✨ କରଣ (Karana)</label>
                <input
                  type="text"
                  value={panchangForm.karana}
                  onChange={(e) => handlePanchangChange('karana', e.target.value)}
                  placeholder="e.g. ତୈତିଳ କରଣ"
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Sun & Planetary Timings */}
          <div className="space-y-3 pt-3 border-t border-amber-200">
            <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider bg-amber-100 px-3 py-1 rounded-lg inline-block">
              ୨- ସୂର୍ଯ୍ୟ, ଚନ୍ଦ୍ର ଓ ଶୁଭ/ଅଶୁଭ ମୁହୂର୍ତ୍ତ (Timings)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">🌅 ସୂର୍ଯ୍ୟୋଦୟ (Sunrise)</label>
                <input
                  type="text"
                  value={panchangForm.sunrise}
                  onChange={(e) => handlePanchangChange('sunrise', e.target.value)}
                  placeholder="e.g. ୦୫:୩୨ AM"
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">🌇 ସୂର୍ଯ୍ୟାସ୍ତ (Sunset)</label>
                <input
                  type="text"
                  value={panchangForm.sunset}
                  onChange={(e) => handlePanchangChange('sunset', e.target.value)}
                  placeholder="e.g. ୦୬:୧୮ PM"
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">🌙 ଚନ୍ଦ୍ରୋଦୟ (Moonrise)</label>
                <input
                  type="text"
                  value={panchangForm.moonrise || ''}
                  onChange={(e) => handlePanchangChange('moonrise', e.target.value)}
                  placeholder="e.g. ୦୪:୪୫ PM"
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-emerald-800">🟢 ଅମୃତ ବେଳା / ଶୁଭ ସମୟ (Amrita Bela)</label>
                <input
                  type="text"
                  value={panchangForm.amritabela}
                  onChange={(e) => handlePanchangChange('amritabela', e.target.value)}
                  placeholder="e.g. ପ୍ରାତଃ ୦୮:୪୦ AM ରୁ ୧୦:୧୫ AM..."
                  className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50/50 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-rose-800">🔴 ରାହୁ କାଳ / ଅଶୁଭ ସମୟ (Rahu Kala)</label>
                <input
                  type="text"
                  value={panchangForm.rahukala}
                  onChange={(e) => handlePanchangChange('rahukala', e.target.value)}
                  placeholder="e.g. ଦିବା ୦୭:୦୫ AM ରୁ ୦୮:୩୯ AM (ଅଶୁଭ)"
                  className="w-full px-3 py-2 rounded-xl border border-rose-300 bg-rose-50/50 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">🧘 ବ୍ରାହ୍ମ ମୁହୂର୍ତ୍ତ (Brahma Muhurta)</label>
                <input
                  type="text"
                  value={panchangForm.brahmaMuhurta}
                  onChange={(e) => handlePanchangChange('brahmaMuhurta', e.target.value)}
                  placeholder="e.g. ପ୍ରାତଃ ୦୪:୧୫ AM ରୁ ୦୫:୦୦ AM"
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">⏱️ ଗୁଳିକା କାଳ (Gulika Kala)</label>
                <input
                  type="text"
                  value={panchangForm.gulikaKala || ''}
                  onChange={(e) => handlePanchangChange('gulikaKala', e.target.value)}
                  placeholder="e.g. ଦିବା ୦୧:୪୮ PM ରୁ ୦୩:୨୨ PM"
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">⚠️ ଯମଗଣ୍ଡ କାଳ (Yamaganda)</label>
                <input
                  type="text"
                  value={panchangForm.yamaganda || ''}
                  onChange={(e) => handlePanchangChange('yamaganda', e.target.value)}
                  placeholder="e.g. ପ୍ରାତଃ ୧୦:୧୩ AM ରୁ ୧୧:୪୭ AM"
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Festivals & Daily Wisdom */}
          <div className="space-y-3 pt-3 border-t border-amber-200">
            <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider bg-amber-100 px-3 py-1 rounded-lg inline-block">
              ୩- ପର୍ବ, ବ୍ରତ ଓ ଦୈନିକ ସଦ୍‌ବିଚାର (Festivals & Advice)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">🚩 ଆଜିର ବିଶେଷ ପର୍ବ (Special Festival)</label>
                <input
                  type="text"
                  value={panchangForm.specialFestival || ''}
                  onChange={(e) => handlePanchangChange('specialFestival', e.target.value)}
                  placeholder="e.g. ଗହ୍ମା ପୂର୍ଣ୍ଣିମା, ରାକ୍ଷୀ ବନ୍ଧନ ଉତ୍ସବ"
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">🥣 ଉପବାସ / ବ୍ରତ ନିୟମ (Fasting Info)</label>
                <input
                  type="text"
                  value={panchangForm.fastingInfo || ''}
                  onChange={(e) => handlePanchangChange('fastingInfo', e.target.value)}
                  placeholder="e.g. ପ୍ରଦୋଷ ବ୍ରତ ପାଳନ ବିଧି"
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <label className="block text-xs font-bold text-slate-700">🪔 ଦୈନିକ ସଦ୍‌ବିଚାର / ପରାମର୍ଶ (Daily Spiritual Advice)</label>
              <textarea
                rows={3}
                value={panchangForm.dailyAdvice || ''}
                onChange={(e) => handlePanchangChange('dailyAdvice', e.target.value)}
                placeholder="ଆଜି ଦିନଟି ଶୁଭ କାର୍ଯ୍ୟ, ଦେବାରାଧନା ଓ ନାମ ସଂକୀର୍ତ୍ତନ ପାଇଁ ଅତ୍ୟନ୍ତ ଉତ୍ତମ..."
                className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingPanchang}
              className="px-6 py-3 bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-white font-extrabold rounded-2xl text-xs sm:text-sm shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>Save Panchang (ସଂରକ୍ଷଣ କରନ୍ତୁ)</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: SPIRITUAL STORIES MANAGER */}
      {/* ========================================================================= */}
      {activeSubTab === 'stories' && (
        <div className="space-y-6">
          {storyMsg && (
            <div
              className={`p-4 rounded-2xl text-xs font-extrabold flex items-center gap-2 ${
                storyMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-50 text-rose-800 border border-rose-300'
              }`}
            >
              {storyMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{storyMsg.text}</span>
            </div>
          )}

          {/* Add / Edit Story Form Modal/Section */}
          {editingStory ? (
            <form
              onSubmit={handleSaveStory}
              className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-amber-400 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-amber-200">
                <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-amber-700" />
                  <span>{editingStory.id ? 'କାହାଣୀ ସଂପାଦନା (Edit Story)' : 'ନୂତନ ଆଧ୍ୟାତ୍ମିକ କାହାଣୀ ଯୋଡ଼ନ୍ତୁ (Add Story)'}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingStory(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel (ରଦ୍ଦ କରନ୍ତୁ)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700">📖 ଶୀର୍ଷକ (Story Title) *</label>
                  <input
                    type="text"
                    required
                    value={editingStory.title || ''}
                    onChange={(e) => setEditingStory({ ...editingStory, title: e.target.value })}
                    placeholder="e.g. ଶ୍ରୀକ୍ଷେତ୍ରରେ ଭକ୍ତ ସାଲବେଗଙ୍କ ଅମୃତ ଭକ୍ତି"
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">🏷️ ବର୍ଗ (Category)</label>
                  <input
                    type="text"
                    value={editingStory.category || ''}
                    onChange={(e) => setEditingStory({ ...editingStory, category: e.target.value })}
                    placeholder="e.g. ଜଗନ୍ନାଥ ଲୀଳା / ପୁରାଣ କଥା"
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">✍️ ଲେଖକ (Author Name)</label>
                  <input
                    type="text"
                    value={editingStory.author || ''}
                    onChange={(e) => setEditingStory({ ...editingStory, author: e.target.value })}
                    placeholder="e.g. ପଣ୍ଡିତ ସୂର୍ଯ୍ୟନାରାୟଣ ରଥ"
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">⏱️ ପଠନ ସମୟ (Read Time in Mins)</label>
                  <input
                    type="number"
                    min={1}
                    value={editingStory.readTimeMinutes || 4}
                    onChange={(e) => setEditingStory({ ...editingStory, readTimeMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1 flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-950">
                    <input
                      type="checkbox"
                      checked={!!editingStory.isFeatured}
                      onChange={(e) => setEditingStory({ ...editingStory, isFeatured: e.target.checked })}
                      className="w-4 h-4 text-amber-600 rounded"
                    />
                    <span>⭐ ମୁଖ୍ୟ କାହାଣୀ (Featured Story)</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">🖼️ Image URL (କାହାଣୀ ଫଟୋ URL)</label>
                <input
                  type="url"
                  value={editingStory.imageUrl || ''}
                  onChange={(e) => setEditingStory({ ...editingStory, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {editingStory.imageUrl && (
                  <div className="mt-2 h-32 w-48 rounded-xl overflow-hidden border border-amber-300">
                    <img src={editingStory.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">📝 ସଂକ୍ଷିପ୍ତ ସାରାଂଶ (Short Summary / Preview) *</label>
                <textarea
                  rows={2}
                  required
                  value={editingStory.summary || ''}
                  onChange={(e) => setEditingStory({ ...editingStory, summary: e.target.value })}
                  placeholder="କାହାଣୀର ୨-୩ ଧାଡ଼ି ବିଶିଷ୍ଟ ସଂକ୍ଷିପ୍ତ ସାରାଂଶ..."
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">📜 ସମ୍ପୂର୍ଣ୍ଣ କାହାଣୀ ବିବରଣୀ (Full Story Content) *</label>
                <textarea
                  rows={8}
                  required
                  value={editingStory.content || ''}
                  onChange={(e) => setEditingStory({ ...editingStory, content: e.target.value })}
                  placeholder="କାହାଣୀର ସମ୍ପୂର୍ଣ୍ଣ ବିବରଣୀ ଲେଖନ୍ତୁ..."
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-amber-200">
                <button
                  type="button"
                  onClick={() => setEditingStory(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingStory}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 text-white font-extrabold rounded-2xl text-xs flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <Save className="w-4 h-4 text-amber-300" />
                  <span>Save Story (କାହାଣୀ ସଂରକ୍ଷଣ କରନ୍ତୁ)</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() =>
                  setEditingStory({
                    title: '',
                    category: 'ଜଗନ୍ନାଥ ଲୀଳା',
                    author: 'ପଣ୍ଡିତ ମହାଶୟ',
                    readTimeMinutes: 4,
                    summary: '',
                    content: '',
                    imageUrl: 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?q=80&w=1000&auto=format&fit=crop',
                    isFeatured: false,
                  })
                }
                className="px-5 py-2.5 bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-white font-extrabold rounded-2xl text-xs flex items-center gap-2 shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add New Story (ନୂତନ କାହାଣୀ ଯୋଡ଼ନ୍ତୁ)</span>
              </button>
            </div>
          )}

          {/* Stories List Table / Cards */}
          <div className="bg-white rounded-3xl p-5 border border-amber-300 shadow-md space-y-4">
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-700" />
              <span>ବର୍ତ୍ତମାନର ସକ୍ରିୟ କାହାଣୀ ସମୂହ ({stories.length})</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stories.map((story) => (
                <div
                  key={story.id}
                  className="p-4 rounded-2xl border-2 border-amber-200 hover:border-amber-400 bg-amber-50/40 flex flex-col justify-between space-y-3 transition"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={story.imageUrl}
                      alt={story.title}
                      className="w-20 h-20 rounded-xl object-cover shrink-0 border border-amber-300"
                    />
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 bg-amber-200 text-amber-900 font-bold rounded-md text-[10px]">
                          {story.category}
                        </span>
                        {story.isFeatured && (
                          <span className="px-2 py-0.5 bg-amber-500 text-amber-950 font-black rounded-md text-[10px]">
                            ⭐ Featured
                          </span>
                        )}
                      </div>
                      <h4 className="font-black text-slate-900 text-sm leading-snug line-clamp-2">
                        {story.title}
                      </h4>
                      <p className="text-[11px] text-slate-600 line-clamp-2">{story.summary}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-amber-200 text-xs">
                    <span className="text-slate-500 font-bold text-[11px]">✍️ {story.author}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingStory(story)}
                        className="px-3 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold rounded-lg text-xs flex items-center gap-1 transition cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteStory(story.id)}
                        className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold rounded-lg text-xs flex items-center gap-1 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
