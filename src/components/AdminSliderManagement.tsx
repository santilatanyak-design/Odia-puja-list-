import React, { useState, useEffect } from 'react';
import { AdBanner, fetchAdBanners, saveAdBanners, deleteAdBanner } from '../lib/bannerApi';
import { S3PhotoUploader } from './S3PhotoUploader';
import { AdminAwsSettings } from './AdminAwsSettings';
import {
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Key,
  X,
  Radio,
  Layers,
  Info
} from 'lucide-react';

export const AdminSliderManagement: React.FC = () => {
  const [banners, setBanners] = useState<AdBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<AdBanner>>({
    platform: 'Amazon',
    url: '',
    title: '',
    subtitle: '',
    linkUrl: '',
  });

  // AWS S3 Keys Modal Trigger
  const [showAwsSettingsModal, setShowAwsSettingsModal] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    setLoading(true);
    try {
      const data = await fetchAdBanners();
      setBanners(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load banners from AWS:', err);
      setBanners([]);
      showNotification('Could not load banners from AWS backend.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 5000);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      id: `banner_${Date.now()}`,
      url: '',
      title: '',
      subtitle: '',
      linkUrl: '',
      platform: 'Amazon',
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (banner: AdBanner) => {
    setEditingId(banner.id);
    setFormData({
      id: banner.id,
      url: banner.url,
      title: banner.title,
      subtitle: banner.subtitle || '',
      linkUrl: banner.linkUrl,
      platform: banner.platform || 'Amazon',
      createdAt: banner.createdAt,
    });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({
      platform: 'Amazon',
      url: '',
      title: '',
      subtitle: '',
      linkUrl: '',
    });
  };

  const handleDelete = async (id: string, title: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete the ad banner "${title || 'Untitled'}" from AWS database and S3 storage?\n\nThis will remove it from the frontend product feed.`
    );
    if (!confirmed) return;

    setDeletingId(id);
    try {
      const success = await deleteAdBanner(id, banners);
      if (success) {
        showNotification(`✅ Banner was permanently deleted from AWS database and S3.`, 'success');
        setBanners(prev => prev.filter(b => b.id !== id));
        if (editingId === id) {
          handleCloseForm();
        }
        await loadBanners();
      } else {
        showNotification('Failed to delete banner from AWS backend.', 'error');
      }
    } catch (err: any) {
      console.error('Error deleting banner:', err);
      showNotification(`Error: ${err.message || 'Failed to delete banner'}`, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.url?.trim()) {
      alert('Please upload a 16:9 banner image using the AWS S3 Uploader.');
      return;
    }
    if (!formData.title?.trim()) {
      alert('Please enter a banner Title / Headline.');
      return;
    }
    if (!formData.linkUrl?.trim()) {
      alert('Please enter an Affiliate Target Link URL for the Grab Deal button.');
      return;
    }

    setSaving(true);
    try {
      const bannerId = editingId || formData.id || `banner_${Date.now()}`;
      const bannerPayload: AdBanner = {
        id: bannerId,
        url: formData.url.trim(),
        title: formData.title.trim(),
        subtitle: formData.subtitle?.trim() || '',
        linkUrl: formData.linkUrl.trim(),
        platform: formData.platform || 'Amazon',
        createdAt: formData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const existingIndex = banners.findIndex(b => b.id === bannerId);
      let updatedBanners = [...banners];
      if (existingIndex >= 0) {
        updatedBanners[existingIndex] = bannerPayload;
      } else {
        updatedBanners.unshift(bannerPayload);
      }

      const success = await saveAdBanners(updatedBanners);
      if (success) {
        showNotification(
          editingId
            ? `✅ Successfully updated ad banner "${bannerPayload.title}" in AWS!`
            : `✅ Successfully created and published new ad banner to AWS!`,
          'success'
        );
        handleCloseForm();
        await loadBanners();
      } else {
        showNotification('Failed to save banner to AWS. Please check AWS connection.', 'error');
      }
    } catch (err: any) {
      console.error('Error saving banner to AWS:', err);
      showNotification(`Error: ${err.message || 'Failed to save banner'}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Control Bar */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5" />
            <span>Monetization & Ads</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Inline Ad Banners Manager
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl leading-relaxed">
            Promotional affiliate banners dynamically injected between product catalog rows (every 6th item). All images are stored on AWS S3 with an enforced 16:9 aspect ratio.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowAwsSettingsModal(true)}
            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            title="Configure AWS S3 Bucket Credentials"
          >
            <Key className="w-4 h-4 text-amber-400" />
            <span>AWS S3 Keys</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Ad Banner</span>
          </button>
        </div>
      </div>

      {/* Status Notifications */}
      {statusMsg && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${
            statusMsg.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <p className="text-xs sm:text-sm font-bold tracking-wide">{statusMsg.text}</p>
        </div>
      )}

      {/* Add / Edit Banner Form */}
      {isFormOpen && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
            <div>
              <h3 className="text-xl font-black text-slate-900">
                {editingId ? 'Edit Ad Banner' : 'Create New Ad Banner'}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Upload image to AWS S3. Will render with a 16:9 aspect ratio and Grab Deal button.
              </p>
            </div>
            <button
              onClick={handleCloseForm}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: S3 File Upload with Enforced 16:9 UI Preview */}
              <div className="space-y-3">
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                  Banner Image (Upload directly to AWS S3) *
                </label>
                
                {/* 16:9 Aspect Ratio UI Preview Container */}
                <div className="w-full aspect-video rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 overflow-hidden relative flex items-center justify-center group shadow-inner">
                  {formData.url ? (
                    <>
                      <img
                        src={formData.url}
                        alt="16:9 Banner Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-xs text-amber-400 text-[10px] font-black px-2 py-0.5 rounded-md">
                        16:9 Enforced
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-6 text-slate-400 flex flex-col items-center">
                      <ImageIcon className="w-10 h-10 mb-2 opacity-50 text-slate-500" />
                      <p className="text-xs font-bold text-slate-600">16:9 Banner Aspect Ratio</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Upload banner via file picker below (Recommended: 1200x675 or 1920x1080)
                      </p>
                    </div>
                  )}
                </div>

                {/* Real File Upload to S3 */}
                <div className="pt-2">
                  <S3PhotoUploader
                    folder="banners"
                    aspectRatio="16:9"
                    label="Upload 16:9 Banner to AWS S3"
                    onUploadSuccess={(uploadedUrl) => {
                      setFormData(prev => ({ ...prev, url: uploadedUrl }));
                      showNotification('✅ 16:9 Banner uploaded successfully to AWS S3!', 'success');
                    }}
                  />
                </div>

                {/* Direct URL input fallback */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Or direct image URL:
                  </label>
                  <input
                    type="url"
                    value={formData.url || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://bucket.s3.region.amazonaws.com/banners/..."
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Right Column: Banner Metadata & Links */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                    Platform *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Amazon', 'Flipkart', 'Meesho', 'Myntra', 'Brand Store', 'Other'].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, platform: p as any }))}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          formData.platform === p
                            ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
                    Headline / Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Grand Navratri Puja Utensils & Brass Idols"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
                    Subtitle / Promotional Highlights (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                    placeholder="e.g., Handcrafted pure brass items direct from verified artisans"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
                    Affiliate Target URL (Grab Deal Destination) *
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.linkUrl || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, linkUrl: e.target.value }))}
                    placeholder="https://amzn.to/... or https://fkrt.it/..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    When users click "Grab Deal" under this banner, they are redirected through this tracking link.
                  </p>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseForm}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Saving to AWS...</span>
                  </>
                ) : (
                  <span>{editingId ? 'Update Ad Banner' : 'Save Ad Banner to AWS'}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Banner List Table / Cards */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-black text-slate-900">Live Ad Banners in AWS</h3>
            <span className="text-xs font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full">
              {banners.length} {banners.length === 1 ? 'Banner' : 'Banners'}
            </span>
          </div>
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Injected every 6th item across the product grid
          </span>
        </div>

        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-3" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Loading Banners from AWS S3...
            </p>
          </div>
        ) : banners.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
              <ImageIcon className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-black text-slate-900 mb-2">No ad banners available to manage</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
              Your AWS banner database is empty. Click "Add New Ad Banner" above to upload promotional 16:9 banners directly to AWS S3.
            </p>
            <button
              onClick={handleOpenAdd}
              className="px-6 py-2.5 bg-slate-950 text-white hover:bg-slate-800 rounded-full text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Your First Ad Banner</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {banners.map((banner, index) => (
              <div
                key={banner.id || index}
                className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 hover:bg-slate-50/80 transition-colors"
              >
                {/* Banner Thumbnail (16:9 Enforced) */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-32 sm:w-44 aspect-video rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative group">
                    <img
                      src={banner.url}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      16:9
                    </div>
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-slate-900 text-amber-400 px-2 py-0.5 rounded">
                        {banner.platform || 'Amazon'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-bold">
                        Banner #{index + 1}
                      </span>
                    </div>

                    <h4 className="text-sm sm:text-base font-black text-slate-900 truncate">
                      {banner.title}
                    </h4>

                    {banner.subtitle && (
                      <p className="text-xs text-slate-500 truncate max-w-md">
                        {banner.subtitle}
                      </p>
                    )}

                    <div className="pt-1">
                      <a
                        href={banner.linkUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-900"
                      >
                        <span>Affiliate Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Action Buttons: Edit & Real Delete from AWS */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleOpenEdit(banner)}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Edit Banner"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    disabled={deletingId === banner.id}
                    onClick={() => handleDelete(banner.id, banner.title)}
                    className="p-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="Delete Permanently from AWS"
                  >
                    {deletingId === banner.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AWS S3 Settings Modal */}
      {showAwsSettingsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-black text-slate-900">AWS S3 Configuration</h3>
              </div>
              <button
                onClick={() => setShowAwsSettingsModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <AdminAwsSettings />

            <div className="mt-6 pt-4 border-t border-slate-100 text-right">
              <button
                onClick={() => setShowAwsSettingsModal(false)}
                className="px-5 py-2.5 bg-slate-950 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
