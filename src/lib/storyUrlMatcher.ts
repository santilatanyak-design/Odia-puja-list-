/**
 * storyUrlMatcher.ts
 * Robust resolver for external social media links (AWS S3 URLs, image URLs, slugs, story IDs).
 * Ensures that external links with ?url=, ?image=, etc. immediately load the exact matching post.
 */

import { SpiritualStory } from '../types';

export function normalizeStoryItem(item: any): SpiritualStory | null {
  if (!item) return null;
  const id = String(item.id || item.slug || '').replace(/^(\/)?story\//i, '').replace(/\.html?$/i, '').trim();
  if (!id) return null;

  return {
    id: id.startsWith('story-') ? id : `story-${id}`,
    title: item.title || 'ଆଧ୍ୟାତ୍ମିକ କଥା',
    category: item.category || 'ଆଧ୍ୟାତ୍ମିକ',
    summary: item.summary || item.description || (item.content ? item.content.slice(0, 140) + '...' : ''),
    content: item.content || item.summary || item.description || 'ପବିତ୍ର କଥା...',
    imageUrl: item.imageUrl || item.image || '',
    author: item.author || 'Bhakti Ananda Odia TV',
    readTimeMinutes: Number(item.readTimeMinutes) || 3,
    publishedAt: item.publishedAt ? String(item.publishedAt).split('T')[0] : '2026-01-01',
    likesCount: Number(item.likesCount) || 0,
    isFeatured: Boolean(item.isFeatured),
    affiliateAd: item.affiliateAd
  };
}

/**
 * Extracts external story parameter from URL search parameters or pathname.
 * Handles ?url=, ?image=, ?img=, ?imageUrl=, ?s3=, ?s3Url=, ?storyId=, ?story=, ?slug=, ?id=, etc.
 */
export function extractExternalStoryParam(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const params = new URLSearchParams(window.location.search);
    
    // Explicit priority check for external parameters
    const candidates = [
      'url',
      'image',
      'img',
      'imageUrl',
      's3',
      's3Url',
      'aws',
      'awsUrl',
      'storyId',
      'story',
      'postId',
      'post',
      'slug',
      'id',
      'article'
    ];

    for (const key of candidates) {
      const val = params.get(key);
      if (val && val.trim()) {
        try {
          return decodeURIComponent(val.trim());
        } catch {
          return val.trim();
        }
      }
    }

    // Check pathname: e.g. /story/story-782845 or /story/1788792181674_5n0r5b.jpg
    const rawPath = window.location.pathname;
    const parts = rawPath.split('/').filter(Boolean);
    if (parts.length > 1) {
      const prefix = parts[0].toLowerCase();
      if (prefix === 'story' || prefix === 'blog' || prefix === 'stories' || prefix === 'post' || prefix === 'posts') {
        const rawSlug = parts.slice(1).join('/');
        try {
          return decodeURIComponent(rawSlug).replace(/\.html?$/i, '').replace(/\/$/, '').trim() || null;
        } catch {
          return rawSlug.replace(/\.html?$/i, '').replace(/\/$/, '').trim() || null;
        }
      }
    }
  } catch (e) {
    console.warn('Error reading URL parameters:', e);
  }

  return null;
}

/**
 * Finds the matching post from candidate posts given any external query.
 * Matches by ID, clean ID, full AWS URL, image filename, S3 hash, or slug.
 */
export function matchStoryFromExternalQuery(rawQuery: string, postsObjOrList: any): SpiritualStory | null {
  if (!rawQuery) return null;

  let allPosts: any[] = [];
  let postsMap: Record<string, any> = {};

  if (Array.isArray(postsObjOrList)) {
    allPosts = postsObjOrList;
  } else if (postsObjOrList && typeof postsObjOrList === 'object') {
    postsMap = postsObjOrList;
    allPosts = Object.values(postsObjOrList);
  }

  if (allPosts.length === 0) return null;

  const decoded = decodeURIComponent(rawQuery).trim();
  const clean = decoded.replace(/^https?:\/\//i, '').replace(/\.html?$/i, '').replace(/\/$/, '').trim();
  const filename = clean.split('/').pop() || '';
  const baseFilename = filename.replace(/\.(jpg|jpeg|png|webp|gif|html)$/i, '').replace(/-(meta|thumb)$/i, '').trim();
  const baseFilenameClean = baseFilename.replace(/^story-/, '').trim();
  const idWithoutStory = clean.replace(/^(\/)?(story|post|posts|blog|stories)\//i, '').replace(/^story-/, '').trim();

  // 1. Direct key match in map
  if (postsMap[clean]) return normalizeStoryItem(postsMap[clean]);
  if (postsMap[`/story/${clean}`]) return normalizeStoryItem(postsMap[`/story/${clean}`]);
  if (postsMap[`story-${clean}`]) return normalizeStoryItem(postsMap[`story-${clean}`]);
  if (postsMap[`story-${idWithoutStory}`]) return normalizeStoryItem(postsMap[`story-${idWithoutStory}`]);
  if (postsMap[`/story/story-${idWithoutStory}`]) return normalizeStoryItem(postsMap[`/story/story-${idWithoutStory}`]);

  // 2. Comprehensive search across all posts
  const matched = allPosts.find((p) => {
    if (!p) return false;
    const pid = String(p.id || '').trim();
    const pCleanId = pid.replace(/^story-/, '').trim();
    const pImg = String(p.image || p.imageUrl || '').trim();
    const pImgClean = pImg.replace(/^https?:\/\//i, '').trim();
    const pImgFilename = pImg.split('/').pop() || '';
    const pImgBase = pImgFilename.replace(/\.(jpg|jpeg|png|webp|gif|html)$/i, '').trim();

    // Exact ID matches
    if (pid && (pid === clean || pid === idWithoutStory || pid === decoded)) return true;
    if (pCleanId && (pCleanId === clean || pCleanId === idWithoutStory || pCleanId === decoded)) return true;
    if (clean === `/story/${pid}` || clean === `/story/${pCleanId}`) return true;
    if (filename === pid || filename === pCleanId) return true;
    if (baseFilename === pid || baseFilenameClean === pCleanId || baseFilename === pCleanId) return true;

    // S3 URL or meta filename contains the story ID (e.g. story-782845 in .../posts/story-782845-meta.jpg)
    if (pid && (clean.includes(pid) || filename.includes(pid))) return true;
    if (pCleanId && pCleanId.length >= 5 && (clean.includes(pCleanId) || filename.includes(pCleanId))) return true;

    // Image URL matches
    if (pImg) {
      if (pImg === decoded || pImgClean === clean) return true;
      if (clean.includes(pImgClean) || pImgClean.includes(clean)) return true;
    }

    // Image filename matches (e.g. 1788792181674_5n0r5b.jpg)
    if (pImgFilename && (clean.includes(pImgFilename) || filename === pImgFilename)) return true;

    // Base timestamp / hash match (e.g. 1788792181674_5n0r5b)
    if (pImgBase && pImgBase.length >= 6) {
      if (clean.includes(pImgBase) || baseFilename.includes(pImgBase) || pImgBase.includes(baseFilename)) return true;
    }

    return false;
  });

  return matched ? normalizeStoryItem(matched) : null;
}

/**
 * Loads stories from localStorage and public/posts.json, then matches the external query.
 */
export async function fetchAndMatchStory(query: string): Promise<SpiritualStory | null> {
  if (!query) return null;

  // 1. Check local storage first (handles freshly edited / updated posts)
  try {
    const localRaw = typeof window !== 'undefined' ? localStorage.getItem('spiritual_stories_v1') : null;
    if (localRaw) {
      const parsed = JSON.parse(localRaw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const localMatch = matchStoryFromExternalQuery(query, parsed);
        if (localMatch) return localMatch;
      }
    }
  } catch (err) {
    console.warn('Local storage matcher error:', err);
  }

  // 2. Fetch posts.json
  try {
    const res = await fetch('/posts.json');
    if (res.ok) {
      const posts = await res.json();
      const match = matchStoryFromExternalQuery(query, posts);
      if (match) return match;
    }
  } catch (err) {
    console.warn('posts.json matcher error:', err);
  }

  return null;
}
