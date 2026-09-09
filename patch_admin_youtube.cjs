const fs = require('fs');
let file = fs.readFileSync('src/components/AdminAffiliateManagement.tsx', 'utf-8');

// 1. Add youtubeUrl to the product to save
file = file.replace(
  /platform: formData\.platform as any \|\| 'Amazon',/,
  "platform: formData.platform as any || 'Amazon',\n      youtubeUrl: formData.youtubeUrl || '',"
);

// 2. Add Youtube URL input field in the form
file = file.replace(
  /<div>\n\s*<label className="block text-sm font-medium text-gray-700 mb-1">Affiliate Link<\/label>/,
  `<div>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Affiliate Link</label>`
);

fs.writeFileSync('src/components/AdminAffiliateManagement.tsx', file);
