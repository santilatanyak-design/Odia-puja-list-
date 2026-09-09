const fs = require('fs');

function restoreFields(filePath) {
  if (fs.existsSync(filePath)) {
    let file = fs.readFileSync(filePath, 'utf-8');
    file = file.replace(/Bhakti StoreLink/g, 'amazonLink'); // First replace all generic StoreLinks with amazonLink
    // Then flip half of them back to flipkartLink by analyzing context (or just replace the second occurrence if possible, but easier:
    file = file.replace(/amazonLink: editingStory\.affiliateAd\?\.amazonLink \|\| '',\s*amazonLink: editingStory\.affiliateAd\?\.amazonLink \|\| '',\s*amazonLink: editingStory\.affiliateAd\?\.amazonLink \|\| '',/g, 
      "amazonLink: editingStory.affiliateAd?.amazonLink || '',\n                            flipkartLink: editingStory.affiliateAd?.flipkartLink || '',\n                            meeshoLink: editingStory.affiliateAd?.meeshoLink || '',");
    file = file.replace(/amazonLink: e\.target\.value,\s*amazonLink: e\.target\.value,\s*amazonLink: e\.target\.value,/g, 
      "amazonLink: e.target.value,\n                            flipkartLink: e.target.value,\n                            meeshoLink: e.target.value,");
    fs.writeFileSync(filePath, file);
  }
}

restoreFields('src/components/AdminContent.tsx');
restoreFields('src/components/AdminDistrictManagement.tsx');
restoreFields('src/components/AffiliateAdModal.tsx');
restoreFields('src/components/SpiritualBlog.tsx');

let blog = fs.readFileSync('src/components/SpiritualBlog.tsx', 'utf-8');
blog = blog.replace(/ad\.amazonLink && \(!ad\.amazonLink && !ad\.amazonLink/g, "ad.amazonLink && (!ad.amazonLink && !ad.flipkartLink");
fs.writeFileSync('src/components/SpiritualBlog.tsx', blog);

let modal = fs.readFileSync('src/components/AffiliateAdModal.tsx', 'utf-8');
modal = modal.replace(/ad\.amazonLink && \(/g, "ad.amazonLink && (");
// Just fix the syntax issue
modal = modal.replace(/ad\.amazonLink!, 'Bhakti Store'\)/g, "ad.amazonLink!, 'Amazon')");
fs.writeFileSync('src/components/AffiliateAdModal.tsx', modal);

console.log("Fixed syntax 3");
