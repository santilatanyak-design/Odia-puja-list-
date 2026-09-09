const fs = require('fs');
let file = fs.readFileSync('src/components/SpiritualBlog.tsx', 'utf-8');
file = file.replace(/adConfig\?\.Bhakti StoreLink/g, 'adConfig?.amazonLink');
file = file.replace(/adConfig\?\.Bhakti StoreLink/g, 'adConfig?.flipkartLink');
fs.writeFileSync('src/components/SpiritualBlog.tsx', file);

let file2 = fs.readFileSync('src/components/AdminContent.tsx', 'utf-8');
file2 = file2.replace(/adConfig\?\.Bhakti StoreLink/g, 'adConfig?.amazonLink');
fs.writeFileSync('src/components/AdminContent.tsx', file2);

let file3 = fs.readFileSync('src/components/AdminDistrictManagement.tsx', 'utf-8');
file3 = file3.replace(/adConfig\?\.Bhakti StoreLink/g, 'adConfig?.amazonLink');
fs.writeFileSync('src/components/AdminDistrictManagement.tsx', file3);

console.log("Fixed syntax");
