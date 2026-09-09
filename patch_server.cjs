const fs = require('fs');

let srv = fs.readFileSync('server.ts', 'utf-8');

const dealRoute = `
app.get(['/deal/*', '/deal'], async (req, res, next) => {
  console.log("INTERCEPTED DEAL ROUTE:", req.path);
  if (req.path.match(/\\.(js|css|png|jpg|jpeg|gif|ico|svg|json)$/)) {
    return next();
  }

  const distPath = path.join(process.cwd(), 'dist');
  const indexPath = path.join(distPath, 'index.html');

  if (fs.existsSync(indexPath)) {
    let html = fs.readFileSync(indexPath, 'utf-8');
    const dealIdMatch = req.path.match(/\\/deal\\/([^\\/.]+)/);
    
    if (dealIdMatch && dealIdMatch[1]) {
      let cleanId = dealIdMatch[1];
      let deal = null;
      
      const aws = getAwsConfig();
      if (aws.bucket && aws.region) {
        const url = \`https://\${aws.bucket}.s3.\${aws.region}.amazonaws.com/affiliate/product-\${cleanId}.json?t=\${Date.now()}\`;
        try {
          const fetchRes = await fetch(url);
          if (fetchRes.ok) {
            deal = await fetchRes.json();
            console.log(\`[SSR] Found deal \${cleanId} from S3!\`);
          }
        } catch (e) {}
      }

      if (deal) {
        const title = (deal.title || 'Exclusive Deal').replace(/"/g, '&quot;');
        const desc = (deal.description || 'Grab this exclusive offer today on Bhakti Ananda.').substring(0, 250).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const img = deal.imageUrl || 'https://www.bhaktianandaodiatvofficial.blog/brand-banner.svg';
        
        html = html.replace(/<meta property="og:[^>]+>/gi, '')
                   .replace(/<meta name="twitter:[^>]+>/gi, '')
                   .replace(/<title>.*?<\\/title>/gi, '');
                   
        const newMeta = \`
          <title>\${title}</title>
          <meta property="og:url" content="https://www.bhaktianandaodiatvofficial.blog/deal/\${cleanId}" />
          <meta property="og:title" content="\${title}" />
          <meta property="og:description" content="\${desc}" />
          <meta property="og:image" content="\${img}" />
          <meta property="og:type" content="product" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="\${title}" />
          <meta name="twitter:image" content="\${img}" />
          <script>window.__PRELOADED_STATE__ = { viewMode: 'deal', dealId: '\${cleanId}', deal: \${JSON.stringify(deal).replace(/</g, '\\\\u003c')} };</script>
        \`;
        html = html.replace('</head>', \`\${newMeta}\\n</head>\`);
      }
    }
    
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    return res.send(html);
  }
  next();
});
`;

srv = srv.replace(
  /app\.get\(\['\/story\/\*', '\/story'\], async \(req, res, next\) => \{/,
  dealRoute + "\napp.get(['/story/*', '/story'], async (req, res, next) => {"
);

fs.writeFileSync('server.ts', srv);
console.log("Patched server.ts with deal route");
