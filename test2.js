const fs = require('fs');
const postsData = JSON.parse(fs.readFileSync('posts.json', 'utf-8'));
const posts = Array.isArray(postsData) ? postsData : Object.values(postsData);
const cleanId = "962286";
const story = posts.find((p) => p.id === cleanId || p.id === `story-${cleanId}` || p.id === `story/${cleanId}`);
console.log("Story found:", !!story);
