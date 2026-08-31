const fs = require('fs');
let code = fs.readFileSync('server/generateStaticStories.ts', 'utf-8');
const redirectRegex = /const redirectScript = \`<script>[\s\S]*?<\/script>\`;\s*finalHtml = finalHtml\.replace\('<\/body>', \`\$\{redirectScript\}<\/body>'\);/g;
code = code.replace(redirectRegex, "");
fs.writeFileSync('server/generateStaticStories.ts', code);
