const fs = require('fs');
let file = fs.readFileSync('src/components/AdminAffiliateManagement.tsx', 'utf-8');

file = file.replace(
  /\s*value=\{formData\.price \|\| ''\}\s*onChange=\{e => setFormData\(\{\.\.\.formData, price: e\.target\.value\}\)\}/,
  ""
);

fs.writeFileSync('src/components/AdminAffiliateManagement.tsx', file);
