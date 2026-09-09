const fs = require('fs');

// Fix AffiliateProduct type
let api = fs.readFileSync('src/lib/affiliateApi.ts', 'utf-8');
if (!api.includes('isFeatured?: boolean')) {
  api = api.replace(/description\?: string;/, "description?: string;\n  isFeatured?: boolean;\n  category?: string;");
}
fs.writeFileSync('src/lib/affiliateApi.ts', api);

// Fix AdminPanel types (lang prop)
let admin = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');
admin = admin.replace(/<AdminAffiliateManagement lang="EN" \/>/g, '<AdminAffiliateManagement />');
admin = admin.replace(/<AdminSliderManagement lang="EN" \/>/g, '<AdminSliderManagement />');
fs.writeFileSync('src/components/AdminPanel.tsx', admin);

// Fix AdminAffiliateManagement
let affMgmt = fs.readFileSync('src/components/AdminAffiliateManagement.tsx', 'utf-8');
affMgmt = affMgmt.replace(/interface AdminAffiliateManagementProps \{[\s\S]*?\}/, 'interface AdminAffiliateManagementProps {}');
fs.writeFileSync('src/components/AdminAffiliateManagement.tsx', affMgmt);

// Fix AdminSliderManagement
let slMgmt = fs.readFileSync('src/components/AdminSliderManagement.tsx', 'utf-8');
slMgmt = slMgmt.replace(/interface AdminSliderManagementProps \{[\s\S]*?\}/, 'interface AdminSliderManagementProps {}');
fs.writeFileSync('src/components/AdminSliderManagement.tsx', slMgmt);

// Fix AffiliateAdModal types
let adModal = fs.readFileSync('src/components/AffiliateAdModal.tsx', 'utf-8');
adModal = adModal.replace(/'Amazon'/g, "'amazon'");
fs.writeFileSync('src/components/AffiliateAdModal.tsx', adModal);

// Fix AffiliateProductView handleDeepLink
let prodView = fs.readFileSync('src/components/AffiliateProductView.tsx', 'utf-8');
prodView = prodView.replace(/product\.platform \|\| 'Bhakti Store'/g, "product.platform as any || 'amazon'");
fs.writeFileSync('src/components/AffiliateProductView.tsx', prodView);

// Fix HomePage handleDeepLink
let home = fs.readFileSync('src/components/HomePage.tsx', 'utf-8');
home = home.replace(/product\.platform \|\| 'Bhakti Store'/g, "product.platform as any || 'amazon'");
fs.writeFileSync('src/components/HomePage.tsx', home);

console.log("Fixed other types");
