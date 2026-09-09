const fs = require('fs');
let file = fs.readFileSync('src/components/AdminAffiliateManagement.tsx', 'utf-8');

// 1. Validation check
file = file.replace(
  /if \(!formData\.title \|\| !formData\.imageUrl \|\| !formData\.affiliateUrl \|\| !formData\.price\) \{/,
  "if (!formData.title || !formData.imageUrl || !formData.affiliateUrl) {"
);

// 2. Remove price from saving object
file = file.replace(/\s*price: formData\.price,/, '');
file = file.replace(/\s*discountPrice: formData\.discountPrice,/, '');

// 3. Remove Price input fields entirely from the UI (lines ~107 to ~127)
file = file.replace(
  /<div className="grid grid-cols-2 gap-4">\s*<div>\s*<label className="block text-sm font-medium text-gray-700 mb-1">Price \(e\.g\. ₹999\)<\/label>\s*<input\s*type="text"\s*value=\{formData\.price \|\| ''\}\s*onChange=\{e => setFormData\(\{\.\.\.formData, price: e\.target\.value\}\)\}\s*className="w-full border-gray-300 rounded-md p-2 border"\s*placeholder="₹999"\s*\/>\s*<\/div>\s*<div>\s*<label className="block text-sm font-medium text-gray-700 mb-1">Discount Price \(Optional\)<\/label>\s*<input\s*type="text"\s*value=\{formData\.discountPrice \|\| ''\}\s*onChange=\{e => setFormData\(\{\.\.\.formData, discountPrice: e\.target\.value\}\)\}\s*className="w-full border-gray-300 rounded-md p-2 border"\s*placeholder="₹799"\s*\/>\s*<\/div>\s*<\/div>/,
  ""
);

// 4. Remove price from listing card
file = file.replace(
  /<div className="font-bold text-gray-900 mb-3">\{p\.discountPrice \|\| p\.price\}<\/div>/,
  ""
);

fs.writeFileSync('src/components/AdminAffiliateManagement.tsx', file);
