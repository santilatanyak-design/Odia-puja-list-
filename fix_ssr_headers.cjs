const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const targetStr = "return res.send(html);";
const replacementStr = `res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    return res.send(html);`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('server.ts', code);
console.log("Fixed SSR headers in server.ts");
