const fs = require('fs');

// Fix AffiliateProduct type in affiliateApi.ts properly
let api = fs.readFileSync('src/lib/affiliateApi.ts', 'utf-8');
if (!api.includes('export interface AffiliateProduct {')) {
  // Try to find the interface and replace it
}
api = api.replace(/export interface AffiliateProduct \{[\s\S]*?\n\}/, 
`export interface AffiliateProduct {
  id: string;
  title: string;
  description?: string;
  price: string;
  discountPrice?: string;
  imageUrl: string;
  affiliateUrl: string;
  platform: 'Amazon' | 'Flipkart' | 'Meesho' | 'Myntra' | 'Other';
  category?: string;
  isFeatured?: boolean;
  inStock?: boolean;
}`);
fs.writeFileSync('src/lib/affiliateApi.ts', api);

// Fix SpiritualBlog types
let blog = fs.readFileSync('src/components/SpiritualBlog.tsx', 'utf-8');
blog = blog.replace(/fetchAndMatchStory\(storyId, false\)/g, "fetchAndMatchStory()");
blog = blog.replace(/onBack\(null, null\)/g, "onBack()");
blog = blog.replace(/'Bhakti Store'/g, "'amazon'");
fs.writeFileSync('src/components/SpiritualBlog.tsx', blog);

// Fix contentApi
let contentApi = fs.readFileSync('src/lib/contentApi.ts', 'utf-8');
contentApi = contentApi.replace(
  /likesCount: data\.likesCount \|\| 0,/g,
  `likesCount: data.likesCount || 0,\n      isFeatured: data.isFeatured || false,`
);
fs.writeFileSync('src/lib/contentApi.ts', contentApi);

console.log("Fixed final types");
