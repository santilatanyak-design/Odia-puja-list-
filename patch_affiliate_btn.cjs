const fs = require('fs');
let file = fs.readFileSync('src/components/AffiliateProductView.tsx', 'utf-8');
file = file.replace(/className="w-full bg-\[\#fb641b\] text-white font-bold text-lg py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"/,
'className="w-full bg-[#fb641b] text-white font-bold text-lg py-4 rounded-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"');
file = file.replace(/rounded-2xl/g, 'rounded-sm');
file = file.replace(/border-orange-600/g, 'border-[#2874f0]');
fs.writeFileSync('src/components/AffiliateProductView.tsx', file);
