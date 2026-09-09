const fs = require('fs');

// Fix App.tsx ViewMode
let app = fs.readFileSync('src/App.tsx', 'utf-8');
app = app.replace(
  /type ViewMode = (.*?);/,
  "type ViewMode = 'home' | 'login' | 'portal' | 'temple' | 'admin' | 'store' | 'shorts' | 'panchang' | 'blog' | 'deal' | 'categories' | 'deals';"
);

fs.writeFileSync('src/App.tsx', app);

// Fix AdminPanel AdminTab
let panel = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');
panel = panel.replace(
  /type AdminTab = (.*?);/,
  "type AdminTab = 'pujaris' | 'payments' | 'cards' | 'qr' | 'templates' | 'security' | 'sliders' | 'store' | 'affiliate' | 'shorts' | 'districts' | 'installs' | 'lists' | 'resets' | 'custom_posts' | 'content' | 'temple';"
);
fs.writeFileSync('src/components/AdminPanel.tsx', panel);

console.log("Fixed TS issues again");
