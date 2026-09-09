const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf-8');

code = code.replace(/recoveryLockedUntil\?\: number;/, "recoveryLockedUntil?: any;");
code = code.replace(/export interface Pujari \{/, "export interface Pujari {\n  hasUnreadNotification?: boolean;");

fs.writeFileSync('src/types.ts', code);
console.log("Fixed Pujari types 2");
