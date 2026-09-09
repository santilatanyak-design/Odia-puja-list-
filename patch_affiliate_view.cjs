const fs = require('fs');
let file = fs.readFileSync('src/components/AffiliateProductView.tsx', 'utf-8');
file = file.replace(/import \{ Navbar \} from '\.\/Navbar';\n/, '');
file = file.replace(/<Navbar \/>\n\s*/, '');
fs.writeFileSync('src/components/AffiliateProductView.tsx', file);
