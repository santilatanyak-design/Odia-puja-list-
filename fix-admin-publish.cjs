const fs = require('fs');

// The issue might be that the admin panel calls publish, but since AWS keys are not in the browser's env, it fails to upload to S3 directly, and relies on the backend route `/api/sync-story-html`.
// Let's ensure the backend route `/api/sync-story-html` uses the correct `buildStoryHtml` function we just updated.
// Actually, `generateStaticStoryPages` is called on the backend. Let's make sure it also injects the correct image OG tags.

let code = fs.readFileSync('server/generateStaticStories.ts', 'utf-8');

// Replace the OG tags generation in server/generateStaticStories.ts
const metaTagsRegex = /const metaTags = \`.*?\`;/s;
const newMetaTags = `const metaTags = \`
    <title>\${escapeHtml(title)}</title>
    <meta name="description" content="\${escapeHtml(description)}" />
    <link rel="canonical" href="\${canonicalUrl}" />
    <meta property="og:site_name" content="Bhakti Ananda Odia TV" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="\${escapeHtml(title)}" />
    <meta property="og:description" content="\${escapeHtml(description)}" />
    <meta property="og:url" content="\${canonicalUrl}" />
    <meta property="og:image" content="\${imageUrl}" />
    <meta property="og:image:secure_url" content="\${imageUrl}" />
    <meta property="og:image:url" content="\${imageUrl}" />
    <meta property="og:image:type" content="\${imageType}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="\${escapeHtml(title)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="\${escapeHtml(title)}" />
    <meta name="twitter:description" content="\${escapeHtml(description)}" />
    <meta name="twitter:image" content="\${imageUrl}" />
    <meta name="twitter:image:src" content="\${imageUrl}" />
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": "\${escapeHtml(story.title)}",
      "image": ["\${imageUrl}"],
      "datePublished": "\${new Date().toISOString()}",
      "author": [{
        "@type": "Person",
        "name": "Bhakti Ananda Odia TV"
      }]
    }
    </script>
  \`;`;

code = code.replace(metaTagsRegex, newMetaTags);

// Ensure the redirect script is in the backend generated HTML too
const replaceBodyRegex = /finalHtml = finalHtml\.replace\('<head>', \`<head>\\n\$\{metaTags\}\`\);\s*\}/s;
const newReplaceBody = `finalHtml = finalHtml.replace('<head>', \`<head>\\n\${metaTags}\`);
      }
      
      const redirectScript = \`<script>
        if (window.location.pathname.endsWith('.html') || window.location.pathname.endsWith('/index.html')) {
          const cleanPath = window.location.pathname.replace(/\\/index\\.html$/, '/').replace(/\\.html$/, '/');
          window.history.replaceState(null, '', cleanPath);
        }
        window.__STORY_INJECTED_OG_TAGS__ = true;
      </script>\`;
      finalHtml = finalHtml.replace('</body>', \`\${redirectScript}</body>\`);`;

code = code.replace(replaceBodyRegex, newReplaceBody);

fs.writeFileSync('server/generateStaticStories.ts', code);
