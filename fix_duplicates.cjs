const fs = require('fs');

let file = fs.readFileSync('src/components/AdminContent.tsx', 'utf-8');

// Fix the three input fields
// First block is Amazon, Second is Flipkart, Third is Meesho
let parts = file.split('Bhakti Store Link');
if (parts.length > 3) {
  // We can just use regex to fix the duplicate keys at the end
  file = file.replace(/amazonLink: '',\s*amazonLink: '',\s*amazonLink: '',/, 
    "amazonLink: '',\n                      flipkartLink: '',\n                      meeshoLink: '',");
}

fs.writeFileSync('src/components/AdminContent.tsx', file);
console.log("Fixed duplicate keys");
