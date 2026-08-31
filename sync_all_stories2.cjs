const fs = require('fs');

async function syncAll() {
  const postsPath = 'posts.json';
  if (fs.existsSync(postsPath)) {
    const posts = JSON.parse(fs.readFileSync(postsPath, 'utf-8'));
    for (const post of posts) {
      const storyId = (post.id || '').replace(/^(\/)?story\//i, '');
      const rawImg = post.imageUrl || 'brand-banner.svg';
      const DOMAIN = 'https://www.bhaktianandaodiatvofficial.blog';
      const imageUrl = rawImg.startsWith('http') ? rawImg : \`\${DOMAIN}/\${rawImg.replace(/^\//, '')}\`;
      const html = \`<!doctype html><html lang="or"><head><title>\${post.title}</title><meta property="og:image" content="\${imageUrl}" /></head><body></body></html>\`;
      
      try {
        await fetch('http://localhost:3000/api/sync-story-html', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ story: post, html })
        });
        console.log("Synced", storyId, imageUrl);
      } catch (err) {
        console.error("Failed to sync", storyId, err.message);
      }
    }
  }
}
syncAll();
