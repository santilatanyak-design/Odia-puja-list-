const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf-8');

code = code.replace(/export interface Pujari \{/, "export interface Pujari {\n  cardStatus?: string;\n  cardUtrRef?: string;\n  createdAt?: string;\n  passwordResetStatus?: string;");
fs.writeFileSync('src/types.ts', code);
console.log("Fixed Pujari types");
