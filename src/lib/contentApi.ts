import { DailyPanchang, SpiritualStory, UnifiedFeedItem } from '../types';
import { getTemplesFromLocal } from './templeApi';
import { getDistrictItems } from './districtApi';
import { autoPublishStoryHtmlToS3 } from './publishStoryHtml';
import { matchStoryFromExternalQuery } from './storyUrlMatcher';
import { getClientAwsConfig } from './s3Upload';

const LOCAL_STORAGE_PANCHANG = 'odisha_daily_panchang';
const LOCAL_STORAGE_STORIES = 'odisha_spiritual_stories';

export const DEFAULT_PANCHANG: DailyPanchang = {
  id: 'today_panchang',
  date: '',
  odiaDateText: '',
  odiaMonth: '',
  paksha: '',
  tithi: '',
  nakshatra: '',
  yoga: '',
  karana: '',
  sunrise: '',
  sunset: '',
  moonrise: '',
  rahukala: '',
  amritabela: '',
  brahmaMuhurta: '',
  gulikaKala: '',
  yamaganda: '',
  specialFestival: '',
  dailyAdvice: '',
  fastingInfo: '',
  updatedAt: '',
};

export const DEFAULT_STORIES: SpiritualStory[] = [];

// =======================================================================
// PANCHANG HELPERS (AWS S3 & Local Storage Based - Zero Firestore)
// =======================================================================

function isDummyPanchang(p: DailyPanchang | null | undefined): boolean {
  if (!p) return true;
  if (p.odiaDateText && p.odiaDateText.includes('ଭାଦ୍ରବ ୧୩, ୧୪୩୩')) return true;
  if (p.tithi && p.tithi.includes('ତ୍ରୟୋଦଶୀ ଦିବା ୧୨:୪୦')) return true;
  if (p.specialFestival && p.specialFestival.includes('ଗହ୍ମା ପୂର୍ଣ୍ଣିମା ପୂର୍ବ ପ୍ରସ୍ତୁତି')) return true;
  return false;
}

export async function getDailyPanchang(): Promise<DailyPanchang | null> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PANCHANG);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.tithi && !isDummyPanchang(parsed)) {
        return parsed;
      } else if (isDummyPanchang(parsed)) {
        localStorage.removeItem(LOCAL_STORAGE_PANCHANG);
      }
    }
  } catch (err) {
    console.warn('Error reading local panchang:', err);
  }

  // Try fetching from backend /api/panchang or S3
  try {
    const res = await fetch(`/api/panchang?t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.tithi && !isDummyPanchang(data)) {
        localStorage.setItem(LOCAL_STORAGE_PANCHANG, JSON.stringify(data));
        return data;
      }
    }
  } catch {}

  // Fallback to S3 panchang if present
  try {
    const config = getClientAwsConfig();
    const bucket = config.bucket || 'bhakti-ananda-photos';
    const region = config.region || 'ap-south-1';
    const s3Res = await fetch(`https://${bucket}.s3.${region}.amazonaws.com/panchang/today.json?t=${Date.now()}`);
    if (s3Res.ok) {
      const s3Data = await s3Res.json();
      if (s3Data && s3Data.tithi && !isDummyPanchang(s3Data)) {
        localStorage.setItem(LOCAL_STORAGE_PANCHANG, JSON.stringify(s3Data));
        return s3Data;
      }
    }
  } catch {}

  return null;
}

export function subscribeDailyPanchang(callback: (panchang: DailyPanchang | null) => void): () => void {
  // Emit local/current first
  getDailyPanchang().then(callback).catch(() => callback(null));

  const handleStorage = (e: StorageEvent) => {
    if (e.key === LOCAL_STORAGE_PANCHANG) {
      getDailyPanchang().then(callback).catch(() => callback(null));
    }
  };

  const handleCustomEvent = () => {
    getDailyPanchang().then(callback).catch(() => callback(null));
  };

  window.addEventListener('storage', handleStorage);
  window.addEventListener('panchang_updated', handleCustomEvent);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener('panchang_updated', handleCustomEvent);
  };
}

export async function saveDailyPanchang(panchang: Partial<DailyPanchang>): Promise<DailyPanchang> {
  const current = (await getDailyPanchang()) || DEFAULT_PANCHANG;
  const updated: DailyPanchang = {
    ...current,
    ...panchang,
    id: 'today_panchang',
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(LOCAL_STORAGE_PANCHANG, JSON.stringify(updated));
  window.dispatchEvent(new Event('panchang_updated'));

  // Save to backend server
  try {
    fetch('/api/panchang', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ panchang: updated }),
    }).catch(() => {});
  } catch {}

  return updated;
}

// =======================================================================
// SPIRITUAL STORIES HELPERS
// =======================================================================

function isDummyStory(s: SpiritualStory): boolean {
  if (!s || !s.id) return true;
  return (
    s.id === 'story-salabega' ||
    s.id === 'story-manika' ||
    s.id === 'story-shiva-jalabhishek' ||
    (s.title && s.title.includes('କାଞ୍ଚି ଅଭିଯାନ')) ||
    (s.title && s.title.includes('ଭକ୍ତ ସାଲବେଗ')) ||
    (s.title && s.title.includes('ଶିବ ଜଳାଭିଷେକର'))
  );
}

export function normalizeStory(item: any): SpiritualStory | null {
  if (!item) return null;
  const rawId = String(item.id || item.storyId || '');
  const cleanId = rawId.replace(/^(\/)?story\//i, '').replace(/\.html?$/i, '').replace(/\/$/, '').trim();
  if (!cleanId) return null;

  let contentText = item.content || item.description || item.summary || item.excerpt || 'ପବିତ୍ର ଆଧ୍ୟାତ୍ମିକ କାହାଣୀ...';
  if (Array.isArray(contentText)) contentText = contentText.join('\n\n');
  else contentText = String(contentText);
  
  let summaryText = item.summary || item.description || (contentText ? contentText.slice(0, 150) + '...' : '');
  if (Array.isArray(summaryText)) summaryText = summaryText.join(' ');
  else summaryText = String(summaryText);

  return {
    id: cleanId,
    title: item.title || 'ଆଧ୍ୟାତ୍ମିକ କାହାଣୀ',
    summary: summaryText,
    content: contentText,
    imageUrl: item.imageUrl || item.image || item.photoUrl || 'https://www.bhaktianandaodiatvofficial.blog/brand-banner.svg',
    author: item.author || 'ଭକ୍ତି ଆନନ୍ଦ ଓଡ଼ିଆ TV',
    category: item.category || 'ଆଧ୍ୟାତ୍ମିକ କାହାଣୀ',
    readTimeMinutes: Number(item.readTimeMinutes) || 3,
    publishedAt: item.publishedAt || item.createdAt || new Date().toISOString().split('T')[0],
    likesCount: Number(item.likesCount) || 12,
    affiliateAd: item.affiliateAd || undefined,
  };
}

function sanitizeStoryList(stories: any[]): SpiritualStory[] {
  if (!Array.isArray(stories)) return [];
  const map = new Map<string, SpiritualStory>();
  stories.forEach((s) => {
    if (s && !isDummyStory(s)) {
      const normalized = normalizeStory(s);
      if (normalized && normalized.id && !map.has(normalized.id)) {
        map.set(normalized.id, normalized);
      }
    }
  });
  return Array.from(map.values());
}

export async function getSpiritualStories(): Promise<SpiritualStory[]> {
  const storyMap = new Map<string, SpiritualStory>();

  // 1. Add DEFAULT_STORIES as base
  DEFAULT_STORIES.forEach((s) => {
    if (s && s.id) storyMap.set(s.id, s);
  });

  // 2. Load all posts from /posts.json with cache busting
  try {
    const res = await fetch(`/posts.json?t=${Date.now()}`);
    if (res.ok) {
      const posts = await res.json();
      const arr = Object.values(posts);
      const clean = sanitizeStoryList(arr);
      clean.forEach((s) => {
        if (s && s.id) storyMap.set(s.id, s);
      });
    }
  } catch (err) {
    console.warn('Error loading /posts.json:', err);
  }

  // 3. Load from AWS S3 direct posts.json if available
  try {
    const config = getClientAwsConfig();
    const bucket = config.bucket || 'bhakti-ananda-photos';
    const region = config.region || 'ap-south-1';
    const s3Res = await fetch(`https://${bucket}.s3.${region}.amazonaws.com/posts.json?t=${Date.now()}`);
    if (s3Res.ok) {
      const s3Posts = await s3Res.json();
      const arr = Object.values(s3Posts);
      const clean = sanitizeStoryList(arr);
      clean.forEach((s) => {
        if (s && s.id) storyMap.set(s.id, s);
      });
    }
  } catch {}

  // 4. Merge with localStorage cache from BOTH storage keys
  try {
    for (const key of [LOCAL_STORAGE_STORIES, 'spiritual_stories_v1']) {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const clean = sanitizeStoryList(parsed);
          clean.forEach((s) => {
            if (s && s.id) storyMap.set(s.id, s);
          });
        }
      }
    }
  } catch (err) {
    console.warn('Error reading local stories:', err);
  }

  // 5. Merge from backend /api/stories
  try {
    const apiRes = await fetch('/api/stories');
    if (apiRes.ok) {
      const apiStories = await apiRes.json();
      if (Array.isArray(apiStories)) {
        const clean = sanitizeStoryList(apiStories);
        clean.forEach((s) => {
          if (s && s.id) storyMap.set(s.id, s);
        });
      }
    }
  } catch {}

  const allStories = Array.from(storyMap.values());
  try {
    localStorage.setItem(LOCAL_STORAGE_STORIES, JSON.stringify(allStories));
    localStorage.setItem('spiritual_stories_v1', JSON.stringify(allStories));
  } catch {}

  return allStories;
}

export function subscribeSpiritualStories(callback: (stories: SpiritualStory[]) => void): () => void {
  getSpiritualStories().then(callback).catch(() => callback([]));

  const handleUpdate = () => {
    getSpiritualStories().then(callback).catch(() => callback([]));
  };
  
  window.addEventListener('storage', handleUpdate);
  return () => {
    window.removeEventListener('storage', handleUpdate);
  };
}

/**
 * Multi-layer resolver for a single story by ID or URL query parameter.
 * Used when a visitor clicks on a social media link (Facebook / WhatsApp / etc.)
 * Checks:
 *  1. Local storage (both keys)
 *  2. /posts.json (cache-busted)
 *  3. AWS S3 direct JSON files (Bucket: bhakti-ananda-photos)
 *  4. /api/stories/ID backend endpoint
 */
export async function fetchStoryByIdOrQuery(targetIdOrQuery: string): Promise<SpiritualStory | null> {
  if (!targetIdOrQuery || !targetIdOrQuery.trim()) return null;
  const decoded = decodeURIComponent(targetIdOrQuery).trim();
  const cleanId = decoded
    .replace(/^https?:\/\//i, '')
    .replace(/^(\/)?(story|blog|stories|post|posts)\//i, '')
    .replace(/\.html?$/i, '')
    .replace(/\/$/, '')
    .trim();
  const idWithoutStory = cleanId.replace(/^story-/, '').trim();
  const idWithStory = cleanId.startsWith('story-') ? cleanId : `story-${cleanId}`;

  // Layer 1: Check localStorage first (instant)
  try {
    if (typeof window !== 'undefined') {
      for (const key of [LOCAL_STORAGE_STORIES, 'spiritual_stories_v1']) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const match = matchStoryFromExternalQuery(decoded, parsed);
            if (match) return match;
          }
        }
      }
    }
  } catch {}

  // Layer 2: Check posts.json with fresh cache buster
  try {
    const res = await fetch(`/posts.json?t=${Date.now()}`);
    if (res.ok) {
      const posts = await res.json();
      const match = matchStoryFromExternalQuery(decoded, posts);
      if (match) return match;
    }
  } catch {}

  // ID variants to check in AWS S3 and server
  const idCandidates = Array.from(new Set([cleanId, idWithStory, idWithoutStory, decoded])).filter(
    (id) => Boolean(id) && id.length > 0 && id !== 'all'
  );

  // Layer 3: Query AWS S3 Direct JSON Files (Bucket: bhakti-ananda-photos)
  try {
    const config = getClientAwsConfig();
    const bucket = config.bucket || 'bhakti-ananda-photos';
    const region = config.region || 'ap-south-1';
    for (const docId of idCandidates) {
      const s3Urls = [
        `https://${bucket}.s3.${region}.amazonaws.com/posts/story-${encodeURIComponent(docId)}.json?t=${Date.now()}`,
        `https://${bucket}.s3.${region}.amazonaws.com/story/${encodeURIComponent(docId)}/story.json?t=${Date.now()}`,
        `https://${bucket}.s3.${region}.amazonaws.com/story/${encodeURIComponent(docId)}.json?t=${Date.now()}`,
        `https://${bucket}.s3.${region}.amazonaws.com/posts/story-${encodeURIComponent(docId)}.json`,
        `https://${bucket}.s3.${region}.amazonaws.com/story/${encodeURIComponent(docId)}.json`
      ];
      for (const s3Url of s3Urls) {
        try {
          const res = await fetch(s3Url);
          if (res.ok) {
            const s3Data = await res.json();
            const normalized = normalizeStory(s3Data);
            if (normalized) {
              try {
                const current = await getSpiritualStories();
                const updated = [normalized, ...current.filter((s) => s.id !== normalized.id)];
                localStorage.setItem(LOCAL_STORAGE_STORIES, JSON.stringify(updated));
                localStorage.setItem('spiritual_stories_v1', JSON.stringify(updated));
              } catch {}
              return normalized;
            }
          }
        } catch {}
      }
    }
  } catch {}

  // Layer 4: Query backend API /api/stories
  try {
    const res = await fetch(`/api/stories/${encodeURIComponent(cleanId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.story) {
        const normalized = normalizeStory(data.story);
        if (normalized) return normalized;
      }
    }
  } catch {}

  return null;
}

export async function saveSpiritualStory(story: Partial<SpiritualStory>): Promise<SpiritualStory> {
  const existing = await getSpiritualStories();
  let updatedStory: SpiritualStory;

  if (story.id) {
    const current = existing.find((s) => s.id === story.id);
    updatedStory = {
      id: story.id,
      title: story.title || current?.title || '',
      category: story.category || current?.category || '',
      summary: story.summary || current?.summary || '',
      content: story.content || current?.content || '',
      imageUrl: story.imageUrl || current?.imageUrl || '',
      author: story.author || current?.author || '',
      readTimeMinutes: Number(story.readTimeMinutes) || current?.readTimeMinutes || 0,
      likesCount: story.likesCount ?? current?.likesCount ?? 0,
      publishedAt: story.publishedAt || current?.publishedAt || new Date().toISOString().split('T')[0],
      isFeatured: story.isFeatured ?? current?.isFeatured ?? false,
      affiliateAd: story.affiliateAd !== undefined ? story.affiliateAd : current?.affiliateAd,
    };
  } else {
    const newId = 'story-' + Math.floor(100000 + Math.random() * 900000);
    updatedStory = {
      id: newId,
      title: story.title || '',
      category: story.category || '',
      summary: story.summary || '',
      content: story.content || '',
      imageUrl: story.imageUrl || '',
      author: story.author || '',
      readTimeMinutes: Number(story.readTimeMinutes) || 0,
      likesCount: 0,
      publishedAt: new Date().toISOString().split('T')[0],
      isFeatured: story.isFeatured ?? false,
      affiliateAd: story.affiliateAd,
    };
  }

  const newStories = [
    updatedStory,
    ...existing.filter((s) => s.id !== updatedStory.id),
  ];

  localStorage.setItem(LOCAL_STORAGE_STORIES, JSON.stringify(newStories));
  localStorage.setItem('spiritual_stories_v1', JSON.stringify(newStories));
  window.dispatchEvent(new Event('storage'));

  // Save to backend server
  try {
    fetch('/api/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ story: updatedStory }),
    }).catch(() => {});
  } catch {}

  // Automatically publish static HTML and story JSON directly to AWS S3 storage for instant social preview
  try {
    autoPublishStoryHtmlToS3(updatedStory).catch((s3Err) => {
      console.warn('Auto S3 HTML publish background error:', s3Err);
    });
  } catch {}

  return updatedStory;
}

export async function deleteSpiritualStory(storyId: string): Promise<boolean> {
  const existing = await getSpiritualStories();
  const filtered = existing.filter((s) => s.id !== storyId);
  localStorage.setItem(LOCAL_STORAGE_STORIES, JSON.stringify(filtered));
  localStorage.setItem('spiritual_stories_v1', JSON.stringify(filtered));
  window.dispatchEvent(new Event('storage'));

  try {
    fetch(`/api/stories/${encodeURIComponent(storyId)}`, {
      method: 'DELETE',
    }).catch(() => {});
  } catch {}

  return true;
}

export async function likeSpiritualStory(storyId: string): Promise<number> {
  const existing = await getSpiritualStories();
  const story = existing.find((s) => s.id === storyId);
  if (!story) return 0;

  const updatedLikes = (story.likesCount || 0) + 1;
  const updatedStories = existing.map((s) =>
    s.id === storyId ? { ...s, likesCount: updatedLikes } : s
  );
  localStorage.setItem(LOCAL_STORAGE_STORIES, JSON.stringify(updatedStories));
  localStorage.setItem('spiritual_stories_v1', JSON.stringify(updatedStories));

  try {
    fetch(`/api/stories/${encodeURIComponent(storyId)}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ likesCount: updatedLikes }),
    }).catch(() => {});
  } catch {}

  return updatedLikes;
}

// =======================================================================
// UNIFIED MIXED FEED (Custom Posts + Temples + Purana + District Content)
// =======================================================================
export async function getAllContent(): Promise<UnifiedFeedItem[]> {
  try {
    const withTimeout = <T>(promise: Promise<T>, ms = 5000): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
      ]);
    };

    const [stories, temples, districtItems] = await Promise.all([
      withTimeout(getSpiritualStories(), 4000).catch((e) => {
        console.warn('getSpiritualStories timeout/error:', e);
        return [];
      }),
      Promise.resolve(getTemplesFromLocal()).catch(() => []),
      withTimeout(getDistrictItems(), 4000).catch((e) => {
        console.warn('getDistrictItems timeout/error:', e);
        return [];
      }),
    ]);

    const unified: UnifiedFeedItem[] = [];

    // 1. Custom Spiritual Stories / Posts
    for (const story of stories) {
      if (!story.title && !story.content) continue;
      unified.push({
        id: story.id,
        title: story.title,
        category: story.category || 'ଆଧ୍ୟାତ୍ମିକ କଥା',
        summary: story.summary || (story.content ? story.content.slice(0, 140) + '...' : ''),
        content: story.content,
        imageUrl: story.imageUrl || '',
        author: story.author || '',
        readTimeMinutes: story.readTimeMinutes || 3,
        publishedAt: story.publishedAt || new Date().toISOString().split('T')[0],
        sourceType: 'custom_post',
        isFeatured: story.isFeatured,
        likesCount: story.likesCount,
        affiliateAd: story.affiliateAd,
        originalData: story,
      });
    }

    // 2. Temples Collection
    for (const temple of temples) {
      if (!temple.name) continue;
      unified.push({
        id: `temple-${temple.id}`,
        title: temple.name,
        category: 'ପବିତ୍ର ମନ୍ଦିର ଦର୍ଶନ',
        summary: temple.description || temple.history?.slice(0, 140) || 'ପବିତ୍ର ମନ୍ଦିର ଦର୍ଶନ ଓ ପୂଜା ସେବା।',
        content: temple.history || temple.description,
        imageUrl: temple.imageUrl || '',
        author: temple.location || '',
        readTimeMinutes: 4,
        publishedAt: '2026-01-01',
        sourceType: 'temple',
        isFeatured: false,
        originalData: temple,
      });
    }

    // 3. District Items (Purana & Heritage)
    for (const dItem of districtItems) {
      if (!dItem.title) continue;
      const isPurana = dItem.category === 'story' || dItem.districtNameOdia.includes('ପୁରାଣ');
      const affiliateUrl = (
        dItem.affiliateTargetUrl ||
        dItem.affiliateAd?.affiliateUrl ||
        ''
      ).trim();
      const productImageUrl = (
        dItem.affiliateProductImageUrl ||
        dItem.affiliateAd?.productImageUrl ||
        ''
      ).trim();
      const hasValidAd = Boolean(
        dItem.affiliateAd?.enabled !== false && affiliateUrl && productImageUrl
      );

      unified.push({
        id: `district-${dItem.id}`,
        title: dItem.title,
        category: isPurana ? 'ପୌରାଣିକ ଇତିହାସ' : `${dItem.districtNameOdia} - ${dItem.category === 'temple' ? 'ମନ୍ଦିର' : 'ପର୍ବପର୍ବାଣୀ'}`,
        summary: dItem.description ? dItem.description.slice(0, 140) + '...' : (dItem.significance || ''),
        content: dItem.description,
        imageUrl: dItem.imageUrl || '',
        author: `${dItem.districtNameOdia} ଐତିହ୍ୟ`,
        readTimeMinutes: 3,
        publishedAt: dItem.createdAt ? dItem.createdAt.split('T')[0] : '2026-01-01',
        sourceType: isPurana ? 'purana' : 'district_story',
        isFeatured: false,
        affiliateAd: hasValidAd
          ? {
              enabled: true,
              productTitle: dItem.affiliateProductTitle || dItem.affiliateAd?.productTitle || '',
              productDescription: dItem.affiliateAd?.productDescription || '',
              productImageUrl,
              affiliateUrl,
              countdownSeconds: dItem.affiliateAd?.countdownSeconds || 5,
            }
          : undefined,
        originalData: dItem,
      });
    }

    // Sort descending by publish date (newest first)
    unified.sort((a, b) => {
      const dateA = new Date(a.publishedAt).getTime() || 0;
      const dateB = new Date(b.publishedAt).getTime() || 0;
      return dateB - dateA;
    });

    return unified;
  } catch (err) {
    console.warn('Error fetching unified mixed feed:', err);
    return [];
  }
}
