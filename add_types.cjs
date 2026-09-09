const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf-8');
app = app.replace(
  /const \[viewMode, setViewMode\] = useState<ViewMode>\(\(\) => \{/,
  `type ViewMode = 'home' | 'login' | 'portal' | 'temple' | 'admin' | 'store' | 'shorts' | 'panchang' | 'blog' | 'deal' | 'categories' | 'deals';\n  const [viewMode, setViewMode] = useState<ViewMode>(() => {`
);
fs.writeFileSync('src/App.tsx', app);

let panel = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');
panel = panel.replace(
  /const \[activeTab, setActiveTab\] = useState<AdminTab>\('payments'\);/,
  `type AdminTab = 'pujaris' | 'payments' | 'cards' | 'qr' | 'templates' | 'security' | 'sliders' | 'store' | 'affiliate' | 'shorts' | 'districts' | 'installs' | 'lists' | 'resets' | 'custom_posts' | 'content' | 'temple';\n  const [activeTab, setActiveTab] = useState<AdminTab>('payments');`
);
fs.writeFileSync('src/components/AdminPanel.tsx', panel);
