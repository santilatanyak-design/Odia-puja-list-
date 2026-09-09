import React, { useState, useEffect } from 'react';
import { Save, Plus, Tag, Link as LinkIcon, Image as ImageIcon, Trash2, Edit } from 'lucide-react';
import { AffiliateProduct, saveAffiliateProductToS3, fetchAffiliateProducts } from '../lib/affiliateApi';
import { S3PhotoUploader } from './S3PhotoUploader';

export function AdminAffiliateManagement() {
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<Partial<AffiliateProduct>>({
    platform: 'Amazon'
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const data = await fetchAffiliateProducts();
    setProducts(data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.imageUrl || !formData.affiliateUrl) {
      alert("Please fill all required fields");
      return;
    }
    setSaving(true);
    
    const productToSave: AffiliateProduct = {
      id: formData.id || `prod_${Date.now()}`,
      title: formData.title,
      description: formData.description || '',
      imageUrl: formData.imageUrl,
      affiliateUrl: formData.affiliateUrl,
      platform: formData.platform as any || 'Amazon',
      youtubeUrl: formData.youtubeUrl || '',
      createdAt: formData.createdAt || new Date().toISOString()
    };
    
    const success = await saveAffiliateProductToS3(productToSave);
    setSaving(false);
    
    if (success) {
      alert("Product saved successfully!");
      setIsEditing(false);
      setFormData({ platform: 'Amazon' });
      loadProducts();
    } else {
      alert("Failed to save product.");
    }
  };

  const editProduct = (p: AffiliateProduct) => {
    setFormData(p);
    setIsEditing(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-orange-50 border-b border-orange-100 p-4 flex justify-between items-center">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Tag className="w-5 h-5 text-orange-600" />
          Affiliate Products Management
        </h3>
        {!isEditing && (
          <button 
            onClick={() => { setFormData({ platform: 'Amazon' }); setIsEditing(true); }}
            className="bg-orange-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-orange-700 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        )}
      </div>

      <div className="p-4">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Title</label>
              <input 
                type="text" 
                value={formData.title || ''} 
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full border-gray-300 rounded-md p-2 border focus:ring-orange-500 focus:border-orange-500" 
                placeholder="e.g. Premium Brass Puja Thali"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                value={formData.description || ''} 
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full border-gray-300 rounded-md p-2 border focus:ring-orange-500 focus:border-orange-500 h-24" 
                placeholder="Product details..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <input 
                  type="text"
                  className="w-full border-gray-300 rounded-md p-2 border" 
                  placeholder="₹999"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Price (Optional)</label>
                <input 
                  type="text" 
                  value={formData.discountPrice || ''} 
                  onChange={e => setFormData({...formData, discountPrice: e.target.value})}
                  className="w-full border-gray-300 rounded-md p-2 border" 
                  placeholder="₹799"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                <select 
                  value={formData.platform || 'Amazon'} 
                  onChange={e => setFormData({...formData, platform: e.target.value as any})}
                  className="w-full border-gray-300 rounded-md p-2 border"
                >
                  <option value="Amazon">Amazon</option>
                  <option value="Flipkart">Flipkart</option>
                  <option value="Meesho">Meesho</option>
                  <option value="Myntra">Myntra</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">YouTube Review URL (Optional)</label>
                <div className="flex mb-4">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    <LinkIcon className="w-4 h-4" />
                  </span>
                  <input 
                    type="url" 
                    value={formData.youtubeUrl || ''} 
                    onChange={e => setFormData({...formData, youtubeUrl: e.target.value})}
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-orange-500 focus:border-orange-500" 
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Affiliate Link</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    <LinkIcon className="w-4 h-4" />
                  </span>
                  <input 
                    type="url" 
                    value={formData.affiliateUrl || ''} 
                    onChange={e => setFormData({...formData, affiliateUrl: e.target.value})}
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-orange-500 focus:border-orange-500" 
                    placeholder="https://amzn.to/..."
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Product Image
              </label>
              <S3PhotoUploader 
                onUploadSuccess={(url) => setFormData({...formData, imageUrl: url})} 
              />
              {formData.imageUrl && (
                <div className="mt-2">
                  <img src={formData.imageUrl} alt="Preview" className="h-32 object-contain bg-gray-100 rounded border" />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button 
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading products...</div>
            ) : products.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No products found. Add one above.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {products.map(p => (
                  <div key={p.id} className="border border-gray-200 rounded-lg p-4 flex flex-col hover:border-orange-300 transition-colors">
                    <div className="h-40 bg-white flex items-center justify-center mb-3">
                      <img src={p.imageUrl} alt={p.title} className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="text-xs text-orange-600 font-bold mb-1">{p.platform}</div>
                    <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2 flex-1">{p.title}</h4>
                    
                    <button 
                      onClick={() => editProduct(p)}
                      className="mt-auto w-full flex items-center justify-center gap-1 py-1.5 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Edit className="w-4 h-4" /> Edit
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
