const fs = require('fs');
let code = fs.readFileSync('src/lib/contentApi.ts', 'utf-8');

const regex = /\/\/ Layer 1: Check localStorage first \(instant\)[\s\S]*?\/\/ Layer 2: Query AWS S3 Direct JSON Files/m;

// We will completely replace the body of fetchStoryByIdOrQuery.
const startStr = "export async function fetchStoryByIdOrQuery(targetIdOrQuery: string): Promise<SpiritualStory | null> {";
const endStr = "  return null;\n}";

const oldBody = code.substring(code.indexOf(startStr), code.indexOf(endStr, code.indexOf(startStr)) + endStr.length);

const newBody = `export async function fetchStoryByIdOrQuery(targetIdOrQuery: string): Promise<SpiritualStory | null> {
  if (!targetIdOrQuery || !targetIdOrQuery.trim()) return null;
  const decoded = decodeURIComponent(targetIdOrQuery).trim();
  const cleanId = decoded
    .replace(/^https?:\\/\\//i, '')
    .replace(/^(\\/)?(story|blog|stories|post|posts)\\//i, '')
    .replace(/\\.html?$/i, '')
    .replace(/\\/$/, '')
    .trim();
  const idWithoutStory = cleanId.replace(/^story-/, '').trim();
  const idWithStory = cleanId.startsWith('story-') ? cleanId : \`story-\${cleanId}\`;

  const idCandidates = Array.from(new Set([cleanId, idWithStory, idWithoutStory, decoded])).filter(
    (id) => Boolean(id) && id.length > 0 && id !== 'all'
  );

  // Layer 1: Query AWS S3 Direct JSON Files (Always fetch latest!)
  try {
    const config = getClientAwsConfig();
    const bucket = config.bucket || 'bhakti-ananda-photos';
    const region = config.region || 'ap-south-1';
    for (const docId of idCandidates) {
      const s3Urls = [
        \`https://\${bucket}.s3.\${region}.amazonaws.com/posts/story-\${encodeURIComponent(docId)}.json?t=\${Date.now()}\`,
        \`https://\${bucket}.s3.\${region}.amazonaws.com/story/\${encodeURIComponent(docId)}/story.json?t=\${Date.now()}\`,
        \`https://\${bucket}.s3.\${region}.amazonaws.com/story/\${encodeURIComponent(docId)}.json?t=\${Date.now()}\`
      ];
      for (const s3Url of s3Urls) {
        try {
          const res = await fetch(s3Url);
          if (res.ok) {
            const s3Data = await res.json();
            const normalized = normalizeStory(s3Data);
            if (normalized) {
              // Update local storage so feed is updated too
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

  // Layer 2: Check backend API /api/stories/:id (Bypasses local cache)
  try {
    for (const docId of idCandidates) {
      try {
        const res = await fetch(\`/api/stories/\${encodeURIComponent(docId)}?t=\${Date.now()}\`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.story) {
            const normalized = normalizeStory(data.story);
            if (normalized) return normalized;
          }
        }
      } catch {}
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

  // Layer 4: Check localStorage (Last resort fallback)
  try {
    if (typeof window !== 'undefined') {
      for (const key of [LOCAL_STORAGE_STORIES, 'spiritual_stories_v1']) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const match = matchStoryFromExternalQuery(decoded, parsed);
            if (match) return match;
          }
        }
      }
    }
  } catch {}

  return null;
}`;

code = code.replace(oldBody, newBody);
fs.writeFileSync('src/lib/contentApi.ts', code);
console.log("Fixed layers in contentApi.ts");
