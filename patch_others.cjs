const fs = require('fs');

// Patch AdminContent.tsx
if(fs.existsSync('src/components/AdminContent.tsx')) {
  let file = fs.readFileSync('src/components/AdminContent.tsx', 'utf-8');
  file = file.replace(/Flipkart/gi, 'Bhakti Store');
  file = file.replace(/Amazon/gi, 'Bhakti Store');
  file = file.replace(/Myntra/gi, 'Bhakti Store');
  file = file.replace(/Meesho/gi, 'Bhakti Store');
  fs.writeFileSync('src/components/AdminContent.tsx', file);
}

// Patch AffiliateAdModal.tsx
if(fs.existsSync('src/components/AffiliateAdModal.tsx')) {
  let file = fs.readFileSync('src/components/AffiliateAdModal.tsx', 'utf-8');
  file = file.replace(/Flipkart/gi, 'Bhakti Store');
  file = file.replace(/Amazon/gi, 'Bhakti Store');
  fs.writeFileSync('src/components/AffiliateAdModal.tsx', file);
}

// Patch AdminDistrictManagement.tsx
if(fs.existsSync('src/components/AdminDistrictManagement.tsx')) {
  let file = fs.readFileSync('src/components/AdminDistrictManagement.tsx', 'utf-8');
  file = file.replace(/Flipkart/gi, 'Bhakti Store');
  file = file.replace(/Amazon/gi, 'Bhakti Store');
  fs.writeFileSync('src/components/AdminDistrictManagement.tsx', file);
}

// Patch SpiritualBlog.tsx
if(fs.existsSync('src/components/SpiritualBlog.tsx')) {
  let file = fs.readFileSync('src/components/SpiritualBlog.tsx', 'utf-8');
  file = file.replace(/Flipkart/gi, 'Bhakti Store');
  file = file.replace(/Amazon/gi, 'Bhakti Store');
  fs.writeFileSync('src/components/SpiritualBlog.tsx', file);
}

console.log("Patched other UI files");
