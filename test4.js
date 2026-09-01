import fs from 'fs';
const postsData = JSON.parse(fs.readFileSync('posts.json', 'utf-8'));
const posts = Array.isArray(postsData) ? postsData : Object.values(postsData);
const story = posts.find((p) => p.id === 'story-962286');

fetch('http://localhost:3000/api/sync-story-html', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ story, html: "<html><head><meta property='og:image' content='TEST' /></head><body></body></html>" })
}).then(res => res.json()).then(console.log);
