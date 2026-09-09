const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf-8');
app = app.replace(/bg-\[\#FFFBF0\]/g, 'bg-gray-100');
app = app.replace(/text-amber-950/g, 'text-gray-900');
app = app.replace(/selection:bg-amber-200/g, 'selection:bg-[#2874f0]/20');
fs.writeFileSync('src/App.tsx', app);
