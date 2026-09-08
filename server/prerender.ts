// server/prerender.ts
// Prerender.io integration middleware for social crawlers (Facebook, WhatsApp, Twitter, etc.)
import type { Request, Response, NextFunction } from 'express';
import https from 'https';

export const PRERENDER_TOKEN = (process.env.PRERENDER_TOKEN || '2lshcvOJnuE2xAxcEKrH').trim();

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
  'quora link preview',
  'w3c_validator',
  'embedly'
];

const IGNORED_EXTENSIONS = [
  '.js', '.css', '.xml', '.less', '.png', '.jpg', '.jpeg', '.gif',
  '.pdf', '.doc', '.txt', '.ico', '.rss', '.zip', '.mp3', '.rar',
  '.exe', '.wmv', '.doc', '.avi', '.ppt', '.mpg', '.mpeg', '.tif',
  '.wav', '.mov', '.psd', '.ai', '.xls', '.mp4', '.m4a', '.swf',
  '.dat', '.dmg', '.iso', '.flv', '.m4v', '.torrent', '.woff', '.woff2', '.ttf', '.svg'
];

export function isBotRequest(req: Request): boolean {
  const userAgent = req.headers['user-agent'] || '';
  if (!userAgent || typeof userAgent !== 'string') return false;
  
  const ua = userAgent.toLowerCase();
  const matchesBot = BOT_USER_AGENTS.some((bot) => ua.includes(bot));
  if (!matchesBot) return false;

  const url = (req.originalUrl || req.url || '').toLowerCase().split('?')[0];
  const hasIgnoredExt = IGNORED_EXTENSIONS.some((ext) => url.endsWith(ext));
  if (hasIgnoredExt) return false;

  if (url.startsWith('/api') || url.startsWith('/uploads') || url.startsWith('/@') || url.startsWith('/src') || url.startsWith('/node_modules')) {
    return false;
  }

  return true;
}

/**
 * Proxies crawler requests directly to Prerender.io using the account token.
 * Returns true if handled by Prerender, false if it should fall back to local renderer.
 */
export async function proxyToPrerender(req: Request, res: Response): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const host = req.headers['x-forwarded-host'] || req.headers.host || 'www.bhaktianandaodiatvofficial.blog';
      const protocol = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'https');
      const targetUrl = `${protocol}://${host}${req.originalUrl || req.url}`;
      const prerenderEndpoint = `https://service.prerender.io/${targetUrl}`;
      const userAgent = req.headers['user-agent'] || 'facebookexternalhit/1.1';

      console.log(`[Prerender.io] 🤖 Bot detected (${userAgent.slice(0, 40)}...). Proxying: ${targetUrl}`);

      const requestOptions = {
        headers: {
          'X-Prerender-Token': PRERENDER_TOKEN,
          'User-Agent': userAgent,
          'Accept-Encoding': 'gzip'
        },
        timeout: 4500 // 4.5s timeout to prevent hanging bot connections
      };

      const prerenderReq = https.get(prerenderEndpoint, requestOptions, (prerenderRes) => {
        let body = '';
        prerenderRes.setEncoding('utf8');

        prerenderRes.on('data', (chunk) => {
          body += chunk;
        });

        prerenderRes.on('end', () => {
          const statusCode = prerenderRes.statusCode || 200;
          if (statusCode >= 200 && statusCode < 400 && body && body.includes('<html')) {
            res.status(statusCode);
            res.setHeader('Content-Type', 'text/html; charset=UTF-8');
            res.setHeader('X-Prerender', '1');
            res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
            res.send(body);
            resolve(true);
          } else {
            console.warn(`[Prerender.io] Received non-200/invalid response (${statusCode}). Falling back to local OG renderer.`);
            resolve(false);
          }
        });
      });

      prerenderReq.on('timeout', () => {
        console.warn('[Prerender.io] Request timed out. Gracefully falling back to local OG renderer.');
        prerenderReq.destroy();
        resolve(false);
      });

      prerenderReq.on('error', (err) => {
        console.warn('[Prerender.io] Request error:', err.message);
        resolve(false);
      });
    } catch (err) {
      console.warn('[Prerender.io] Unexpected exception:', err);
      resolve(false);
    }
  });
}
