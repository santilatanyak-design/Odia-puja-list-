const fs = require('fs');

let panel = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');
panel = panel.replace(
  /type AdminTab = (.*?);/,
  "type AdminTab = 'pujaris' | 'payments' | 'cards' | 'qr' | 'templates' | 'security' | 'sliders' | 'store' | 'affiliate' | 'shorts' | 'districts' | 'installs' | 'lists' | 'resets' | 'custom_posts' | 'content' | 'temple' | 'district' | 'slider';"
);
fs.writeFileSync('src/components/AdminPanel.tsx', panel);

console.log("Fixed AdminTab");
