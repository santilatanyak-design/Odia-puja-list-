const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const badBlock = /\}\);\s*res\.json\(\{ success: true, message: 'Story HTML synchronization started' \}\);\s*\} catch \(err: any\) \{\s*res\.status\(500\)\.json\(\{ success: false, error: err\?\.message \|\| String\(err\) \}\);\s*\}\s*\}\);/s;

if (code.match(badBlock)) {
  code = code.replace(badBlock, '});');
  fs.writeFileSync('server.ts', code);
}
