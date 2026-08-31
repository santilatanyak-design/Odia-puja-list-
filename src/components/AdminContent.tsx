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
  Share2,
  Key,
  Globe,
  Settings,
} from 'lucide-react';
import { S3PhotoUploader } from './S3PhotoUploader';
import { autoPublishStoryHtmlToS3, bulkPublishAllStoriesToS3 } from '../lib/publishStoryHtml';
import { getClientAwsConfig, saveClientAwsConfig, triggerAmplifyRebuild } from '../lib/s3Upload';

interface AdminContentProps {
  defaultSection?: 'panchang' | 'stories';
}

export const AdminContent: React.FC<AdminContentProps> = ({ defaultSection = 'panchang' }) => {
  const [activeSubTab, setActiveSubTab] = useState<'panchang' | 'stories'>(defaultSection);

  useEffect(() => {
    if (defaultSection) {
      setActiveSubTab(defaultSection);
    }
  }, [defaultSection]);

  // Panchang State
  const [panchangForm, setPanchangForm] = useState<DailyPanchang>(DEFAULT_PANCHANG);
  const [savingPanchang, setSavingPanchang] = useState(false);
  const [panchangMsg, setPanchangMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Stories State
  const [stories, setStories] = useState<SpiritualStory[]>([]);
  const [editingStory, setEditingStory] = useState<Partial<SpiritualStory> | null>(null);
  const [savingStory, setSavingStory] = useState(false);
  const [syncingOgMeta, setSyncingOgMeta] = useState(false);
  const [storyMsg, setStoryMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // AWS & Social Share Config State
  const [showAwsSettings, setShowAwsSettings] = useState(false);
  const [awsConfigState, setAwsConfigState] = useState(() => getClientAwsConfig());
  const [savingAwsConfig, setSavingAwsConfig] = useState(false);

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
      const savedStory = await saveSpiritualStory(editingStory);
      setEditingStory(null);

      // Instantly upload static HTML to AWS S3 so Facebook & WhatsApp get exact photo and title!
      const storyToPublish = (savedStory as SpiritualStory) || {
        ...editingStory,
        id: editingStory.id || `story-${Date.now()}`,
      } as SpiritualStory;

      await autoPublishStoryHtmlToS3(storyToPublish);

      setStoryMsg({
        text: '✅ ଆଧ୍ୟାତ୍ମିକ କାହାଣୀ ସଫଳତାର ସହ ସଂରକ୍ଷଣ ହେଲା ଏବଂ Facebook/WhatsApp ପାଇଁ ସ୍ୱୟଂକ୍ରିୟ ପବ୍ଲିଶ୍ ହେଲା!',
        type: 'success',
      });
      setTimeout(() => setStoryMsg(null), 5000);
    } catch (err) {
      setStoryMsg({ text: '❌ କାହାଣୀ ସଂରକ୍ଷଣରେ ତ୍ରୁଟି ଘଟିଲା।', type: 'error' });
    } finally {
      setSavingStory(false);
    }
  };

  const handleSyncOgMeta = async () => {
    setSyncingOgMeta(true);
    setStoryMsg(null);
    try {
      const result = await bulkPublishAllStoriesToS3(stories);
      setStoryMsg({
        text: `⚡ ସମସ୍ତ ${result.success} ଟି କାହାଣୀ AWS S3 ଓ Facebook/WhatsApp ପାଇଁ ସଫଳତାର ସହିତ ସିଙ୍କ୍ ହେଲା!`,
        type: 'success',
      });
      setTimeout(() => setStoryMsg(null), 6000);
    } catch (err: any) {
      setStoryMsg({ text: '❌ ସିଙ୍କ୍ ବିଫଳ: ' + (err?.message || 'Error'), type: 'error' });
    } finally {
      setSyncingOgMeta(false);
    }
  };

  const handleSaveAwsConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAwsConfig(true);
    saveClientAwsConfig(awsConfigState);
    setTimeout(() => {
      setSavingAwsConfig(false);
      setStoryMsg({ text: '✅ AWS S3 ଓ ସୋସିଆଲ୍ ଶେୟାର୍ ସେଟିଂସ୍ ସେଭ୍ ହୋଇଗଲା!', type: 'success' });
      setShowAwsSettings(false);
      setTimeout(() => setStoryMsg(null), 4000);
    }, 400);
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

          {/* AWS S3 & Instant Social Share Configuration Drawer/Card */}
          {showAwsSettings && (
            <form
              onSubmit={handleSaveAwsConfig}
              className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-400 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 animate-in fade-in"
            >
              <div className="flex items-center justify-between pb-3 border-b border-amber-200">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-600 text-white rounded-xl shadow-xs">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-amber-950">
                      ⚡ Facebook/WhatsApp ସୋସିଆଲ୍ ଶେୟାର୍ ଓ AWS S3 ସେଟିଂସ୍ (Social Preview & S3 Setup)
                    </h3>
                    <p className="text-xs text-amber-800 font-medium">
                      ନୂଆ ପୋଷ୍ଟ ଶେୟାର କଲେ ଯେପରି ଡେମୋ ଫଟୋ ବଦଳରେ ପୋଷ୍ଟର ଅସଲ ଫଟୋ ଆସିବ, ସେଥିପାଇଁ AWS Keys ଏଠାରେ ସେଭ୍ କରନ୍ତୁ।
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAwsSettings(false)}
                  className="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Close (ବନ୍ଦ କରନ୍ତୁ)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">
                    🔑 AWS Access Key ID
                  </label>
                  <input
                    type="text"
                    value={awsConfigState.accessKeyId}
                    onChange={(e) => setAwsConfigState({ ...awsConfigState, accessKeyId: e.target.value })}
                    placeholder="AKIAIOSFODNN7EXAMPLE"
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 font-mono text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">
                    🔒 AWS Secret Access Key
                  </label>
                  <input
                    type="password"
                    value={awsConfigState.secretAccessKey}
                    onChange={(e) => setAwsConfigState({ ...awsConfigState, secretAccessKey: e.target.value })}
                    placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 font-mono text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">
                    🪣 S3 Bucket Name
                  </label>
                  <input
                    type="text"
                    value={awsConfigState.bucket}
                    onChange={(e) => setAwsConfigState({ ...awsConfigState, bucket: e.target.value })}
                    placeholder="bhakti-ananda-photos"
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 font-mono text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">
                    🔗 Amplify Incoming Webhook URL (Optional for 100% CDN Sync)
                  </label>
                  <input
                    type="text"
                    value={awsConfigState.amplifyWebhookUrl}
                    onChange={(e) => setAwsConfigState({ ...awsConfigState, amplifyWebhookUrl: e.target.value })}
                    placeholder="https://webhooks.amplify.ap-south-1.amazonaws.com/prod/webhooks?..."
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 font-mono text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="text-[11px] text-amber-900 font-semibold flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${awsConfigState.isDirectReady ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  <span>
                    {awsConfigState.isDirectReady
                      ? '✅ AWS S3 ସିଧାସଳଖ ସଂଯୁକ୍ତ (Direct S3 Connected)'
                      : '⚠️ AWS Keys ଦିଅନ୍ତୁ ଯାହାଦ୍ୱାରା ନୂଆ ପୋଷ୍ଟ ସଙ୍ଗେ ସଙ୍ଗେ S3 କୁ ଅପଲୋଡ୍ ହେବ।'}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={savingAwsConfig}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-700 to-amber-900 text-white font-extrabold rounded-xl text-xs shadow-md flex items-center gap-2 hover:from-amber-800 hover:to-amber-950 cursor-pointer"
                >
                  <Save className="w-4 h-4 text-amber-300" />
                  <span>{savingAwsConfig ? 'Saving...' : 'Save Settings (ସେଟିଂସ୍ ସେଭ୍ କରନ୍ତୁ)'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Add / Edit Story Form Modal/Section */}
          {editingStory ? (
            <form
              onSubmit={handleSaveStory}
              className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-amber-400 shadow-xl space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-amber-200">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-100 text-amber-900 rounded-xl">
                    <Edit3 className="w-5 h-5 text-amber-800" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      {editingStory.id ? 'କାହାଣୀ ସଂପାଦନା (Edit Dynamic Post)' : 'ନୂତନ ଆଧ୍ୟାତ୍ମିକ ପୋଷ୍ଟ ଯୋଡ଼ନ୍ତୁ (Dynamic Custom Post)'}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      ଶୂନ୍ୟ-ଷ୍ଟୋରେଜ୍ (Zero-Storage): ଇମେଜ୍ URL ମାଧ୍ୟମରେ ସହଜରେ କଷ୍ଟମ୍ ପୋଷ୍ଟ ଓ Amazon Affiliate ବିଜ୍ଞାପନ ଯୋଡ଼ନ୍ତୁ।
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingStory(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Cancel (ରଦ୍ଦ କରନ୍ତୁ)
                </button>
              </div>

              {/* 1. TITLE & ON-THE-FLY CATEGORY */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="space-y-1.5 sm:col-span-8">
                  <label className="block text-xs font-bold text-slate-800 flex items-center gap-1">
                    <span>📖 ପୋଷ୍ଟ ଶୀର୍ଷକ (Post Title) *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStory.title || ''}
                    onChange={(e) => setEditingStory({ ...editingStory, title: e.target.value })}
                    placeholder="e.g. ଶ୍ରୀକ୍ଷେତ୍ରରେ ଭକ୍ତ ସାଲବେଗଙ୍କ ଅମୃତ ଭକ୍ତି ଓ ଅଲୌକିକ ଅନୁଭୂତି"
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-amber-300 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-4">
                  <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>🏷️ ବର୍ଗ (Category - On The Fly)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStory.category || ''}
                    onChange={(e) => setEditingStory({ ...editingStory, category: e.target.value })}
                    placeholder="Type ANY category or pick below..."
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-amber-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                  />
                </div>
              </div>

              {/* Quick Category Chips */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] font-bold text-slate-500">ଶୀଘ୍ର ବର୍ଗ ଚୟନ (Quick Chips):</span>
                {['ଜଗନ୍ନାଥ ଲୀଳା', 'ପୁରାଣ କଥା', 'ଶିବ ମହିମା', 'ଭକ୍ତି ସାହିତ୍ୟ', 'ଆୟୁର୍ବେଦ ଓ ଜୀବନଶୈଳୀ', 'ମନ୍ଦିର ଇତିହାସ', 'ଦୈନିକ ପୂଜା ବିଧି'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setEditingStory({ ...editingStory, category: cat })}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition cursor-pointer ${
                      editingStory.category === cat
                        ? 'bg-amber-800 text-white shadow-xs'
                        : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* 2. S3 PHOTO UPLOADER / DIRECT IMAGE URL (AWS S3 Bucket: bhakti-ananda-photos) */}
              <div className="p-4 bg-amber-50/70 rounded-2xl border-2 border-amber-300 space-y-3">
                <S3PhotoUploader
                  value={editingStory.imageUrl || ''}
                  onChange={(url) => setEditingStory({ ...editingStory, imageUrl: url })}
                  folder="posts"
                  label="🖼️ ପୋଷ୍ଟ ଫଟୋ / ସୋସିଆଲ୍ ଶେୟାରିଂ ଇମେଜ୍ (Featured & Social Sharing Image - Facebook, WhatsApp, Twitter)"
                  placeholder="https://... or click upload photo"
                  required
                />
                <p className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                  <span>💡 ସୂଚନା:</span>
                  <span>
                    ଏହି ଫଟୋଟି ଫେସବୁକ୍, ହ୍ୱାଟ୍ସଆପ୍ ଏବଂ ଟୁଇଟର୍‌ରେ ସିଧାସଳଖ Open Graph (<code>og:image</code>) ରେ ଦେଖାଯିବ।
                  </span>
                </p>
              </div>

              {/* 3. METADATA: AUTHOR, READ TIME, FEATURED */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">✍️ ଲେଖକ (Author Name)</label>
                  <input
                    type="text"
                    value={editingStory.author || ''}
                    onChange={(e) => setEditingStory({ ...editingStory, author: e.target.value })}
                    placeholder="e.g. ପଣ୍ଡିତ ସୂର୍ଯ୍ୟନାରାୟଣ ରଥ"
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">⏱️ ପଠନ ସମୟ (Read Time in Mins)</label>
                  <input
                    type="number"
                    min={1}
                    value={editingStory.readTimeMinutes !== undefined && editingStory.readTimeMinutes !== null && editingStory.readTimeMinutes !== 0 ? editingStory.readTimeMinutes : ''}
                    onChange={(e) => setEditingStory({ ...editingStory, readTimeMinutes: Number(e.target.value) || 0 })}
                    placeholder="e.g. 4"
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                </div>

                <div className="space-y-1 flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-950 p-2 bg-amber-50 rounded-xl border border-amber-200 w-full">
                    <input
                      type="checkbox"
                      checked={!!editingStory.isFeatured}
                      onChange={(e) => setEditingStory({ ...editingStory, isFeatured: e.target.checked })}
                      className="w-4 h-4 text-amber-600 rounded"
                    />
                    <span>⭐ ମୁଖ୍ୟ କାହାଣୀ (Featured)</span>
                  </label>
                </div>
              </div>

              {/* 4. SUMMARY / SNIPPET */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">📝 ସଂକ୍ଷିପ୍ତ ସାରାଂଶ (Short Summary / Card Snippet) *</label>
                <textarea
                  rows={2}
                  required
                  value={editingStory.summary || ''}
                  onChange={(e) => setEditingStory({ ...editingStory, summary: e.target.value })}
                  placeholder="କାହାଣୀର ୨-୩ ଧାଡ଼ି ବିଶିଷ୍ଟ ମୁଖ୍ୟ ସାରାଂଶ ଯାହା କାର୍ଡ ଉପରେ ଦେଖାଯିବ..."
                  className="w-full px-3.5 py-2 rounded-xl border border-amber-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
                />
              </div>

              {/* 5. CONTENT EDITOR WITH FORMATTING TOOLBAR */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    📜 ସମ୍ପୂର୍ଣ୍ଣ କାହାଣୀ ବିବରଣୀ (Full Article Content Editor) *
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {(editingStory.content || '').length} ଅକ୍ଷର | {((editingStory.content || '').trim().split(/\s+/).filter(Boolean)).length} ଶବ୍ଦ
                  </span>
                </div>

                {/* Quick Rich Text Helper Tools */}
                <div className="flex items-center gap-1.5 p-2 bg-slate-100 rounded-xl border border-slate-200 flex-wrap text-xs">
                  <span className="text-[10px] font-bold text-slate-600 mr-1">Quick Tools:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingStory((prev) => ({
                        ...prev,
                        content: (prev?.content || '') + ' **ମୁଖ୍ୟ ବାକ୍ୟ** ',
                      }));
                    }}
                    className="px-2 py-1 bg-white hover:bg-amber-100 rounded font-bold text-slate-700 border border-slate-300 text-[11px]"
                  >
                    <b>B</b> Bold
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingStory((prev) => ({
                        ...prev,
                        content: (prev?.content || '') + ' *ବିଶେଷ ଶବ୍ଦ* ',
                      }));
                    }}
                    className="px-2 py-1 bg-white hover:bg-amber-100 rounded italic text-slate-700 border border-slate-300 text-[11px]"
                  >
                    <i>I</i> Italic
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingStory((prev) => ({
                        ...prev,
                        content: (prev?.content || '') + '\n\n### ଉପ-ଶୀର୍ଷକ (Subheading)\n',
                      }));
                    }}
                    className="px-2 py-1 bg-white hover:bg-amber-100 rounded font-bold text-slate-700 border border-slate-300 text-[11px]"
                  >
                    📑 Heading
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingStory((prev) => ({
                        ...prev,
                        content: (prev?.content || '') + '\n\n> "ଦିବ୍ୟ ଉକ୍ତି କିମ୍ବା ଶ୍ଳୋକ"\n\n',
                      }));
                    }}
                    className="px-2 py-1 bg-white hover:bg-amber-100 rounded text-slate-700 border border-slate-300 text-[11px]"
                  >
                    💬 Quote
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingStory((prev) => ({
                        ...prev,
                        content: (prev?.content || '') + '\n• ପ୍ରଥମ ବିନ୍ଦୁ\n• ଦ୍ୱିତୀୟ ବିନ୍ଦୁ\n',
                      }));
                    }}
                    className="px-2 py-1 bg-white hover:bg-amber-100 rounded text-slate-700 border border-slate-300 text-[11px]"
                  >
                    • List
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingStory((prev) => ({
                        ...prev,
                        content: (prev?.content || '') + '\n\n',
                      }));
                    }}
                    className="px-2 py-1 bg-white hover:bg-amber-100 rounded text-slate-700 border border-slate-300 text-[11px]"
                  >
                    ↩ New Para
                  </button>
                </div>

                <textarea
                  rows={9}
                  required
                  value={editingStory.content || ''}
                  onChange={(e) => setEditingStory({ ...editingStory, content: e.target.value })}
                  placeholder="ପ୍ରବନ୍ଧ କିମ୍ବା ଆଧ୍ୟାତ୍ମିକ କାହାଣୀର ସମ୍ପୂର୍ଣ୍ଣ ବିବରଣୀ ଲେଖନ୍ତୁ..."
                  className="w-full px-3.5 py-3 rounded-2xl border-2 border-amber-300 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed font-sans"
                />
              </div>

              {/* 6. SMART AFFILIATE POP-UP AD (Monetization Engine) */}
              <div className="p-4 sm:p-5 bg-gradient-to-br from-amber-500/10 via-amber-100/50 to-orange-100/40 rounded-3xl border-2 border-amber-400 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-amber-300/80">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-amber-500 text-amber-950 rounded-lg text-xs font-black">
                      💰 MONETIZE
                    </span>
                    <div>
                      <h4 className="font-black text-amber-950 text-xs sm:text-sm">
                        ସ୍ମାର୍ଟ Amazon Affiliate Pop-up ବିଜ୍ଞାପନ (Smart Affiliate Ad System)
                      </h4>
                      <p className="text-[11px] text-amber-900 font-medium">
                        ପାଠକ କାହାଣୀ ପଢ଼ିବା ସମୟରେ ନିର୍ଦ୍ଦିଷ୍ଟ ସେକେଣ୍ଡ ପରେ ଆପେ ଆପେ Amazon ପ୍ରଡକ୍ଟ ପପ୍-ଅପ୍ ହେବ ଏବଂ କାଉଣ୍ଟଡାଉନ୍ ପରେ ବନ୍ଦ ହେବ।
                      </p>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-amber-400 shadow-xs text-xs font-black text-amber-950">
                    <input
                      type="checkbox"
                      checked={!!editingStory.affiliateAd?.enabled}
                      onChange={(e) =>
                        setEditingStory({
                          ...editingStory,
                          affiliateAd: {
                            ...(editingStory.affiliateAd || {}),
                            enabled: e.target.checked,
                            triggerDelaySeconds: editingStory.affiliateAd?.triggerDelaySeconds || 4,
                            countdownSeconds: editingStory.affiliateAd?.countdownSeconds || 5,
                            productTitle: editingStory.affiliateAd?.productTitle || '',
                            productImageUrl: editingStory.affiliateAd?.productImageUrl || '',
                            affiliateUrl: editingStory.affiliateAd?.affiliateUrl || '',
                            productDescription: editingStory.affiliateAd?.productDescription || '',
                          },
                        })
                      }
                      className="w-4 h-4 text-amber-600 rounded"
                    />
                    <span>{editingStory.affiliateAd?.enabled ? '✅ Ad Enabled (ସକ୍ରିୟ)' : '⚪ Enable Ad (ଅନ୍ କରନ୍ତୁ)'}</span>
                  </label>
                </div>

                {editingStory.affiliateAd?.enabled && (
                  <div className="space-y-4 pt-1">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-800">
                        📦 ପ୍ରଡକ୍ଟ ଶୀର୍ଷକ (Amazon Product Title)
                      </label>
                      <input
                        type="text"
                        value={editingStory.affiliateAd?.productTitle || ''}
                        onChange={(e) =>
                          setEditingStory({
                            ...editingStory,
                            affiliateAd: {
                              ...(editingStory.affiliateAd || {}),
                              productTitle: e.target.value,
                            },
                          })
                        }
                        placeholder="e.g. ଶ୍ରୀ ଜଗନ୍ନାଥ କାଷ୍ଠ ମୂର୍ତ୍ତି / ସମ୍ପୂର୍ଣ୍ଣ ଓଡ଼ିଆ ଭାଗବତ ସେଟ୍"
                        className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="space-y-1 sm:col-span-7">
                        <label className="block text-xs font-bold text-slate-800">
                          🔗 Amazon Affiliate Target Link (ଅର୍ଡର ଲିଙ୍କ୍)
                        </label>
                        <input
                          type="url"
                          value={editingStory.affiliateAd?.affiliateUrl || ''}
                          onChange={(e) =>
                            setEditingStory({
                              ...editingStory,
                              affiliateAd: {
                                ...(editingStory.affiliateAd || {}),
                                affiliateUrl: e.target.value,
                              },
                            })
                          }
                          placeholder="https://www.amazon.in/dp/...?tag=youraffiliate-21"
                          className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-mono bg-white"
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-5">
                        <S3PhotoUploader
                          value={editingStory.affiliateAd?.productImageUrl || ''}
                          onChange={(url) =>
                            setEditingStory({
                              ...editingStory,
                              affiliateAd: {
                                ...(editingStory.affiliateAd || {}),
                                productImageUrl: url,
                              },
                            })
                          }
                          folder="posts"
                          label="🖼️ ପ୍ରଡକ୍ଟ ଫଟୋ (Product Photo)"
                          placeholder="https://... or upload image"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-800">
                        📝 ପ୍ରଡକ୍ଟ ସଂକ୍ଷିପ୍ତ ବିବରଣୀ (Short Ad Description)
                      </label>
                      <input
                        type="text"
                        value={editingStory.affiliateAd?.productDescription || ''}
                        onChange={(e) =>
                          setEditingStory({
                            ...editingStory,
                            affiliateAd: {
                              ...(editingStory.affiliateAd || {}),
                              productDescription: e.target.value,
                            },
                          })
                        }
                        placeholder="e.g. ଶୁଦ୍ଧ ସାମଗ୍ରୀ ସହ ଦ୍ରୁତ ଡେଲିଭରି ଉପଲବ୍ଧ। ଆଜି ହିଁ ଅର୍ଡର କରନ୍ତୁ।"
                        className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-medium bg-white"
                      />
                    </div>

                    {/* Word Trigger & Countdown Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white rounded-2xl border border-amber-300/70">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">
                          🎯 ଶବ୍ଦ ଟ୍ରିଗର୍ / କୀ-ୱାର୍ଡ଼ (Word Trigger in Story Text)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. ଜଗନ୍ନାଥ, ଗୀତା, ପୂଜା (Optional)"
                          value={editingStory.affiliateAd?.adTriggerText || ''}
                          onChange={(e) =>
                            setEditingStory({
                              ...editingStory,
                              affiliateAd: {
                                ...(editingStory.affiliateAd || {}),
                                adTriggerText: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-xl border border-amber-300 text-xs font-bold"
                        />
                        <p className="text-[10px] text-slate-500">
                          ପାଠକ ଏହି ଶବ୍ଦକୁ ସ୍କ୍ରୋଲ୍ କଲେ ବିଜ୍ଞାପନ ତୁରନ୍ତ ଖୋଲିବ।
                        </p>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">
                          ⏱️ Countdown Timer (କେତେ ସେକେଣ୍ଡ ପରେ ବନ୍ଦ ହେବ?)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={2}
                            max={60}
                            value={editingStory.affiliateAd?.adTimerSeconds || editingStory.affiliateAd?.countdownSeconds || 5}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 5;
                              setEditingStory({
                                ...editingStory,
                                affiliateAd: {
                                  ...(editingStory.affiliateAd || {}),
                                  adTimerSeconds: val,
                                  countdownSeconds: val,
                                },
                              });
                            }}
                            className="w-24 px-3 py-1.5 rounded-xl border border-amber-300 text-xs font-black text-center"
                          />
                          <span className="text-xs text-slate-500 font-bold">ସେକେଣ୍ଡ (Default: 5s)</span>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          ଅଟୋମେଟିକ୍ ବନ୍ଦ ହେବା ସମୟ।
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 7. PUBLISH & ACTIONS */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-amber-200">
                <button
                  type="button"
                  onClick={() => setEditingStory(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition cursor-pointer"
                >
                  Cancel (ରଦ୍ଦ କରନ୍ତୁ)
                </button>
                <button
                  type="submit"
                  disabled={savingStory}
                  className="px-8 py-3 bg-gradient-to-r from-amber-700 via-amber-800 to-amber-950 hover:from-amber-800 hover:to-amber-900 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center gap-2.5 shadow-xl transition transform active:scale-98 cursor-pointer border border-amber-400"
                >
                  <Save className="w-4 h-4 text-amber-300" />
                  <span>{savingStory ? 'ପ୍ରକାଶିତ ହେଉଛି...' : '🚀 Publish Post Live (ପୋଷ୍ଟ ଲାଇଭ୍ କରନ୍ତୁ)'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleSyncOgMeta}
                  disabled={syncingOgMeta}
                  className="px-4 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold rounded-2xl text-xs flex items-center gap-2 border border-amber-300 shadow-xs cursor-pointer disabled:opacity-50 transition"
                  title="Force update all story cards for Facebook, WhatsApp & Twitter previews"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-amber-800 ${syncingOgMeta ? 'animate-spin' : ''}`} />
                  <span>{syncingOgMeta ? 'ସିଙ୍କ୍ ହେଉଛି...' : '⚡ ସୋସିଆଲ୍ ଶେୟାର୍ ମେଟା ସିଙ୍କ୍ (Sync S3 Meta)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAwsSettings(!showAwsSettings)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 border transition cursor-pointer ${
                    showAwsSettings
                      ? 'bg-amber-800 text-white border-amber-900 shadow-md'
                      : 'bg-white hover:bg-amber-50 text-slate-800 border-amber-300 shadow-xs'
                  }`}
                >
                  <Key className="w-3.5 h-3.5 text-amber-600" />
                  <span>AWS S3 / Social Settings</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() =>
                  setEditingStory({
                    title: '',
                    category: '',
                    author: '',
                    readTimeMinutes: undefined as any,
                    summary: '',
                    content: '',
                    imageUrl: '',
                    isFeatured: false,
                    affiliateAd: {
                      enabled: false,
                      productTitle: '',
                      productImageUrl: '',
                      affiliateUrl: '',
                      productDescription: '',
                      triggerDelaySeconds: 4,
                      countdownSeconds: 5,
                    },
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
