import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Plus, 
  Tag, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Trash2, 
  Edit3, 
  Youtube, 
  ExternalLink, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  PackageOpen,
  RefreshCw,
  X,
  Layers,
  ArrowRight,
  Cloud
} from 'lucide-react';
import { 
  AffiliateProduct, 
  saveAffiliateProduct, 
  updateAffiliateProduct, 
  fetchAffiliateProducts, 
  deleteAffiliateProduct 
} from '../lib/affiliateApi';
import { S3PhotoUploader } from './S3PhotoUploader';
import { AdminAwsSettings } from './AdminAwsSettings';
import { getClientAwsConfig } from '../lib/s3Upload';
import { autoPublishDealHtmlToS3, bulkPublishAllDealsToS3 } from '../lib/publishDealHtml';
import { triggerAmplifyRebuild } from '../lib/s3Upload';
import { ShareButton } from './ShareButton';

export function AdminAffiliateManagement() {
  // 1. STRICT PURE DYNAMIC STATE: zero demo arrays or placeholder items
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showAwsModal, setShowAwsModal] = useState<boolean>(false);
  const [syncingOgMeta, setSyncingOgMeta] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<string | null>(null);

  const awsConfig = getClientAwsConfig();

  // Form State
  const [formData, setFormData] = useState<Partial<AffiliateProduct>>({
    platform: 'Amazon',
    isFeatured: false,
    category: 'Spiritual & Puja',
  });

  // 2. FETCH LIVE PRODUCTS DIRECTLY FROM AWS DATABASE
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await fetchAffiliateProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load products from AWS:', err);
      setProducts([]);
      showNotification('Could not load products from AWS backend.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 5000);
  };

  // Open "Add New Product" form
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      id: `prod_${Date.now()}`,
      title: '',
      description: '',
      imageUrl: '',
      affiliateUrl: '',
      platform: 'Amazon',
      youtubeUrl: '',
      category: 'Spiritual & Puja',
      isFeatured: false,
    });
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open "Edit Product" form (Populate with current details)
  const handleOpenEdit = (product: AffiliateProduct) => {
    setEditingId(product.id);
    setFormData({
      id: product.id,
      title: product.title,
      description: product.description || '',
      imageUrl: product.imageUrl,
      affiliateUrl: product.affiliateUrl,
      platform: product.platform || 'Amazon',
      youtubeUrl: product.youtubeUrl || '',
      category: product.category || 'Spiritual & Puja',
      isFeatured: Boolean(product.isFeatured),
      createdAt: product.createdAt,
    });
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cancel edit / creation
  const handleCancelForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      platform: 'Amazon',
      isFeatured: false,
      category: 'Spiritual & Puja',
    });
  };

  // DELETE FUNCTIONALITY: Confirmation prompt + real DELETE HTTP request to AWS backend & S3
  const handleDelete = async (id: string, title: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${title}" from AWS database and S3 storage?\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(id);
    try {
      const success = await deleteAffiliateProduct(id);
      if (success) {
        showNotification(`✅ "${title}" was permanently deleted from AWS database and S3.`, 'success');
        // Instantly update local list and re-sync from AWS
        setProducts(prev => prev.filter(p => p.id !== id));
        if (editingId === id) {
          handleCancelForm();
        }
        await loadProducts();
      } else {
        showNotification(`Failed to delete product from AWS backend. Check network connection.`, 'error');
      }
    } catch (err: any) {
      console.error('Error deleting product from AWS:', err);
      showNotification(`Error: ${err.message || 'Failed to delete product'}`, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // SAVE FUNCTIONALITY: Real HTTP POST (Create) or PUT/PATCH (Update) to AWS backend
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      alert('Please enter the Product Title.');
      return;
    }
    if (!formData.imageUrl?.trim()) {
      alert('Please upload a Product Image using the AWS S3 uploader.');
      return;
    }
    if (!formData.affiliateUrl?.trim()) {
      alert('Please provide the Affiliate tracking URL.');
      return;
    }

    setSaving(true);
    try {
      const isUpdate = Boolean(editingId);
      const productId = editingId || formData.id || `prod_${Date.now()}`;

      const productPayload: AffiliateProduct = {
        id: productId,
        title: formData.title.trim(),
        description: formData.description?.trim() || '',
        imageUrl: formData.imageUrl.trim(),
        affiliateUrl: formData.affiliateUrl.trim(),
        platform: (formData.platform as any) || 'Amazon',
        youtubeUrl: formData.youtubeUrl?.trim() || '',
        category: formData.category?.trim() || 'Spiritual & Puja',
        isFeatured: Boolean(formData.isFeatured),
        inStock: true,
        createdAt: formData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      let success = false;
      if (isUpdate) {
        // Trigger real PUT HTTP request to AWS to update specific product
        success = await updateAffiliateProduct(productId, productPayload);
      } else {
        // Trigger real POST HTTP request to AWS to create new product
        success = await saveAffiliateProduct(productPayload);
      }

      if (success) {
        // Automatically publish static HTML to AWS S3 so WhatsApp & Facebook scrapers show the original photo & title
        try {
          await autoPublishDealHtmlToS3(productPayload);
          triggerAmplifyRebuild();
        } catch (publishErr) {
          console.warn('Auto publish deal HTML notice:', publishErr);
        }

        showNotification(
          isUpdate 
            ? `✅ "${productPayload.title}" ସଫଳତାର ସହ AWS database ଓ S3 ରେ ଅପଡେଟ୍ ହେଲା ଏବଂ Social Media Share ପାଇଁ ସ୍ୱୟଂକ୍ରିୟ ଭାବେ ଅରିଜିନାଲ୍ ଫଟୋ ସହ ପ୍ରସ୍ତୁତ ହେଲା!` 
            : `✅ "${productPayload.title}" ସଫଳତାର ସହ AWS S3 ରେ ପ୍ରକାଶିତ ହେଲା ଏବଂ Social Media Share ରେ ଅରିଜିନାଲ୍ ଫଟୋ ସହ ଦେଖାଯିବ!`,
          'success'
        );
        handleCancelForm();
        await loadProducts();
      } else {
        showNotification(`Failed to save to AWS backend. Please try again.`, 'error');
      }
    } catch (err: any) {
      console.error('Error saving product to AWS:', err);
      showNotification(`Error: ${err.message || 'Failed to save product'}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Bulk sync all deals to S3 static HTML with exact OG Meta tags
  const handleSyncSocialOgMeta = async () => {
    if (products.length === 0) {
      showNotification('କୌଣସି ପ୍ରଡକ୍ଟ ଉପଲବ୍ଧ ନାହିଁ। ପ୍ରଥମେ ନୂତନ ପ୍ରଡକ୍ଟ ଯୋଡ଼ନ୍ତୁ।', 'error');
      return;
    }
    setSyncingOgMeta(true);
    setSyncProgress('ପ୍ରଡକ୍ଟ ଗୁଡ଼ିକ AWS S3 ରେ ସିଙ୍କ୍ ହେଉଛି...');
    try {
      const result = await bulkPublishAllDealsToS3(products, (done, total) => {
        setSyncProgress(`${done}/${total} ଟି ଡିଲ୍ S3 ରେ ପ୍ରସ୍ତୁତ ହେଲା...`);
      });
      if (result.success > 0) {
        showNotification(
          `✅ ସମସ୍ତ ${result.success} ଟି ପ୍ରଡକ୍ଟ ର ଅରିଜିନାଲ୍ ଫଟୋ ଓ ଟାଇଟଲ୍ WhatsApp/Facebook Social Media Share ପାଇଁ AWS S3 ରେ ସଫଳତାର ସହ ସିଙ୍କ୍ ହୋଇଗଲା!`,
          'success'
        );
      } else {
        showNotification('କିଛି ତ୍ରୁଟି ଦେଖାଦେଲା, ଦୟାକରି AWS S3 Keys ଯାଞ୍ଚ କରନ୍ତୁ।', 'error');
      }
    } catch (err: any) {
      showNotification(`Sync ତ୍ରୁଟି: ${err.message || 'Failed to sync'}`, 'error');
    } finally {
      setSyncingOgMeta(false);
      setSyncProgress(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Control Bar */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider">
            <Tag className="w-3.5 h-3.5 text-amber-400" />
            <span>AWS S3 Product Database</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Manage Products
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed font-medium">
            Live inventory management with full CRUD capabilities: Create, Read, Update, and Delete products directly synchronized with AWS S3.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowAwsModal(true)}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-slate-700 cursor-pointer"
            title="Configure AWS S3 Keys"
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>AWS S3 Keys</span>
            {awsConfig.isDirectReady ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            )}
          </button>

          <button
            type="button"
            onClick={loadProducts}
            disabled={loading}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-slate-700 cursor-pointer disabled:opacity-50"
            title="Refresh from AWS S3"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            <span>Sync AWS</span>
          </button>

          {/* WhatsApp & Facebook Social Share Fix Button */}
          <button
            type="button"
            onClick={handleSyncSocialOgMeta}
            disabled={syncingOgMeta || products.length === 0}
            className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-indigo-500 cursor-pointer disabled:opacity-50 shadow-md shadow-indigo-600/20"
            title="Generate & upload static HTML files with original product image & title for WhatsApp and Facebook"
          >
            <Sparkles className={`w-3.5 h-3.5 ${syncingOgMeta ? 'animate-spin text-white' : 'text-amber-300'}`} />
            <span>{syncingOgMeta ? (syncProgress || 'Syncing...') : 'Fix WhatsApp/FB Share'}</span>
          </button>

          {!isEditing && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          )}
        </div>
      </div>

      {/* AWS S3 Settings Modal */}
      {showAwsModal && (
        <AdminAwsSettings
          isModal
          onClose={() => setShowAwsModal(false)}
          onSaved={() => {
            setShowAwsModal(false);
            setStatusMsg({ text: 'AWS S3 settings updated successfully!', type: 'success' });
          }}
        />
      )}

      {/* Notification Toast */}
      {statusMsg && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between gap-3 shadow-md transition-all ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMsg(null)}
            className="p-1 hover:bg-black/5 rounded-lg transition text-slate-500"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* EDIT / CREATE FORM MODAL OR SECTION */}
      {isEditing && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 transition-all">
          <div className="flex items-center justify-between pb-5 mb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                  {editingId ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </span>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  {editingId ? 'Edit Product (Update AWS)' : 'Add New Product to AWS'}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {editingId 
                  ? `Editing ID: ${editingId} — Saves with real HTTP PUT request to AWS database.` 
                  : 'Saves with real HTTP POST request to AWS database and S3.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCancelForm}
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition cursor-pointer"
              title="Close Form"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                Product Title / Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title || ''}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Enter product title..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm font-semibold text-slate-900 bg-white"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                Product Description
              </label>
              <textarea
                rows={3}
                value={formData.description || ''}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Details, materials, spiritual significance, dimensions..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm font-medium text-slate-900 bg-white resize-y"
              />
            </div>

            {/* Product Image: Direct AWS S3 Photo Uploader */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-600" />
                <span>Product Image (Direct AWS S3 Storage)</span>
                <span className="text-rose-500">*</span>
              </label>
              <p className="text-[11px] text-slate-500 mb-3 font-medium">
                Upload image file directly into your Amazon S3 bucket.
              </p>
              <S3PhotoUploader
                value={formData.imageUrl || ''}
                onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                folder="affiliate"
                label=""
                placeholder="Select image file to upload..."
                aspectRatio="1:1"
              />
            </div>

            {/* Platform & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                  Shopping Platform <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.platform || 'Amazon'}
                  onChange={e => setFormData({ ...formData, platform: e.target.value as any })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm font-bold text-slate-900 bg-white"
                >
                  <option value="Amazon">Amazon</option>
                  <option value="Flipkart">Flipkart</option>
                  <option value="Meesho">Meesho</option>
                  <option value="Myntra">Myntra</option>
                  <option value="Other">Other / Direct Store</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                  Category Tag
                </label>
                <input
                  type="text"
                  value={formData.category || ''}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g. Idols, Diya, Puja Essentials, Books"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm font-semibold text-slate-900 bg-white"
                />
              </div>
            </div>

            {/* Affiliate Link */}
            <div>
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                Affiliate Link URL <span className="text-rose-500">*</span>
              </label>
              <div className="flex rounded-xl overflow-hidden border border-slate-300 focus-within:ring-2 focus-within:ring-amber-500 focus-within:border-amber-500">
                <span className="inline-flex items-center px-3.5 bg-slate-100 text-slate-500 border-r border-slate-300">
                  <LinkIcon className="w-4 h-4" />
                </span>
                <input
                  type="url"
                  required
                  value={formData.affiliateUrl || ''}
                  onChange={e => setFormData({ ...formData, affiliateUrl: e.target.value })}
                  placeholder="https://amzn.to/... or https://dl.flipkart.com/..."
                  className="w-full px-3.5 py-3 text-sm font-mono text-slate-900 outline-none bg-white"
                />
              </div>
            </div>

            {/* YouTube Review Video URL */}
            <div>
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Youtube className="w-4 h-4 text-red-600" />
                <span>Optional YouTube Review Video URL</span>
              </label>
              <div className="flex rounded-xl overflow-hidden border border-slate-300 focus-within:ring-2 focus-within:ring-amber-500 focus-within:border-amber-500">
                <span className="inline-flex items-center px-3.5 bg-red-50 text-red-600 border-r border-slate-300">
                  <Youtube className="w-4 h-4" />
                </span>
                <input
                  type="url"
                  value={formData.youtubeUrl || ''}
                  onChange={e => setFormData({ ...formData, youtubeUrl: e.target.value })}
                  placeholder="https://youtube.com/watch?v=... or https://youtu.be/..."
                  className="w-full px-3.5 py-3 text-sm font-mono text-slate-900 outline-none bg-white"
                />
              </div>
            </div>

            {/* Featured Checkbox */}
            <div className="flex items-center gap-3 p-4 bg-amber-50/80 border border-amber-200 rounded-2xl">
              <input
                type="checkbox"
                id="formIsFeatured"
                checked={Boolean(formData.isFeatured)}
                onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="w-4 h-4 text-amber-600 rounded-md focus:ring-amber-500 cursor-pointer"
              />
              <label htmlFor="formIsFeatured" className="text-xs font-bold text-slate-900 cursor-pointer select-none">
                Mark as Featured Deal (Spotlighted prominently on the Homepage)
              </label>
            </div>

            {/* Submit & Cancel Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handleCancelForm}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center gap-2 shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span>{editingId ? 'Updating AWS S3...' : 'Publishing to AWS...'}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-amber-400" />
                    <span>{editingId ? 'Save Changes (HTTP PUT)' : 'Create Product (HTTP POST)'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. LIVE PRODUCT LIST SECTION ("Manage Products") */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-black text-slate-900">
              AWS Inventory Directory
            </h3>
            <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
              {products.length} {products.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            AWS Database Connected
          </span>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Fetching live products directly from AWS...
            </p>
          </div>
        ) : products.length === 0 ? (
          /* 4. PROPER EMPTY STATE AS STRICTLY SPECIFIED */
          <div className="py-20 px-4 text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-slate-200 shadow-xs">
              <PackageOpen className="w-8 h-8" strokeWidth={1.5} />
            </div>
            <h4 className="text-lg font-black text-slate-900 mb-1">
              No products available to manage.
            </h4>
            <p className="text-xs text-slate-500 mb-6 font-medium leading-relaxed">
              Your AWS database is currently empty. Click below to add your first live product to Amazon S3.
            </p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-amber-300 px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-md transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Product</span>
            </button>
          </div>
        ) : (
          /* 5. SLEEK ADMIN MANAGEMENT TABLE & CARDS */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Product</th>
                  <th className="py-3.5 px-4">Platform</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Video</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {products.map(p => {
                  const isBeingDeleted = deletingId === p.id;
                  const isCurrentlyEditing = editingId === p.id;

                  return (
                    <tr 
                      key={p.id}
                      className={`hover:bg-amber-50/30 transition-colors ${
                        isCurrentlyEditing ? 'bg-amber-50/60 font-semibold' : ''
                      }`}
                    >
                      {/* Product details & thumbnail */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 p-1">
                            <img
                              src={p.imageUrl}
                              alt={p.title}
                              className="max-h-full max-w-full object-contain mix-blend-multiply"
                              onError={e => {
                                (e.target as HTMLImageElement).src = '';
                              }}
                            />
                          </div>
                          <div className="max-w-xs">
                            <div className="font-black text-slate-900 text-sm line-clamp-1">
                              {p.title}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono line-clamp-1">
                              ID: {p.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Platform */}
                      <td className="py-4 px-4">
                        <span className="inline-block bg-slate-900 text-white font-black text-[10px] uppercase px-2 py-0.5 rounded-md shadow-2xs">
                          {p.platform || 'Amazon'}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4">
                        <span className="text-slate-700 font-semibold text-xs">
                          {p.category || 'General'}
                        </span>
                      </td>

                      {/* Featured Status */}
                      <td className="py-4 px-4">
                        {p.isFeatured ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-full shadow-2xs">
                            <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                            <span>Featured</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px] font-medium">Standard</span>
                        )}
                      </td>

                      {/* Video */}
                      <td className="py-4 px-4">
                        {p.youtubeUrl ? (
                          <a
                            href={p.youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline"
                          >
                            <Youtube className="w-3.5 h-3.5" />
                            <span>Video</span>
                          </a>
                        ) : (
                          <span className="text-slate-300 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Actions: Edit & Red Delete button */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* EDIT BUTTON */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs flex items-center gap-1 transition cursor-pointer"
                            title="Edit this product"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                            <span>Edit</span>
                          </button>

                          {/* RED DELETE BUTTON */}
                          <button
                            type="button"
                            disabled={isBeingDeleted}
                            onClick={() => handleDelete(p.id, p.title)}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-xs flex items-center gap-1 transition cursor-pointer disabled:opacity-50 border border-rose-200/60"
                            title="Permanently delete from AWS"
                          >
                            {isBeingDeleted ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            )}
                            <span>Delete</span>
                          </button>

                          {/* Share button to test real WhatsApp / Facebook metadata preview */}
                          <ShareButton
                            productId={p.id}
                            title={p.title}
                            description={p.description}
                            imageUrl={p.imageUrl}
                            variant="icon"
                            className="p-1.5 w-7 h-7 text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                          />

                          {/* Deal page preview link */}
                          <a
                            href={`https://www.bhaktianandaodiatvofficial.blog/deal/${encodeURIComponent(p.id)}.html`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
                            title="Open live deal page in new tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
