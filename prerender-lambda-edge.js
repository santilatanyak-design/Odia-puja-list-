// prerender-lambda-edge.js
// Production-ready Lambda@Edge router for Prerender.io on AWS CloudFront / Amplify
'use strict';

const https = require('https');

// 1. Configured with your Prerender.io Account Token
const PRERENDER_TOKEN = '2lshcvOJnuE2xAxcEKrH';

// 2. Crawler user agents to intercept
const BOT_USER_AGENTS = [
  'facebookexternalhit',
  'facebot',
  'twitterbot',
  'whatsapp',
  'linkedinbot',
  'pinterest',
  'slackbot',
  'telegrambot',
  'discordbot',
  'applebot',
  'googlebot',
  'bingbot',
  'yandex',
  'baiduspider',
  'redditbot',
  'skypeuripreview',
  'vkshare',
  'quora link preview'
];

// 3. Static asset extensions to ignore (never proxy to Prerender)
const IGNORED_EXTENSIONS = [
  '.js', '.css', '.xml', '.less', '.png', '.jpg', '.jpeg', '.gif',
  '.pdf', '.doc', '.txt', '.ico', '.rss', '.zip', '.mp3', '.rar',
  '.exe', '.wmv', '.doc', '.avi', '.ppt', '.mpg', '.mpeg', '.tif',
  '.wav', '.mov', '.psd', '.ai', '.xls', '.mp4', '.m4a', '.swf',
  '.dat', '.dmg', '.iso', '.flv', '.m4v', '.torrent', '.woff', '.woff2', '.ttf', '.svg'
];

function isBot(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some(bot => ua.includes(bot));
}

function isStaticAsset(uri) {
  const cleanUri = uri.toLowerCase().split('?')[0];
  return IGNORED_EXTENSIONS.some(ext => cleanUri.endsWith(ext));
}

exports.handler = async (event) => {
  const request = event.Records[0].cf.request;
  const headers = request.headers;
  const userAgent = headers['user-agent'] ? headers['user-agent'][0].value : '';
  const uri = request.uri || '/';

  // Pass non-bot or static asset requests directly to standard SPA origin
  if (request.method !== 'GET' || !isBot(userAgent) || isStaticAsset(uri)) {
    return request;
  }

  // Construct target URL for Prerender.io
  const host = headers['host'] ? headers['host'][0].value : 'www.bhaktianandaodiatvofficial.blog';
  const queryString = request.querystring ? `?${request.querystring}` : '';
  const fullTargetUrl = `https://${host}${uri}${queryString}`;
  const prerenderUrl = `https://service.prerender.io/${fullTargetUrl}`;

  return new Promise((resolve) => {
    const options = {
      headers: {
        'X-Prerender-Token': PRERENDER_TOKEN,
        'User-Agent': userAgent,
        'Accept-Encoding': 'gzip'
      }
    };

    https.get(prerenderUrl, options, (res) => {
      let body = '';
      res.setEncoding('utf8');

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        resolve({
          status: res.statusCode ? res.statusCode.toString() : '200',
          statusDescription: 'OK',
          headers: {
            'content-type': [{ key: 'Content-Type', value: 'text/html; charset=UTF-8' }],
            'cache-control': [{ key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=86400' }]
          },
          body: body
        });
      });
    }).on('error', (err) => {
      console.error('Prerender request error:', err);
      resolve(request); // Gracefully fallback to SPA if Prerender encounters an error
    });
  });
};
