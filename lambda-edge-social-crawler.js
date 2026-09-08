// lambda-edge-social-crawler.js
// Production-ready Lambda@Edge function for AWS CloudFront / Amplify distributions
'use strict';

// 1. All known social media and messaging crawler bot user agents
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
  'skypeuripreview',
  'vkshare',
  'quora link preview',
  'redditbot',
  'google-structured-data-testing-tool'
];

const DEFAULT_IMAGE = 'https://bhakti-ananda-photos.s3.ap-south-1.amazonaws.com/posts/1788176622987_4bud51.jpg';
const DEFAULT_TITLE = 'Bhakti Ananda Odia TV | ଶ୍ରୀ ମନ୍ଦିର ଅନଲାଇନ୍ ପୂଜା ବୁକିଂ, ଓଡ଼ିଶା ଦର୍ଶନ ଓ ଆଧ୍ୟାତ୍ମିକ କଥା';
const DEFAULT_DESC = 'ଭକ୍ତି ଆନନ୍ଦ ଓଡ଼ିଆ TV - ସମ୍ପୂର୍ଣ୍ଣ ବୈଦିକ ପୂଜା ସାମଗ୍ରୀ ସୂଚୀ, ପ୍ରାମାଣିକ ଓଡ଼ିଆ କ୍ୟାଲେଣ୍ଡର ପାଞ୍ଜି, ଅନଲାଇନ୍ ମନ୍ଦିର ପୂଜା ବୁକିଂ, ଓଡ଼ିଶାର ୩୦ ଜିଲ୍ଲା ଦର୍ଶନ ଏବଂ ଆଧ୍ୟାତ୍ମିକ ଭିଡିଓ।';

// 2. Lookup dictionary for temples
const TEMPLE_METADATA = {
  jagannath: {
    title: '🚩 ଶ୍ରୀ ଜଗନ୍ନାଥ ମନ୍ଦିର (ପୁରୀ) - ଅନଲାଇନ୍ ପୂଜା ବୁକିଂ | Bhakti Ananda Odia TV',
    desc: 'ଶ୍ରୀ ଜଗନ୍ନାଥ ମନ୍ଦିର ସ୍ୱତନ୍ତ୍ର ନୀତିକାନ୍ତି ଓ ମହାପ୍ରସାଦ ପୂଜା ବୁକିଂ। ଶ୍ରୀକ୍ଷେତ୍ର ଧାମ, ପୁରୀ।',
    image: 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?q=80&w=1200&auto=format&fit=crop'
  },
  lingaraj: {
    title: '🚩 ଶ୍ରୀ ଲିଙ୍ଗରାଜ ମନ୍ଦିର (ଭୁବନେଶ୍ୱର) - ଜଳାଭିଷେକ ଓ ପୂଜା ବୁକିଂ | Bhakti Ananda Odia TV',
    desc: 'ପବିତ୍ର ଜଳାଭିଷେକ ଓ ସ୍ୱତନ୍ତ୍ର ପୂଜା ସେବା। ଏକାମ୍ର କ୍ଷେତ୍ର, ଭୁବନେଶ୍ୱର।',
    image: 'https://images.unsplash.com/photo-1627894483216-2138af692e32?q=80&w=1200&auto=format&fit=crop'
  },
  samaleswari: {
    title: '🚩 ଶ୍ରୀ ମା\' ସମଲେଶ୍ୱରୀ ମନ୍ଦିର (ସମ୍ବଲପୁର) - ପୂଜା ବୁକିଂ | Bhakti Ananda Odia TV',
    desc: 'ମା\' ସମଲେଶ୍ୱରୀଙ୍କ ପୀଠରେ ଜଳାଭିଷେକ, ଭୋଗ ଓ ମାନସିକ ପୂଜା ସେବା। ସମ୍ବଲପୁର, ଓଡ଼ିଶା।',
    image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=1200&auto=format&fit=crop'
  }
};

// 2.5. Lookup dictionary for stories and articles
const STORY_METADATA = {
  'story-962286': {
    title: '📖 ​ମା\' : ଯିଏ ନିଜେ ଉପାସ ରହି ପିଲାଙ୍କୁ ଖୁଆଏ, ଆଜି ସେ ବୃଦ୍ଧାଶ୍ରମରେ କାହିଁକି? | Bhakti Ananda Odia TV',
    desc: 'ଯେଉଁ ଗର୍ଭରେ ଆମେ ୯ ମାସ ସବୁଠାରୁ ସୁରକ୍ଷିତ ଥିଲେ, ଆଜି ସେହି ମା\' ପାଇଁ ଆମର ବିଶାଳ କୋଠାରେ ଟିକିଏ ଜାଗା ନାହିଁ।',
    image: 'https://bhakti-ananda-photos.s3.ap-south-1.amazonaws.com/posts/1788067389102_8acy9q.jpg'
  },
  'story-529058': {
    title: '📖 ବିବାହରେ ବିଳମ୍ବ ଦୂର କରିବା ଓ ଆଦର୍ଶ ଜୀବନସଙ୍ଗୀନୀ ପାଇବା ପାଇଁ ବିଶେଷ ଉପାୟ: | Bhakti Ananda Odia TV',
    desc: 'ଆପଣଙ୍କ ବିବାହ ବିଳମ୍ବ ହେଉଛି କି? ବିବାହିତ ଜୀବନରେ ସଦା ତର୍କ ଓ ବିବାଦ ଦୂର କରିବାର ବିଶେଷ ଉପାୟ ପଢ଼ନ୍ତୁ।',
    image: 'https://cdn.phototourl.com/free/2026-08-18-18fecda2-7349-45ca-90e8-0c39ce0a06a7.jpg'
  },
  'story-576843': {
    title: '📖 ମା’ ଗୋଜ ବାୟାଣୀ - ଚମତ୍କାର ଆଧ୍ୟାତ୍ମିକ କାହାଣୀ | Bhakti Ananda Odia TV',
    desc: 'ମା’ ଗୋଜ ବାୟାଣୀଙ୍କ ଲୀଳା ଅନନ୍ତ - ଚମତ୍କାର କାହାଣୀ ପଢ଼ନ୍ତୁ।',
    image: 'https://cdn.phototourl.com/free/2026-08-17-4f4e0173-30b0-460a-8cd7-e897762f0166.jpg'
  }
};

// 3. Lookup dictionary for core app sections
const SECTION_METADATA = {
  panchang: {
    title: '📅 ଆଜିର ଓଡ଼ିଆ କ୍ୟାଲେଣ୍ଡର ଓ ପଞ୍ଜିକା (Panchang 2025-2026) | Bhakti Ananda Odia TV',
    desc: 'ଆଜିର ତିଥି, ନକ୍ଷତ୍ର, ଶୁଭ ବେଳା, ରାହୁ କାଳ ଓ ସମସ୍ତ ଓଡ଼ିଆ ପର୍ବପର୍ବାଣୀ ସୂଚୀ।',
    image: 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?q=80&w=1200&auto=format&fit=crop'
  },
  shorts: {
    title: '📱 ଭକ୍ତି ସର୍ଟସ୍ ଓ ଆଧ୍ୟାତ୍ମିକ ଭିଡିଓ (Bhakti Shorts) | Bhakti Ananda Odia TV',
    desc: 'ପ୍ରତିଦିନ ଦେଖନ୍ତୁ ଓଡ଼ିଶାର ପ୍ରସିଦ୍ଧ ମନ୍ଦିର ଦର୍ଶନ, ମହାପ୍ରସାଦ ଓ ଭକ୍ତି ସର୍ଟସ୍ ଭିଡିଓ।',
    image: 'https://images.unsplash.com/photo-1627894483216-2138af692e32?q=80&w=1200&auto=format&fit=crop'
  },
  store: {
    title: '🛍️ ଶୁଦ୍ଧ ବୈଦିକ ପୂଜା ସାମଗ୍ରୀ ଷ୍ଟୋର୍ (Online Puja Store) | Bhakti Ananda Odia TV',
    desc: 'ଶୁଦ୍ଧ ବୈଦିକ ପୂଜା ସାମଗ୍ରୀ, ମୂର୍ତ୍ତି, ଧୂପ, ଦୀପ ଓ ଆଧ୍ୟାତ୍ମିକ ସାମଗ୍ରୀ ଘରେ ବସି କିଣନ୍ତୁ।',
    image: 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?q=80&w=1200&auto=format&fit=crop'
  },
  'puri-store': {
    title: '🛕 ପୁରୀ ମନ୍ଦିର ସ୍ୱତନ୍ତ୍ର ପୂଜା ସାମଗ୍ରୀ ଓ ନିର୍ମାଲ୍ୟ ସେବା | Bhakti Ananda Odia TV',
    desc: 'ପୁରୀ ଶ୍ରୀକ୍ଷେତ୍ରର ସ୍ୱତନ୍ତ୍ର ନିର୍ମାଲ୍ୟ, ତୁଳସୀ ମାଳା ଓ ପ୍ରସାଦ ବୁକ୍ କରନ୍ତୁ।',
    image: 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?q=80&w=1200&auto=format&fit=crop'
  },
  blog: {
    title: '📖 ଓଡ଼ିଆ ଧାର୍ମିକ ଓ ପୌରାଣିକ କଥା (Spiritual Blog) | Bhakti Ananda Odia TV',
    desc: 'ପ୍ରଭୁ ଜଗନ୍ନାଥଙ୍କ ଲୀଳା, ଶିବ ପୁରାଣ ଓ ଓଡ଼ିଶାର ପବିତ୍ର ଧାର୍ମିକ କଥା ପଢ଼ନ୍ତୁ।',
    image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=1200&auto=format&fit=crop'
  }
};

function isCrawler(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some(bot => ua.includes(bot));
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

exports.handler = async (event) => {
  const request = event.Records[0].cf.request;
  const headers = request.headers;
  const userAgent = headers['user-agent'] ? headers['user-agent'][0].value : '';

  // 1. If NOT a crawler bot, let the request pass directly to the Amplify React SPA
  if (!isCrawler(userAgent)) {
    return request;
  }

  // 2. Bot detected: Parse the URL path and query parameters
  const uri = request.uri || '/';
  const queryString = request.querystring || '';
  const searchParams = new URLSearchParams(queryString);
  const host = headers['host'] ? headers['host'][0].value : 'www.bhaktianandaodiatvofficial.blog';
  const fullUrl = `https://${host}${uri}${queryString ? '?' + queryString : ''}`;

  let title = DEFAULT_TITLE;
  let description = DEFAULT_DESC;
  let imageUrl = DEFAULT_IMAGE;

  // Direct share link parameter overrides (e.g. ?og_title=...&og_image=...)
  if (searchParams.get('og_title') || searchParams.get('title')) {
    title = searchParams.get('og_title') || searchParams.get('title');
  }
  if (searchParams.get('og_desc') || searchParams.get('desc')) {
    description = searchParams.get('og_desc') || searchParams.get('desc');
  }
  if (searchParams.get('og_image') || searchParams.get('img') || searchParams.get('image')) {
    imageUrl = searchParams.get('og_image') || searchParams.get('img') || searchParams.get('image');
  }

  // Route: /temple/:id
  if (uri.startsWith('/temple/')) {
    const templeKey = uri.replace('/temple/', '').split('/')[0].toLowerCase();
    if (TEMPLE_METADATA[templeKey]) {
      title = TEMPLE_METADATA[templeKey].title;
      description = TEMPLE_METADATA[templeKey].desc;
      imageUrl = TEMPLE_METADATA[templeKey].image;
    } else {
      title = `🚩 ${templeKey.toUpperCase()} Temple - ଅନଲାଇନ୍ ପୂଜା ବୁକିଂ | Bhakti Ananda Odia TV`;
    }
  }

  // Route: /story/:id or /blog/:id
  else if (uri.startsWith('/story/') || uri.startsWith('/blog/')) {
    const storySlug = uri.replace(/^\/(story|blog)\//, '').split('/')[0];
    const cleanId = decodeURIComponent(storySlug);
    if (STORY_METADATA[cleanId] || STORY_METADATA[`/story/${cleanId}`]) {
      const match = STORY_METADATA[cleanId] || STORY_METADATA[`/story/${cleanId}`];
      title = match.title;
      description = match.desc || match.description;
      imageUrl = match.image || match.imageUrl;
    } else {
      title = `📖 ଧାର୍ମିକ କଥା: ${cleanId.replace(/-/g, ' ')} | Bhakti Ananda Odia TV`;
      description = 'ପ୍ରଭୁ ଜଗନ୍ନାଥ ଓ ଓଡ଼ିଶାର ପ୍ରାମାଣିକ ପୌରାଣିକ ଆଧ୍ୟାତ୍ମିକ କଥା ପଢ଼ନ୍ତୁ।';
    }
  }

  // Route: /district/:districtId/:itemId
  else if (uri.startsWith('/district/')) {
    const parts = uri.replace('/district/', '').split('/');
    const districtId = parts[0] || '';
    const itemId = parts[1] || '';
    title = `🛕 ${decodeURIComponent(itemId || districtId).replace(/-/g, ' ')} - ଓଡ଼ିଶା ଦର୍ଶନ | Bhakti Ananda Odia TV`;
    description = 'ଓଡ଼ିଶାର ପ୍ରସିଦ୍ଧ ତୀର୍ଥକ୍ଷେତ୍ର ଓ ୩୦ ଜିଲ୍ଲା ଦର୍ଶନ।';
  }

  // Route: /store/:id or /product/:id
  else if (uri.startsWith('/store/') || uri.startsWith('/product/')) {
    const prodId = uri.replace(/^\/(store|product)\//, '').split('/')[0];
    title = `🛍️ ${decodeURIComponent(prodId).replace(/-/g, ' ')} | ଶୁଦ୍ଧ ପୂଜା ସାମଗ୍ରୀ | Bhakti Ananda Odia TV`;
    description = 'ଶୁଦ୍ଧ ବୈଦିକ ପୂଜା ସାମଗ୍ରୀ ଘରେ ବସି ଅର୍ଡର କରନ୍ତୁ।';
  }

  // Core section routes
  else {
    for (const [key, meta] of Object.entries(SECTION_METADATA)) {
      if (uri === `/${key}` || uri.startsWith(`/${key}/`)) {
        title = meta.title;
        description = meta.desc;
        imageUrl = meta.image;
        break;
      }
    }
  }

  // 2.8. Final Dynamic Override: Direct URL Query Parameters Always Win
  if (searchParams.get('og_title') || searchParams.get('title')) {
    title = searchParams.get('og_title') || searchParams.get('title');
  }
  if (searchParams.get('og_desc') || searchParams.get('desc')) {
    description = searchParams.get('og_desc') || searchParams.get('desc');
  }
  if (searchParams.get('og_image') || searchParams.get('img') || searchParams.get('image')) {
    imageUrl = searchParams.get('og_image') || searchParams.get('img') || searchParams.get('image');
  }

  // 3. Return clean raw HTML with Open Graph and Twitter tags directly to the bot
  const cleanTitle = escapeHtml(title);
  const cleanDesc = escapeHtml(description);
  const cleanImg = escapeHtml(imageUrl);
  const cleanUrl = escapeHtml(fullUrl);

  const rawBotHtml = `<!DOCTYPE html>
<html lang="or" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="UTF-8" />
  <title>${cleanTitle}</title>
  <meta name="description" content="${cleanDesc}" />
  <link rel="canonical" href="${cleanUrl}" />
  <meta property="og:site_name" content="Bhakti Ananda Odia TV &amp; Puja Samagri Portal" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${cleanTitle}" />
  <meta property="og:description" content="${cleanDesc}" />
  <meta property="og:url" content="${cleanUrl}" />
  <meta property="og:image" content="${cleanImg}" />
  <meta property="og:image:secure_url" content="${cleanImg}" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${cleanTitle}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${cleanTitle}" />
  <meta name="twitter:description" content="${cleanDesc}" />
  <meta name="twitter:image" content="${cleanImg}" />
  <meta name="twitter:image:src" content="${cleanImg}" />
</head>
<body>
  <h1>${cleanTitle}</h1>
  <p>${cleanDesc}</p>
  <img src="${cleanImg}" alt="${cleanTitle}" width="1200" height="630" />
  <script>window.location.replace("${cleanUrl}");</script>
</body>
</html>`;

  return {
    status: '200',
    statusDescription: 'OK',
    headers: {
      'content-type': [{ key: 'Content-Type', value: 'text/html; charset=UTF-8' }],
      'cache-control': [{ key: 'Cache-Control', value: 'public, max-age=300, s-maxage=600' }]
    },
    body: rawBotHtml
  };
};
