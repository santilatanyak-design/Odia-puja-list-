import { buildStoryHtml } from './src/lib/publishStoryHtml.ts';
import fs from 'fs';

const postsData = JSON.parse(fs.readFileSync('posts.json', 'utf-8'));
const posts = Array.isArray(postsData) ? postsData : Object.values(postsData);
const story = posts.find((p) => p.id === 'story-290518' || p.id === 'story-962286');

buildStoryHtml(story).then(html => {
  console.log("Has default logo?", html.includes('brand-banner.svg'));
  console.log(html.match(/<meta property="og:image".*?>/g));
  console.log(html.match(/<meta property="og:title".*?>/g));
  console.log(html.match(/<meta name="twitter:image".*?>/g));
});
