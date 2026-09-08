const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const targetStr = `app.get("/api/stories/:storyId", async (req, res) => {`;
const replacementStr = `app.get("/api/stories/:storyId", async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');`;

code = code.replace(targetStr, replacementStr);

const targetStr2 = `app.get("/api/stories", (req, res) => {`;
const replacementStr2 = `app.get("/api/stories", (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');`;

code = code.replace(targetStr2, replacementStr2);

fs.writeFileSync('server.ts', code);
console.log("Fixed API headers in server.ts");
