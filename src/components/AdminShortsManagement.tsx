import React, { useState, useEffect } from 'react';
import { TempleShort, Temple } from '../types';
import {
  getTempleShorts,
  saveTempleShorts,
  extractYouTubeId,
  normalizeYouTubeShortUrl,
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrl,
  DEFAULT_SHORTS,
} from '../lib/shortsApi';
import { getTemplesFromLocal } from '../lib/templeApi';
import { showCustomAlert } from '../lib/customAlert';
import {
  Tv,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Play,
  Film,
  Video,
} from 'lucide-react';

export const AdminShortsManagement: React.FC = () => {
  const [shorts, setShorts] = useState<TempleShort[]>([]);
  const [temples, setTemples] = useState<Temple[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');

  // New short input form state
  const [newUrl, setNewUrl] = useState<string>('');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newTempleName, setNewTempleName] = useState<string>('ଶ୍ରୀ ଜଗନ୍ନାଥ ମନ୍ଦିର, ପୁରୀ');
  const [newTempleId, setNewTempleId] = useState<string>('jagannath');
  const [newDescription, setNewDescription] = useState<string>('');
  const [previewId, setPreviewId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const fetchedShorts = await getTempleShorts();
      const fetchedTemples = getTemplesFromLocal();
      setShorts(fetchedShorts);
      setTemples(fetchedTemples);
      if (fetchedTemples.length > 0) {
        setNewTempleName(fetchedTemples[0].name);
        setNewTempleId(fetchedTemples[0].id);
      }
    } catch (err) {
      console.error('Error loading shorts admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUrlChange = (url: string) => {
    setNewUrl(url);
    const id = extractYouTubeId(url);
    setPreviewId(id);
  };

  const handleAddShort = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const trimmedUrl = newUrl.trim();
    if (!trimmedUrl) {
      showCustomAlert('ଦୟାକରି YouTube Short URL କିମ୍ବା Video Link ପ୍ରବେଶ କରନ୍ତୁ (Please enter a YouTube URL)');
      return;
    }

    const videoId = extractYouTubeId(trimmedUrl);
    if (!videoId) {
      showCustomAlert('ଅବୈଧ YouTube URL! ଦୟାକରି ସଠିକ୍ YouTube Short (ଯଥା: https://youtube.com/shorts/...) କିମ୍ବା Video Link ଦିଅନ୍ତୁ।');
      return;
    }

    // Clean canonical short URL without tracking parameters
    const cleanShortUrl = normalizeYouTubeShortUrl(trimmedUrl);

    // Build the new video object (with optional description, title, temple)
    const newShortItem: TempleShort = {
      id: `short-${Date.now()}`,
      title: newTitle.trim() || (newTempleName.trim() ? `${newTempleName.trim()} ଦିବ୍ୟ ଦର୍ଶନ 🚩` : 'ମନ୍ଦିର ପୂଜା ଭିଡିଓ ଦର୍ଶନ 🚩'),
      youtubeUrl: cleanShortUrl,
      templeName: newTempleName.trim() || 'ଓଡ଼ିଶା ପ୍ରସିଦ୍ଧ ମନ୍ଦିର',
      templeId: newTempleId || '',
      description: newDescription.trim() || '',
      createdAt: new Date().toISOString(),
    };

    const updated = [newShortItem, ...shorts];
    setShorts(updated);

    // Reset Form inputs immediately
    setNewUrl('');
    setNewTitle('');
    setNewDescription('');
    setPreviewId(null);

    // Save directly to localStorage and Firestore database
    setIsSaving(true);
    try {
      const savedSuccessfully = await saveTempleShorts(updated);
      if (savedSuccessfully) {
        setSuccessMsg('✅ ନୂତନ YouTube Short ସଫଳତାର ସହ ସଂରକ୍ଷଣ (Saved & Active) ହେଲା!');
        showCustomAlert('✅ ଭିଡିଓ ସଫଳତାର ସହ ଯୋଡ଼ାଗଲା ଓ ସେଭ୍ ହେଲା!');
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        showCustomAlert('ଭିଡିଓ ତାଲିକାରେ ଯୋଡ଼ାଗଲା କିନ୍ତୁ କ୍ଲାଉଡ୍ ସେଭ୍ କରିବାରେ ତ୍ରୁଟି ହେଲା। ଦୟାକରି "Save All Shorts" ବଟନ୍ ଦବାନ୍ତୁ।');
      }
    } catch (err) {
      console.error('Error auto-saving new short:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteShort = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const updated = shorts.filter((s) => s.id !== id);
    setShorts(updated);
    setIsSaving(true);
    try {
      await saveTempleShorts(updated);
      setSuccessMsg('ଭିଡିଓ ହଟାଗଲା ଏବଂ ସେଭ୍ ହେଲା।');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Delete short save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateShortField = (id: string, field: keyof TempleShort, value: string) => {
    const updated = shorts.map((s) => {
      if (s.id === id) {
        return { ...s, [field]: value };
      }
      return s;
    });
    setShorts(updated);
  };

  const handleSaveAll = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      setIsSaving(true);
      const ok = await saveTempleShorts(shorts);
      if (ok) {
        setSuccessMsg('✅ ସମସ୍ତ Temple Puja Shorts ସଫଳତାର ସହ ସଂରକ୍ଷଣ (Saved) ହେଲା!');
        showCustomAlert('✅ ସମସ୍ତ ଭିଡିଓ ସଫଳତାର ସହ ସେଭ୍ ହେଲା!');
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        showCustomAlert('ସେଭ୍ କରିବାରେ ବିଫଳ ହେଲା। ଦୟାକରି ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ।');
      }
    } catch (err) {
      console.error('Save shorts error:', err);
      showCustomAlert('ତ୍ରୁଟି: ଭିଡିଓ ସେଭ୍ ହୋଇପାରିଲା ନାହିଁ।');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearAll = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (confirm('ଆପଣ ସମସ୍ତ ଭିଡିଓ ତାଲିକାରୁ ହଟାଇବାକୁ ଚାହାଁନ୍ତି କି? (Are you sure you want to clear all videos?)')) {
      setShorts([]);
      setIsSaving(true);
      try {
        await saveTempleShorts([]);
        showCustomAlert('ସମସ୍ତ ଭିଡିଓ ସଫଳତାର ସହ ହଟାଗଲା।');
      } finally {
        setIsSaving(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-amber-300">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-bold text-amber-950">ମନ୍ଦିର ଭିଡିଓ ସେଟିଂସ ଲୋଡ୍ ହେଉଛି...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-amber-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border-2 border-amber-500/40 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-2xl">
            <Tv className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-amber-300">
                ମନ୍ଦିର ପୂଜା ଭିଡିଓ ପରିଚାଳନା (Temple Puja Shorts Admin)
              </h2>
              <span className="px-2.5 py-0.5 bg-rose-600 text-white font-extrabold rounded-full text-xs">
                {shorts.length} VIDEOS
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 font-medium">
              ଏଠାରେ YouTube Short URLs ପେଷ୍ଟ୍ କରି ସେଭ୍ କରନ୍ତୁ। ୟୁଜର୍ସ ହୋମ୍‌ପେଜ୍‌ରୁ ସିଧାସଳଖ ଭର୍ଟିକାଲ୍ ରିଲ୍ସ ଫିଡ୍ ଦେଖିପାରିବେ।
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {shorts.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="px-3.5 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-rose-500/40"
              title="Clear all videos"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition shadow-lg flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'ସେଭ୍ ହେଉଛି...' : '💾 ସମସ୍ତ ଭିଡିଓ ସଂରକ୍ଷଣ କରନ୍ତୁ'}</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-2xl text-emerald-950 text-xs sm:text-sm font-black flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* NEW SHORT INPUT FORM */}
      <form onSubmit={handleAddShort} className="bg-white border-2 border-amber-300 rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-amber-200 pb-3">
          <h3 className="font-black text-amber-950 text-base flex items-center gap-2">
            <Plus className="w-5 h-5 text-rose-700" />
            <span>ନୂତନ YouTube Short ଯୋଡ଼ନ୍ତୁ (Add New YouTube Short URL)</span>
          </h3>
          <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
            Auto-Saves on Add
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* URL & Title inputs */}
          <div className="md:col-span-2 space-y-3">
            <div>
              <label className="block text-xs font-black text-amber-950 mb-1">
                🔗 YouTube Short URL କିମ୍ବା Video Link: <span className="text-rose-600">*</span>
              </label>
              <input
                type="url"
                required
                value={newUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="e.g. https://www.youtube.com/shorts/XqZsoesa55w କିମ୍ବା https://youtu.be/..."
                className="w-full px-4 py-2.5 rounded-2xl border-2 border-amber-300 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/50"
              />
              <p className="text-[10px] text-amber-800 font-semibold mt-1">
                💡 ଯେକୌଣସି YouTube Shorts (ଯଥା: ?si=... ଟ୍ରାକିଂ ଥିଲେ ମଧ୍ୟ) କିମ୍ବା ସାଧାରଣ YouTube ଭିଡିଓ ଲିଙ୍କ ଏଠାରେ ପେଷ୍ଟ୍ କରନ୍ତୁ।
              </p>
            </div>

            <div>
              <label className="block text-xs font-black text-amber-950 mb-1">
                🏷️ ଭିଡିଓ ଶୀର୍ଷକ (Video Title / Sacred Caption - <span className="text-amber-700 font-normal">Optional</span>):
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. ଶ୍ରୀ ଜଗନ୍ନାଥ ମହାପ୍ରଭୁଙ୍କ ସନ୍ଧ୍ୟା ଆରତୀ ଦର୍ଶନ 🚩"
                className="w-full px-4 py-2.5 rounded-2xl border-2 border-amber-300 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-amber-950 mb-1">
                  🏛️ ମନ୍ଦିର ନାମ (Temple Name - <span className="text-amber-700 font-normal">Optional</span>):
                </label>
                <input
                  type="text"
                  value={newTempleName}
                  onChange={(e) => setNewTempleName(e.target.value)}
                  placeholder="e.g. ଶ୍ରୀ ଜଗନ୍ନାଥ ମନ୍ଦିର, ପୁରୀ"
                  className="w-full px-3.5 py-2 rounded-xl border-2 border-amber-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-amber-950 mb-1">
                  🔗 ମନ୍ଦିର ବୁକିଂ ଲିଙ୍କ (Select Temple for Direct Booking - <span className="text-amber-700 font-normal">Optional</span>):
                </label>
                <select
                  value={newTempleId}
                  onChange={(e) => {
                    setNewTempleId(e.target.value);
                    const matched = temples.find((t) => t.id === e.target.value);
                    if (matched) setNewTempleName(matched.name);
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border-2 border-amber-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/50 cursor-pointer"
                >
                  <option value="">-- କୌଣସି ସଂଯୋଗ ନାହିଁ --</option>
                  {temples.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-amber-950 mb-1">
                📝 ସଂକ୍ଷିପ୍ତ ବିବରଣୀ (Short Description - <span className="text-amber-700 font-normal">Optional</span>):
              </label>
              <textarea
                rows={2}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="ଭିଡିଓ ସମ୍ବନ୍ଧରେ ୨ ଧାଡ଼ି ପବିତ୍ର ବାର୍ତ୍ତା (ଇଚ୍ଛାଧୀନ)..."
                className="w-full px-3.5 py-2 rounded-xl border-2 border-amber-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/50"
              />
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="flex flex-col items-center justify-center p-3 bg-slate-950 rounded-2xl border-2 border-amber-400 text-white min-h-[220px]">
            <span className="text-[10px] font-bold text-amber-400 uppercase mb-2 flex items-center gap-1">
              <Play className="w-3 h-3 text-rose-500" />
              <span>Live Embed Preview</span>
            </span>
            {previewId ? (
              <div className="w-full aspect-[9/16] max-h-52 rounded-xl overflow-hidden shadow-lg border border-amber-500/30">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${previewId}?autoplay=0`}
                  title="Short Preview"
                  className="w-full h-full object-cover"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            ) : (
              <div className="text-center p-4 space-y-2 text-slate-400">
                <Film className="w-10 h-10 mx-auto text-slate-600" />
                <p className="text-xs font-bold">YouTube URL ଦେଲେ ଏଠାରେ ପ୍ରିଭ୍ୟୁ ଦେଖାଯିବ</p>
              </div>
            )}
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-gradient-to-r from-rose-700 to-amber-700 hover:from-rose-800 hover:to-amber-800 text-white font-black rounded-2xl text-xs sm:text-sm shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>ସଂରକ୍ଷଣ ହେଉଛି...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>➕ ଭିଡିଓ ଯୋଡ଼ନ୍ତୁ (Add Short Video)</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* EXISTING SHORTS LIST */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-amber-950 text-base flex items-center gap-2">
            <Video className="w-5 h-5 text-amber-800" />
            <span>ବର୍ତ୍ତମାନର ସକ୍ରିୟ ଭିଡିଓ ତାଲିକା ({shorts.length} Active Shorts)</span>
          </h3>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white font-black rounded-xl text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5 text-amber-300" />
            <span>{isSaving ? 'ସେଭ୍ ହେଉଛି...' : '💾 ସେଭ୍ କରନ୍ତୁ'}</span>
          </button>
        </div>

        {shorts.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border-2 border-dashed border-amber-300 space-y-2">
            <p className="text-sm font-bold text-amber-900">କୌଣସି ଭିଡିଓ ନାହିଁ। ଉପର ଫର୍ମରୁ YouTube Short ଯୋଡ଼ନ୍ତୁ।</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shorts.map((short, idx) => {
              const videoId = extractYouTubeId(short.youtubeUrl);
              const thumbUrl = getYouTubeThumbnailUrl(short.youtubeUrl);

              return (
                <div
                  key={short.id || idx}
                  className="bg-white border-2 border-amber-300 rounded-3xl p-4 shadow-sm space-y-3 hover:border-amber-500 transition relative flex flex-col justify-between"
                >
                  {/* Top Badge & Delete Button */}
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-amber-100 text-amber-950 rounded-full text-[10px] font-black border border-amber-300">
                      #{idx + 1} SHORT
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteShort(short.id, e)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Delete Video"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Thumbnail / Video Preview */}
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-amber-200">
                    <img
                      src={thumbUrl}
                      alt={short.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg">
                        <Play className="w-5 h-5 ml-0.5" />
                      </div>
                    </div>
                    {videoId && (
                      <a
                        href={short.youtubeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-white text-[10px] rounded-lg font-bold flex items-center gap-1 hover:bg-rose-600 transition"
                      >
                        <span>YouTube</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {/* Editable Fields */}
                  <div className="space-y-2 text-left">
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900">🔗 YouTube URL</label>
                      <input
                        type="url"
                        value={short.youtubeUrl}
                        onChange={(e) => handleUpdateShortField(short.id, 'youtubeUrl', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 bg-amber-50/40"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-amber-900">🏷️ ଶୀର୍ଷକ (Title)</label>
                      <input
                        type="text"
                        value={short.title}
                        onChange={(e) => handleUpdateShortField(short.id, 'title', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 text-xs font-bold text-amber-950 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-amber-900">🏛️ ମନ୍ଦିର ନାମ (Temple)</label>
                      <input
                        type="text"
                        value={short.templeName || ''}
                        onChange={(e) => handleUpdateShortField(short.id, 'templeName', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 text-xs text-amber-900 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
