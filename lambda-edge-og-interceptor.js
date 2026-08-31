// lambda-edge-og-interceptor.js
// Deploy this as a Lambda@Edge Function (Viewer Request or Origin Request) in us-east-1 on your CloudFront distribution.
'use strict';

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
  'applebot'
];

const DEFAULT_IMAGE = 'https://bhakti-ananda-photos.s3.ap-south-1.amazonaws.com/posts/1788176622987_4bud51.jpg';
const DEFAULT_TITLE = 'Bhakti Ananda Odia TV | ଶ୍ରୀ ମନ୍ଦିର ଅନଲାଇନ୍ ପୂଜା ବୁକିଂ, ଓଡ଼ିଶା ଦର୍ଶନ ଓ ଆଧ୍ୟାତ୍ମିକ କଥା';
const DEFAULT_DESC = 'ଭକ୍ତି ଆନନ୍ଦ ଓଡ଼ିଆ TV - ସମ୍ପୂର୍ଣ୍ଣ ବୈଦିକ ପୂଜା ସାମଗ୍ରୀ ସୂଚୀ, ପ୍ରାମାଣିକ ଓଡ଼ିଆ କ୍ୟାଲେଣ୍ଡର ପାଞ୍ଜି, ଅନଲାଇନ୍ ମନ୍ଦିର ପୂଜା ବୁକିଂ ଏବଂ ଆଧ୍ୟାତ୍ମିକ କଥା।';

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

function isBot(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some(bot => ua.includes(bot));
}

exports.handler = async (event) => {
  const request = event.Records[0].cf.request;
  const headers = request.headers;
  const userAgent = headers['user-agent'] ? headers['user-agent'][0].value : '';

  // 1. If it's a normal human user, pass through to SPA without modification
  if (!isBot(userAgent)) {
    return request;
  }

  // 2. Extract path, query parameters & host
  const uri = request.uri || '/';
  const queryString = request.querystring || '';
  const searchParams = new URLSearchParams(queryString);
  const host = headers['host'] ? headers['host'][0].value : 'www.bhaktianandaodiatvofficial.blog';
  const canonicalUrl = `https://${host}${uri}${queryString ? '?' + queryString : ''}`;

  let title = DEFAULT_TITLE;
  let description = DEFAULT_DESC;
  let imageUrl = DEFAULT_IMAGE;

  // Query parameter overrides
  if (searchParams.get('og_title') || searchParams.get('title')) {
    title = searchParams.get('og_title') || searchParams.get('title');
  }
  if (searchParams.get('og_desc') || searchParams.get('desc')) {
    description = searchParams.get('og_desc') || searchParams.get('desc');
  }
  if (searchParams.get('og_image') || searchParams.get('img') || searchParams.get('image')) {
    imageUrl = searchParams.get('og_image') || searchParams.get('img') || searchParams.get('image');
  }

  // Path routing
  if (uri.includes('/temple/')) {
    const templeId = uri.split('/temple/')[1]?.split('/')[0];
    if (templeId === 'jagannath') {
      title = '🚩 ଶ୍ରୀ ଜଗନ୍ନାଥ ମନ୍ଦିର (ପୁରୀ) - ଅନଲାଇନ୍ ପୂଜା ବୁକିଂ | Bhakti Ananda Odia TV';
      imageUrl = 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?q=80&w=1200&auto=format&fit=crop';
    } else if (templeId === 'lingaraj') {
      title = '🚩 ଶ୍ରୀ ଲିଙ୍ଗରାଜ ମନ୍ଦିର (ଭୁବନେଶ୍ୱର) - ଅନଲାଇନ୍ ପୂଜା ବୁକିଂ | Bhakti Ananda Odia TV';
      imageUrl = 'https://images.unsplash.com/photo-1627894483216-2138af692e32?q=80&w=1200&auto=format&fit=crop';
    } else if (templeId === 'samaleswari') {
      title = '🚩 ମା\' ସମଲେଶ୍ୱରୀ ମନ୍ଦିର (ସମ୍ବଲପୁର) - ଅନଲାଇନ୍ ପୂଜା ବୁକିଂ | Bhakti Ananda Odia TV';
      imageUrl = 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=1200&auto=format&fit=crop';
    }
  } else if (uri.includes('/story/') || uri.includes('/blog/')) {
    const parts = uri.split('/').filter(Boolean);
    const storyId = parts[1] || uri.replace(/^\/(story|blog)\//, '').split('/')[0];
    const cleanId = decodeURIComponent(storyId);
    if (STORY_METADATA[cleanId] || STORY_METADATA[`/story/${cleanId}`]) {
      const match = STORY_METADATA[cleanId] || STORY_METADATA[`/story/${cleanId}`];
      title = match.title;
      description = match.desc || match.description;
      imageUrl = match.image || match.imageUrl;
    } else {
      title = `📖 ଧାର୍ମିକ କଥା: ${cleanId.replace(/-/g, ' ')} | Bhakti Ananda Odia TV`;
      description = 'ପ୍ରଭୁ ଜଗନ୍ନାଥ ଓ ଓଡ଼ିଶାର ପ୍ରାମାଣିକ ପୌରାଣିକ ଆଧ୍ୟାତ୍ମିକ କଥା ପଢ଼ନ୍ତୁ।';
    }
  } else if (uri.includes('/panchang')) {
    title = '📅 ଆଜିର ଓଡ଼ିଆ କ୍ୟାଲେଣ୍ଡର ଓ ପଞ୍ଜିକା | Bhakti Ananda Odia TV';
  } else if (uri.includes('/store')) {
    title = '🛍️ ଶୁଦ୍ଧ ବୈଦିକ ପୂଜା ସାମଗ୍ରୀ ଷ୍ଟୋର୍ | Bhakti Ananda Odia TV';
  }

  // Direct parameter overrides take final precedence
  if (searchParams.get('og_title') || searchParams.get('title')) {
    title = searchParams.get('og_title') || searchParams.get('title');
  }
  if (searchParams.get('og_desc') || searchParams.get('desc')) {
    description = searchParams.get('og_desc') || searchParams.get('desc');
  }
  if (searchParams.get('og_image') || searchParams.get('img') || searchParams.get('image')) {
    imageUrl = searchParams.get('og_image') || searchParams.get('img') || searchParams.get('image');
  }

  // Generate bot-friendly HTML
  const html = `<!DOCTYPE html>
<html lang="or">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <link rel="canonical" href="${canonicalUrl}" />
  <meta property="og:site_name" content="Bhakti Ananda Odia TV & Puja Samagri Portal" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:secure_url" content="${imageUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${imageUrl}" />
</head>
<body>
  <h1>${title}</h1>
  <p>${description}</p>
  <img src="${imageUrl}" alt="${title}" />
  <script>window.location.href = "${canonicalUrl}";</script>
</body>
</html>`;

  return {
    status: '200',
    statusDescription: 'OK',
    headers: {
      'content-type': [{ key: 'Content-Type', value: 'text/html; charset=UTF-8' }],
      'cache-control': [{ key: 'Cache-Control', value: 'public, max-age=300' }]
    },
    body: html
  };
};
