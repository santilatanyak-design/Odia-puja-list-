const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');
if (!code.includes('import dotenv from')) {
  code = "import dotenv from 'dotenv';\ndotenv.config();\n" + code;
  fs.writeFileSync('server.ts', code);
}
