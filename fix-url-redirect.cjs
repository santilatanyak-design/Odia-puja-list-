const fs = require('fs');
let code = fs.readFileSync('dist/index.html', 'utf-8');
const redirectScript = `<script>
if (window.location.pathname.startsWith('/story/') && !window.location.pathname.endsWith('.html')) {
  const url = new URL(window.location.href);
  let path = url.pathname;
  if (path.endsWith('/')) { path = path.slice(0, -1); }
  url.pathname = path + '.html';
  window.location.replace(url.toString());
}
</script>`;
if (!code.includes('window.location.replace')) {
  code = code.replace('</head>', redirectScript + '</head>');
  fs.writeFileSync('dist/index.html', code);
}
