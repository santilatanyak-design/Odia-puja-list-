const fs = require('fs');
let code = fs.readFileSync('src/lib/contentApi.ts', 'utf-8');

const startStr = "export async function getSpiritualStories(): Promise<SpiritualStory[]> {";
const endStr = "  return allStories;\n}";

const oldBody = code.substring(code.indexOf(startStr), code.indexOf(endStr, code.indexOf(startStr)) + endStr.length);

const newBody = `export async function getSpiritualStories(): Promise<SpiritualStory[]> {
  const storyMap = new Map<string, SpiritualStory>();

  // 1. Add DEFAULT_STORIES as base
  DEFAULT_STORIES.forEach((s) => {
    if (s && s.id) storyMap.set(s.id, s);
  });

  // 2. Merge with localStorage cache from BOTH storage keys (Oldest baseline)
  try {
    for (const key of [LOCAL_STORAGE_STORIES, 'spiritual_stories_v1']) {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const clean = sanitizeStoryList(parsed);
          clean.forEach((s) => {
            if (s && s.id) storyMap.set(s.id, s);
          });
        }
      }
    }
  } catch (err) {
    console.warn('Error reading local stories:', err);
  }

  // 3. Load all posts from /posts.json with cache busting
  try {
    const res = await fetch(\`/posts.json?t=\${Date.now()}\`);
    if (res.ok) {
      const posts = await res.json();
      const arr = Object.values(posts);
      const clean = sanitizeStoryList(arr);
      clean.forEach((s) => {
        if (s && s.id) storyMap.set(s.id, s);
      });
    }
  } catch (err) {}

  // 4. Merge from backend /api/stories
  try {
    const apiRes = await fetch('/api/stories');
    if (apiRes.ok) {
      const apiStories = await apiRes.json();
      if (Array.isArray(apiStories)) {
        const clean = sanitizeStoryList(apiStories);
        clean.forEach((s) => {
          if (s && s.id) storyMap.set(s.id, s);
        });
      }
    }
  } catch {}

  // 5. Load from AWS S3 direct posts.json if available (HIGHEST PRIORITY / TRUEST SOURCE)
  try {
    const config = getClientAwsConfig();
    const bucket = config.bucket || 'bhakti-ananda-photos';
    const region = config.region || 'ap-south-1';
    const s3Res = await fetch(\`https://\${bucket}.s3.\${region}.amazonaws.com/posts.json?t=\${Date.now()}\`);
    if (s3Res.ok) {
      const s3Posts = await s3Res.json();
      const arr = Object.values(s3Posts);
      const clean = sanitizeStoryList(arr);
      clean.forEach((s) => {
        if (s && s.id) storyMap.set(s.id, s);
      });
    }
  } catch {}

  const allStories = Array.from(storyMap.values());
  try {
    localStorage.setItem(LOCAL_STORAGE_STORIES, JSON.stringify(allStories));
    localStorage.setItem('spiritual_stories_v1', JSON.stringify(allStories));
  } catch {}

  return allStories;
}`;

code = code.replace(oldBody, newBody);
fs.writeFileSync('src/lib/contentApi.ts', code);
console.log("Fixed layers in getSpiritualStories");
