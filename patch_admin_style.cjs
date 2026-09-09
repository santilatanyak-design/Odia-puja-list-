const fs = require('fs');
let app = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');

app = app.replace(
  /<button\n\s*onClick=\{\(\) => setActiveTab\('affiliate'\)\}\n\s*className=\{\`\\\$\\{activeTab === 'affiliate' \? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'\\} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm\`\}\n\s*>\n\s*Affiliate Products\n\s*<\/button>/g,
  `<button
          onClick={() => setActiveTab('affiliate')}
          className={\`px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2 \${
            activeTab === 'affiliate'
              ? 'bg-amber-700 text-white font-extrabold shadow-xs'
              : 'text-slate-800 hover:bg-amber-50'
          }\`}
        >
          <ShoppingCart className="w-4 h-4" /> ଆଫିଲିଏଟ୍ (Deals)
        </button>`
);
// Make sure ShoppingCart is imported
if (!app.includes('ShoppingCart')) {
  app = app.replace(/import \{ (.*?) \} from 'lucide-react';/, "import { $1, ShoppingCart } from 'lucide-react';");
}

fs.writeFileSync('src/components/AdminPanel.tsx', app);
console.log("Patched AdminPanel button style");
