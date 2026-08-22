import React, { useState, useEffect } from 'react';
import { HomeSliderConfig, SliderImage, PuriStoreConfig, PuriStoreProduct } from '../types';
import {
  getHomeSliderConfig,
  updateHomeSliderConfig,
  subscribeHomeSliderConfig,
  DEFAULT_HOME_SLIDER_CONFIG,
  getPuriStoreConfig,
  updatePuriStoreConfig,
  subscribePuriStoreConfig,
  DEFAULT_PURI_STORE_CONFIG
} from '../lib/api';
import { showCustomAlert } from '../lib/customAlert';
import {
  Sliders,
  Plus,
  Trash2,
  Save,
  ShoppingBag,
  CheckCircle2,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Layers,
  Image as ImageIcon
} from 'lucide-react';

export const AdminSliderManagement: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'slider' | 'store'>('slider');

  // Slider State
  const [sliderImages, setSliderImages] = useState<SliderImage[]>([]);
  const [slideInterval, setSlideInterval] = useState<number>(5);
  const [savingSlider, setSavingSlider] = useState(false);
  const [sliderSuccessMsg, setSliderSuccessMsg] = useState('');

  // Store Products State
  const [storeProducts, setStoreProducts] = useState<PuriStoreProduct[]>([]);
  const [storeTitle, setStoreTitle] = useState(DEFAULT_PURI_STORE_CONFIG.title || '');
  const [storeSubtitle, setStoreSubtitle] = useState(DEFAULT_PURI_STORE_CONFIG.subtitle || '');
  const [savingStore, setSavingStore] = useState(false);
  const [storeSuccessMsg, setStoreSuccessMsg] = useState('');

  useEffect(() => {
    const unsubSlider = subscribeHomeSliderConfig((config) => {
      setSliderImages(Array.isArray(config.images) ? config.images : []);
      setSlideInterval(config.autoSlideIntervalSeconds || 5);
    });

    const unsubStore = subscribePuriStoreConfig((config) => {
      setStoreProducts(Array.isArray(config.products) ? config.products : []);
      setStoreTitle(config.title || DEFAULT_PURI_STORE_CONFIG.title || '');
      setStoreSubtitle(config.subtitle || DEFAULT_PURI_STORE_CONFIG.subtitle || '');
    });

    return () => {
      unsubSlider();
      unsubStore();
    };
  }, []);

  // --- SLIDER ACTIONS ---
  const handleSliderChange = (index: number, field: keyof SliderImage, value: string) => {
    setSliderImages((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddSliderImage = () => {
    if (sliderImages.length >= 6) {
      showCustomAlert('ଆପଣ ସର୍ବାଧିକ ୬ଟି ସ୍ଲାଇଡର୍ ଛବି ଯୋଡ଼ିପାରିବେ। (Maximum 6 images allowed)');
      return;
    }
    const newImg: SliderImage = {
      id: 'slide-' + Date.now(),
      url: '',
      title: '',
      subtitle: '',
    };
    setSliderImages((prev) => [...prev, newImg]);
  };

  const handleDeleteSliderImage = (index: number) => {
    setSliderImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveSlider = async () => {
    // Filter out completely empty items or validate
    const validImages = sliderImages.filter(img => img.url && img.url.trim().length > 0);

    try {
      setSavingSlider(true);
      await updateHomeSliderConfig({
        autoSlideIntervalSeconds: slideInterval,
        images: validImages.map((img, idx) => ({
          id: img.id || `slide-${idx + 1}`,
          url: img.url.trim(),
          title: img.title?.trim() || '',
          subtitle: img.subtitle?.trim() || '',
          linkUrl: img.linkUrl?.trim() || '',
        })),
      });

      setSliderSuccessMsg(
        validImages.length > 0
          ? '✅ ହୋମ୍ ସ୍ଲାଇଡର୍ ବ୍ୟାନର୍ Firebase ରେ ସଫଳତାର ସହ ସେଭ୍ ହେଲା!'
          : '✅ ସମସ୍ତ ସ୍ଲାଇଡର୍ ଛବି ଖାଲି କରାଗଲା। ହୋମ୍ ପେଜ୍ ରେ ମୂଳ ସ୍ଥିର ଟିଭି ବ୍ୟାନର୍ ଦେଖାଯିବ।'
      );
      setTimeout(() => setSliderSuccessMsg(''), 5000);
    } catch (err) {
      console.error('Error saving slider:', err);
      showCustomAlert('ସ୍ଲାଇଡର୍ ସେଭ୍ କରିବାରେ ତ୍ରୁଟି ହେଲା।');
    } finally {
      setSavingSlider(false);
    }
  };

  // --- STORE ACTIONS ---
  const handleStoreProductChange = (index: number, field: keyof PuriStoreProduct, value: string) => {
    setStoreProducts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddStoreProduct = () => {
    const newProd: PuriStoreProduct = {
      id: 'prod-' + Date.now(),
      name: '',
      nameEng: '',
      photoUrl: '',
      buyLink: '',
      tag: '',
    };
    setStoreProducts((prev) => [...prev, newProd]);
  };

  const handleDeleteStoreProduct = (index: number) => {
    setStoreProducts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveStore = async () => {
    const validProducts = storeProducts.filter(
      p => p.name?.trim() && p.photoUrl?.trim() && p.buyLink?.trim()
    );

    try {
      setSavingStore(true);
      await updatePuriStoreConfig({
        enabled: true,
        title: storeTitle.trim(),
        subtitle: storeSubtitle.trim(),
        products: validProducts.map((p, idx) => ({
          id: p.id || `prod-${idx + 1}`,
          name: p.name.trim(),
          nameEng: p.nameEng?.trim() || '',
          photoUrl: p.photoUrl.trim(),
          buyLink: p.buyLink.trim(),
          tag: p.tag?.trim() || '',
        })),
      });

      setStoreSuccessMsg(
        validProducts.length > 0
          ? '✅ ପୁରୀ ଅନଲାଇନ୍ ଷ୍ଟୋର୍ (Puri Online Store) Firebase ରେ ସଫଳତାର ସହ ସେଭ୍ ହେଲା!'
          : '✅ ସମସ୍ତ ଷ୍ଟୋର୍ ସାମଗ୍ରୀ ଖାଲି କରାଗଲା। ପୁରୀ ସେକ୍ସନରୁ ଷ୍ଟୋର୍ କାର୍ଡ ଲୁଚିରହିବ।'
      );
      setTimeout(() => setStoreSuccessMsg(''), 5000);
    } catch (err) {
      console.error('Error saving store config:', err);
      showCustomAlert('ଷ୍ଟୋର୍ ସେଭ୍ କରିବାରେ ତ୍ରୁଟି ହେଲା।');
    } finally {
      setSavingStore(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 border border-amber-300 shadow-xs space-y-6">
      {/* Top Switcher Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-amber-200">
        <div className="flex items-center gap-2 bg-amber-50 p-1.5 rounded-2xl border border-amber-200">
          <button
            type="button"
            onClick={() => setActiveSection('slider')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 ${
              activeSection === 'slider'
                ? 'bg-gradient-to-r from-[#8B0000] to-[#701a1e] text-white shadow-xs'
                : 'text-slate-700 hover:text-[#8B0000] hover:bg-amber-100/60'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>୧. ହୋମ୍ ସ୍ଲାଇଡର୍ (3-Image Auto Slider)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('store')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 ${
              activeSection === 'store'
                ? 'bg-gradient-to-r from-[#8B0000] to-[#701a1e] text-white shadow-xs'
                : 'text-slate-700 hover:text-[#8B0000] hover:bg-amber-100/60'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>୨. ପୁରୀ ଷ୍ଟୋର୍ ସାମଗ୍ରୀ (Puri Store Products)</span>
          </button>
        </div>

        <div className="text-[11px] font-bold text-amber-900 bg-amber-100/80 px-3 py-1.5 rounded-xl border border-amber-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          <span>Real-Time Firebase Sync</span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECTION 1: 3-IMAGE AUTO-SLIDER BANNER MANAGEMENT               */}
      {/* ============================================================== */}
      {activeSection === 'slider' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <span>ହୋମ୍ ପେଜ୍ ୩-ଇମେଜ୍ ଅଟୋ-ସ୍ଲାଇଡର୍ ବ୍ୟାନର୍</span>
                <span className="px-2 py-0.5 bg-amber-100 text-[#8B0000] rounded-full text-xs font-black">
                  {sliderImages.length} ଟି ଛବି (5s Auto)
                </span>
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                ହୋମ୍ ପେଜ୍ ବ୍ୟାନର୍ ପାଇଁ Banner Image URLs, ଶୀର୍ଷକ ଓ ସ୍ଲାଇଡ୍ ସମୟ ଏଡିଟ୍ କରନ୍ତୁ।
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAddSliderImage}
                type="button"
                className="px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer border border-amber-300"
              >
                <Plus className="w-4 h-4" />
                <span>ନୂଆ ଛବି ଯୋଡ଼ନ୍ତୁ (+ Add Image)</span>
              </button>

              <button
                onClick={handleSaveSlider}
                disabled={savingSlider}
                type="button"
                className="px-5 py-2 bg-gradient-to-r from-[#8B0000] to-[#701a1e] hover:from-[#a00000] hover:to-[#8B0000] text-amber-100 hover:text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{savingSlider ? 'ସେଭ୍ ହେଉଛି...' : 'ସ୍ଲାଇଡର୍ ସେଭ୍ କରନ୍ତୁ'}</span>
              </button>
            </div>
          </div>

          {sliderSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 border-2 border-emerald-400 rounded-2xl text-emerald-950 text-xs font-black flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{sliderSuccessMsg}</span>
            </div>
          )}

          {/* Slide Timing Settings */}
          <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">⏱️</span>
              <div>
                <div className="text-xs font-black text-amber-950">
                  ଅଟୋ-ସ୍ଲାଇଡ୍ ସମୟ ବ୍ୟବଧାନ (Slide Interval):
                </div>
                <div className="text-[11px] text-amber-900/80 font-medium">
                  ପ୍ରତ୍ୟେକ ସ୍ଲାଇଡ୍ କେତେ ସେକେଣ୍ଡ ପରେ ସ୍ୱୟଂଚାଳିତ ଭାବେ ବଦଳିବ
                </div>
              </div>
            </div>

            <select
              value={slideInterval}
              onChange={(e) => setSlideInterval(Number(e.target.value))}
              className="px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-black text-amber-950 shadow-xs focus:ring-2 focus:ring-amber-500"
            >
              <option value={3}>୩ ସେକେଣ୍ଡ (3s Fast)</option>
              <option value={5}>୫ ସେକେଣ୍ଡ (5s Recommended)</option>
              <option value={7}>୭ ସେକେଣ୍ଡ (7s Normal)</option>
              <option value={10}>୧୦ ସେକେଣ୍ଡ (10s Slow)</option>
            </select>
          </div>

          {/* Slider Image URLs Inputs or Empty State */}
          {sliderImages.length === 0 ? (
            <div className="py-12 px-4 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 space-y-3">
              <ImageIcon className="w-10 h-10 text-slate-400 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-700">
                  ବର୍ତ୍ତମାନ କୌଣସି ସ୍ଲାଇଡର୍ ଛବି ନାହିଁ (No Custom Slider Images)
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  ଯେପର୍ଯ୍ୟନ୍ତ ଆପଣ ଏଠାରେ ଛବି ଯୋଡ଼ିନାହାନ୍ତି, ହୋମ୍ ପେଜ୍ ରେ ଆପଣଙ୍କ ମୂଳ ସ୍ଥିର ଟିଭି ବ୍ୟାନର୍ ଦେଖାଯିବ।
                </p>
              </div>
              <button
                onClick={handleAddSliderImage}
                type="button"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ ପ୍ରଥମ ସ୍ଲାଇଡର୍ ଛବି ଯୋଡ଼ନ୍ତୁ</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {sliderImages.map((img, index) => (
                <div
                  key={img.id || index}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-amber-400 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-xs sm:text-sm font-black text-slate-900">
                        ସ୍ଲାଇଡ୍ ବ୍ୟାନର୍ #{index + 1} (Banner Slide {index + 1})
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteSliderImage(index)}
                      className="p-1.5 text-rose-600 hover:text-white hover:bg-rose-600 rounded-lg transition cursor-pointer flex items-center gap-1 text-xs font-bold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ଡିଲିଟ୍</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                    <div className="md:col-span-3 h-28 w-full rounded-xl overflow-hidden bg-slate-200 border border-slate-300 relative shadow-inner flex items-center justify-center">
                      {img.url ? (
                        <img
                          src={img.url}
                          alt={`Slide ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="text-center p-2 text-slate-400 text-[11px] font-bold">
                          ଫଟୋ URL ଦିଅନ୍ତୁ
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-9 space-y-2">
                      <div>
                        <label className="block text-[11px] font-black text-slate-700 mb-1">
                          ବ୍ୟାନର୍ ଇମେଜ୍ URL (Banner Image URL): <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="url"
                          value={img.url}
                          onChange={(e) => handleSliderChange(index, 'url', e.target.value)}
                          placeholder="https://example.com/slide-image.jpg"
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-black text-slate-700 mb-1">
                            ଶୀର୍ଷକ (Banner Title):
                          </label>
                          <input
                            type="text"
                            value={img.title || ''}
                            onChange={(e) => handleSliderChange(index, 'title', e.target.value)}
                            placeholder="e.g. Bhakti Ananda Odia TV"
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-black text-slate-700 mb-1">
                            ଉପ-ଶୀର୍ଷକ (Banner Subtitle):
                          </label>
                          <input
                            type="text"
                            value={img.subtitle || ''}
                            onChange={(e) => handleSliderChange(index, 'subtitle', e.target.value)}
                            placeholder="e.g. Your Devotion, Our Service"
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleSaveSlider}
              disabled={savingSlider}
              type="button"
              className="px-6 py-2.5 bg-gradient-to-r from-[#8B0000] to-[#701a1e] hover:from-[#a00000] hover:to-[#8B0000] text-amber-100 hover:text-white rounded-xl text-xs font-black flex items-center gap-2 transition shadow-md cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{savingSlider ? 'ସେଭ୍ ହେଉଛି...' : 'ସ୍ଲାଇଡର୍ ସେଭ୍ କରନ୍ତୁ (Save Slider to Firebase)'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 2: PURI ONLINE STORE PRODUCTS MANAGEMENT               */}
      {/* ============================================================== */}
      {activeSection === 'store' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <span>ପୁରୀ ଅନଲାଇନ୍ ଷ୍ଟୋର୍ ସାମଗ୍ରୀ (Puri Online Store Products)</span>
                <span className="px-2 py-0.5 bg-amber-100 text-[#8B0000] rounded-full text-xs font-black">
                  {storeProducts.length} ଟି ସାମଗ୍ରୀ
                </span>
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                ପ୍ରତ୍ୟେକ ସାମଗ୍ରୀର 'Product Name', 'Photo URL', ଏବଂ 'Buy Link' ସହଜରେ ପରିଚାଳନା କରନ୍ତୁ।
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAddStoreProduct}
                type="button"
                className="px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer border border-amber-300"
              >
                <Plus className="w-4 h-4" />
                <span>ନୂଆ ସାମଗ୍ରୀ ଯୋଡ଼ନ୍ତୁ (+ Add Product)</span>
              </button>

              <button
                onClick={handleSaveStore}
                disabled={savingStore}
                type="button"
                className="px-5 py-2 bg-gradient-to-r from-[#8B0000] to-[#701a1e] hover:from-[#a00000] hover:to-[#8B0000] text-amber-100 hover:text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{savingStore ? 'ସେଭ୍ ହେଉଛି...' : 'ଷ୍ଟୋର୍ ସେଭ୍ କରନ୍ତୁ'}</span>
              </button>
            </div>
          </div>

          {storeSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 border-2 border-emerald-400 rounded-2xl text-emerald-950 text-xs font-black flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{storeSuccessMsg}</span>
            </div>
          )}

          {/* Store Title / Subtitle Headers */}
          <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-black text-amber-950 mb-1">
                ଷ୍ଟୋର୍ ମୁଖ୍ୟ ଶୀର୍ଷକ (Store Header Title):
              </label>
              <input
                type="text"
                value={storeTitle}
                onChange={(e) => setStoreTitle(e.target.value)}
                placeholder="e.g. ଶ୍ରୀକ୍ଷେତ୍ର ପୁରୀ ଅନଲାଇନ୍ ଷ୍ଟୋର୍ (Online Store)"
                className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-amber-950 mb-1">
                ଷ୍ଟୋର୍ ଉପ-ଶୀର୍ଷକ (Store Subtitle):
              </label>
              <input
                type="text"
                value={storeSubtitle}
                onChange={(e) => setStoreSubtitle(e.target.value)}
                placeholder="e.g. ପ୍ରଭୁ ଶ୍ରୀ ଜଗନ୍ନାଥଙ୍କ ପବିତ୍ର ପୂଜା ସାମଗ୍ରୀ ଓ ଆଧ୍ୟାତ୍ମିକ ଉପହାର"
                className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Store Product Items List with Inputs: Product Name, Photo URL, Buy Link */}
          {storeProducts.length === 0 ? (
            <div className="py-12 px-4 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 space-y-3">
              <ShoppingBag className="w-10 h-10 text-slate-400 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-700">
                  ବର୍ତ୍ତମାନ କୌଣସି ଷ୍ଟୋର୍ ସାମଗ୍ରୀ ନାହିଁ (No Store Products)
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  ଯେପର୍ଯ୍ୟନ୍ତ ଆପଣ ଏଠାରେ ସାମଗ୍ରୀ ଯୋଡ଼ିନାହାନ୍ତି, ପୁରୀ ସେକ୍ସନରେ ଷ୍ଟୋର୍ କାର୍ଡ ଲୁଚିରହିବ (Hidden from public UI)।
                </p>
              </div>
              <button
                onClick={handleAddStoreProduct}
                type="button"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ ପ୍ରଥମ ପୂଜା ସାମଗ୍ରୀ ଯୋଡ଼ନ୍ତୁ</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {storeProducts.map((prod, index) => (
                <div
                  key={prod.id || index}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-amber-400 transition-all space-y-3 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-xs sm:text-sm font-black text-slate-900">
                        ସାମଗ୍ରୀ #{index + 1}: {prod.name || 'Untitled Item'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {prod.buyLink && (
                        <a
                          href={prod.buyLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-[11px] font-bold flex items-center gap-1 transition"
                          title="ଲିଙ୍କ୍ ଟେଷ୍ଟ କରନ୍ତୁ"
                        >
                          <span>ଲିଙ୍କ୍ ଟେଷ୍ଟ</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteStoreProduct(index)}
                        className="p-1 text-rose-600 hover:text-white hover:bg-rose-600 rounded-lg transition cursor-pointer flex items-center gap-1 text-xs font-bold"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>ଡିଲିଟ୍</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                    {/* Photo Preview Thumbnail */}
                    <div className="md:col-span-3 h-32 w-full rounded-xl overflow-hidden bg-slate-200 border border-slate-300 relative shadow-inner flex items-center justify-center">
                      {prod.photoUrl ? (
                        <img
                          src={prod.photoUrl}
                          alt={prod.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="text-center p-2 text-slate-400 text-[11px] font-bold">
                          ଫଟୋ URL ଦିଅନ୍ତୁ
                        </div>
                      )}
                      {prod.tag && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/75 text-amber-200 text-[9px] font-black rounded-md">
                          {prod.tag}
                        </span>
                      )}
                    </div>

                    {/* 3 Explicit Input Fields: Product Name, Photo URL, Buy Link */}
                    <div className="md:col-span-9 space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-black text-slate-700 mb-1">
                            ୧. ସାମଗ୍ରୀର ନାମ (Product Name): <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={prod.name}
                            onChange={(e) => handleStoreProductChange(index, 'name', e.target.value)}
                            placeholder="e.g. ପ୍ରଭୁ ଶ୍ରୀ ଜଗନ୍ନାଥ କାଠ ମୂର୍ତ୍ତି"
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-black text-slate-700 mb-1">
                            ୨. ଇଂରାଜୀ ନାମ / ବିବରଣୀ (Optional English Name):
                          </label>
                          <input
                            type="text"
                            value={prod.nameEng || ''}
                            onChange={(e) => handleStoreProductChange(index, 'nameEng', e.target.value)}
                            placeholder="e.g. Lord Jagannath Neem Wood Idol"
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-black text-slate-700 mb-1">
                          ୩. ଫଟୋ URL (Photo URL): <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="url"
                          value={prod.photoUrl}
                          onChange={(e) => handleStoreProductChange(index, 'photoUrl', e.target.value)}
                          placeholder="https://example.com/product-photo.jpg"
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <div className="sm:col-span-9">
                          <label className="block text-[11px] font-black text-slate-700 mb-1">
                            ୪. କିଣିବା ଲିଙ୍କ୍ (Buy Link - Direct Redirect URL): <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="url"
                            value={prod.buyLink}
                            onChange={(e) => handleStoreProductChange(index, 'buyLink', e.target.value)}
                            placeholder="https://example.com/buy-now-link"
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-amber-500"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[11px] font-black text-slate-700 mb-1">
                            ଟ୍ୟାଗ୍ (Tag):
                          </label>
                          <input
                            type="text"
                            value={prod.tag || ''}
                            onChange={(e) => handleStoreProductChange(index, 'tag', e.target.value)}
                            placeholder="e.g. ଶ୍ରୀକ୍ଷେତ୍ର ସ୍ପେଶାଲ୍"
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleSaveStore}
              disabled={savingStore}
              type="button"
              className="px-6 py-2.5 bg-gradient-to-r from-[#8B0000] to-[#701a1e] hover:from-[#a00000] hover:to-[#8B0000] text-amber-100 hover:text-white rounded-xl text-xs font-black flex items-center gap-2 transition shadow-md cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{savingStore ? 'ସେଭ୍ ହେଉଛି...' : 'ଷ୍ଟୋର୍ ସାମଗ୍ରୀ ସେଭ୍ କରନ୍ତୁ (Save Store to Firebase)'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
