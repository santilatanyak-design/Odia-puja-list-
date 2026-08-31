const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  await page.goto('http://localhost:5555/story/story-962286.html', { waitUntil: 'networkidle2' });
  
  await page.screenshot({ path: 'screenshot.png' });
  const html = await page.content();
  fs.writeFileSync('page.html', html);
  
  await browser.close();
})();
