const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf-8');
app = app.replace(
  /type ViewMode = 'home' \| 'login' \| 'portal' \| 'temple' \| 'admin' \| 'store' \| 'shorts' \| 'panchang' \| 'blog';/,
  "type ViewMode = 'home' | 'login' | 'portal' | 'temple' | 'admin' | 'store' | 'shorts' | 'panchang' | 'blog' | 'deal';"
);
fs.writeFileSync('src/App.tsx', app);
console.log("Patched ViewMode");
