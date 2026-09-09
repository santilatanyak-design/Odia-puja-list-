const fs = require('fs');

function restoreFields(filePath) {
  if (fs.existsSync(filePath)) {
    let file = fs.readFileSync(filePath, 'utf-8');
    file = file.replace(/\.Bhakti StoreLink/g, '.amazonLink');
    file = file.replace(/amazonLink \|\| selectedStory\.affiliateAd\.amazonLink/g, 'amazonLink || selectedStory.affiliateAd.flipkartLink');
    fs.writeFileSync(filePath, file);
  }
}

restoreFields('src/components/SpiritualBlog.tsx');
restoreFields('src/components/AdminContent.tsx');
restoreFields('src/components/AdminDistrictManagement.tsx');

console.log("Fixed syntax 2");
