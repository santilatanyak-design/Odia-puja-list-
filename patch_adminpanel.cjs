const fs = require('fs');
let app = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');

app = app.replace(
  /import \{ AdminStoreManagement \} from '\.\/AdminStoreManagement';/,
  `import { AdminStoreManagement } from './AdminStoreManagement';
import { AdminAffiliateManagement } from './AdminAffiliateManagement';`
);

app = app.replace(
  /type AdminTab = 'pujaris' \| 'payments' \| 'cards' \| 'qr' \| 'templates' \| 'security' \| 'sliders' \| 'store' \| 'shorts' \| 'districts' \| 'installs';/,
  "type AdminTab = 'pujaris' | 'payments' | 'cards' | 'qr' | 'templates' | 'security' | 'sliders' | 'store' | 'affiliate' | 'shorts' | 'districts' | 'installs';"
);

app = app.replace(
  /<button\n\s*onClick=\{\(\) => setActiveTab\('store'\)\}/,
  `<button
            onClick={() => setActiveTab('affiliate')}
            className={\`\${activeTab === 'affiliate' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm\`}
          >
            Affiliate Products
          </button>
          <button
            onClick={() => setActiveTab('store')}`
);

app = app.replace(
  /\{activeTab === 'store' && <AdminStoreManagement \/>\}/,
  `{activeTab === 'store' && <AdminStoreManagement />}
        {activeTab === 'affiliate' && <AdminAffiliateManagement />}`
);

fs.writeFileSync('src/components/AdminPanel.tsx', app);
console.log("Patched AdminPanel");
