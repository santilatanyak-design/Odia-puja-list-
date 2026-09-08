const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const regex1 = /const AWS_REGION = process\.env\.VITE_AWS_REGION[^;]+;\n\s*const AWS_BUCKET = process\.env\.VITE_AWS_BUCKET[^;]+;\n\s*const AWS_ACCESS_KEY = process\.env\.VITE_AWS_ACCESS_KEY_ID[^;]+;\n\s*const AWS_SECRET_KEY = process\.env\.VITE_AWS_SECRET_ACCESS_KEY[^;]+;/g;

const replacement = `const awsConf = getAwsConfig();
    const AWS_REGION = awsConf.region || 'ap-south-1';
    const AWS_BUCKET = awsConf.bucket || 'bhakti-ananda-photos';
    const AWS_ACCESS_KEY = awsConf.accessKeyId;
    const AWS_SECRET_KEY = awsConf.secretAccessKey;`;

code = code.replace(regex1, replacement);
fs.writeFileSync('server.ts', code);
console.log("Fixed AWS config in server.ts");
