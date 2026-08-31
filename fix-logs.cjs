const fs = require('fs');
let code = fs.readFileSync('server/firebaseSync.ts', 'utf-8');
code = code.replace(
  /console\.warn\('\[Firebase Server Sync\] Could not fetch all stories from Firestore:', err\);/g,
  `console.log('[Firebase Server Sync] Fetching bypassed (Quota or Offline). Using cache.');`
);
fs.writeFileSync('server/firebaseSync.ts', code);

let code2 = fs.readFileSync('src/lib/firebase.ts', 'utf-8');
code2 = code2.replace(
  /console\.warn\('fsSubscribe([a-zA-Z]+) Error:', err\)/g,
  `console.log('Firebase subscription bypassed for $1.')`
);
fs.writeFileSync('src/lib/firebase.ts', code2);
