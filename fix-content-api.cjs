const fs = require('fs');
let code = fs.readFileSync('src/lib/contentApi.ts', 'utf-8');

// replace subscribeSpiritualStories error handler
code = code.replace(
  /\(err\) => \{\n\s*console\.warn\('Stories subscription warning:', err\);\n\s*\}/,
  `(err) => {
        console.warn('Stories subscription warning:', err);
        // Fallback to local
        try {
           const raw = localStorage.getItem(LOCAL_STORAGE_STORIES);
           if (raw) callback(JSON.parse(raw));
        } catch {}
      }`
);

// replace getSpiritualStories try-catch for firestore
code = code.replace(
  /console\.warn\('Firestore stories error, returning empty list:', err\);\n\s*return \[\];/g,
  `console.warn('Firestore stories error, bypassing:', err);
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_STORIES);
      if (raw) return sanitizeStoryList(JSON.parse(raw));
    } catch {}
    
    // Also try fetch from posts.json
    try {
      const res = await fetch('/posts.json');
      if (res.ok) {
        const posts = await res.json();
        const arr = Object.values(posts);
        return sanitizeStoryList(arr);
      }
    } catch {}
    return [];`
);

fs.writeFileSync('src/lib/contentApi.ts', code);
console.log('Fixed contentApi.ts');
