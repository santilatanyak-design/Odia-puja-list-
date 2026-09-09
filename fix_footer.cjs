const fs = require('fs');
if (fs.existsSync('src/components/Footer.tsx')) {
  let footer = fs.readFileSync('src/components/Footer.tsx', 'utf-8');
  footer = footer.replace(/text-orange-400/g, 'text-blue-400');
  footer = footer.replace(/Bhakti Ananda Odia TV/g, 'Bhakti Store');
  footer = footer.replace(/Your daily source for spiritual enlightenment and Odia culture./g, 'Your daily source for the best deals and products.');
  footer = footer.replace(/Bhakti Ananda/g, 'Bhakti Store');
  fs.writeFileSync('src/components/Footer.tsx', footer);
}
console.log("Footer fixed");
