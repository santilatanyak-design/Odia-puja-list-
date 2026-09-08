const fs = require('fs');
let code = fs.readFileSync('src/lib/contentApi.ts', 'utf-8');

const regex = /\/\/ Layer 2: Check posts\.json with fresh cache buster[\s\S]*?\/\/ Layer 3: Query AWS S3 Direct JSON Files/m;

const replacement = `// Layer 2: Query AWS S3 Direct JSON Files (Bucket: bhakti-ananda-photos)
  try {
    const config = getClientAwsConfig();
    const bucket = config.bucket || 'bhakti-ananda-photos';
    const region = config.region || 'ap-south-1';
    for (const docId of idCandidates) {
      const s3Urls = [
        \`https://\${bucket}.s3.\${region}.amazonaws.com/posts/story-\${encodeURIComponent(docId)}.json?t=\${Date.now()}\`,
        \`https://\${bucket}.s3.\${region}.amazonaws.com/story/\${encodeURIComponent(docId)}/story.json?t=\${Date.now()}\`,
        \`https://\${bucket}.s3.\${region}.amazonaws.com/story/\${encodeURIComponent(docId)}.json?t=\${Date.now()}\`,
        \`https://\${bucket}.s3.\${region}.amazonaws.com/posts/story-\${encodeURIComponent(docId)}.json\`,
        \`https://\${bucket}.s3.\${region}.amazonaws.com/story/\${encodeURIComponent(docId)}.json\`
      ];
      for (const s3Url of s3Urls) {
        try {
          const res = await fetch(s3Url);
          if (res.ok) {
            const s3Data = await res.json();
            const normalized = normalizeStory(s3Data);
            if (normalized) {
              try {
                const current = await getSpiritualStories();
                const updated = [normalized, ...current.filter((s) => s.id !== normalized.id)];
                localStorage.setItem(LOCAL_STORAGE_STORIES, JSON.stringify(updated));
                localStorage.setItem('spiritual_stories_v1', JSON.stringify(updated));
              } catch {}
              return normalized;
            }
          }
        } catch {}
      }
    }
  } catch {}

  // Layer 3: Check posts.json with fresh cache buster
  try {
    const res = await fetch(\`/posts.json?t=\${Date.now()}\`);
    if (res.ok) {
      const posts = await res.json();
      const match = matchStoryFromExternalQuery(decoded, posts);
      if (match) return match;
    }
  } catch {}

  // Layer 4: Query backend API /api/stories`;

const fullRegex = /\/\/ Layer 2: Check posts\.json with fresh cache buster[\s\S]*?\/\/ Layer 4: Query backend API \/api\/stories/m;
code = code.replace(fullRegex, replacement);
fs.writeFileSync('src/lib/contentApi.ts', code);
console.log("Fixed contentApi.ts");
