import { db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { TempleShort } from '../types';

export const DEFAULT_SHORTS: TempleShort[] = [];

const LOCAL_SHORTS_KEY = 'temple_puja_shorts_list';
const SHORTS_DOC_ID = 'all_shorts';

/**
 * Extracts YouTube 11-char Video ID from any format:
 * - https://www.youtube.com/shorts/ID?si=...
 * - https://youtube.com/shorts/ID?feature=share
 * - https://youtu.be/ID?si=...
 * - https://www.youtube.com/watch?v=ID&si=...
 * - https://www.youtube.com/watch?feature=share&v=ID
 * - https://m.youtube.com/shorts/ID
 * - https://www.youtube.com/embed/ID
 * - https://www.youtube.com/live/ID
 * - Plain 11-char ID
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // Pure 11-char alphanumeric/underscore/dash ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // 1. Try URL parsing to cleanly handle query parameters like ?si=..., ?v=..., etc.
  try {
    const rawUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://') 
      ? trimmed 
      : `https://${trimmed}`;
    const parsed = new URL(rawUrl);

    // Check search param 'v'
    const vParam = parsed.searchParams.get('v');
    if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) {
      return vParam;
    }

    // Check pathname segments
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      // youtu.be/ID
      if (parsed.hostname.includes('youtu.be')) {
        const id = pathParts[0];
        if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) {
          return id;
        }
      }

      // /shorts/ID, /embed/ID, /live/ID, /v/ID
      for (let i = 0; i < pathParts.length; i++) {
        const segment = pathParts[i].toLowerCase();
        if (['shorts', 'embed', 'live', 'v'].includes(segment) && pathParts[i + 1]) {
          const id = pathParts[i + 1];
          if (/^[a-zA-Z0-9_-]{11}$/.test(id)) {
            return id;
          }
        }
      }
    }
  } catch (e) {
    // If standard URL parsing fails, fallback to regex
  }

  // 2. Regex fallbacks
  const regexPatterns = [
    /(?:youtube\.com\/(?:shorts\/|embed\/|v\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const reg of regexPatterns) {
    const match = trimmed.match(reg);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Returns a clean, normalized canonical YouTube Shorts URL without tracking parameters
 */
export function normalizeYouTubeShortUrl(url: string): string {
  const videoId = extractYouTubeId(url);
  if (!videoId) return url.trim();
  return `https://www.youtube.com/shorts/${videoId}`;
}

/**
 * Generates an optimized responsive YouTube iframe Embed URL
 */
export function getYouTubeEmbedUrl(url: string, autoplay: boolean = true): string {
  const videoId = extractYouTubeId(url);
  if (!videoId) return url;

  // We add parameters for seamless autoplay, looping, and hiding clutter
  const params = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    mute: '0',
    loop: '1',
    playlist: videoId,
    playsinline: '1',
    rel: '0',
    modestbranding: '1',
    controls: '1',
    enablejsapi: '1',
  });

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

/**
 * Get YouTube Thumbnail Preview URL
 */
export function getYouTubeThumbnailUrl(url: string): string {
  const videoId = extractYouTubeId(url);
  if (!videoId) {
    return 'https://images.unsplash.com/photo-1627894483216-2138af692e32?q=80&w=800&auto=format&fit=crop';
  }
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Get stored shorts from localStorage fallback
 */
export function getLocalShorts(): TempleShort[] {
  try {
    const raw = localStorage.getItem(LOCAL_SHORTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading local shorts:', e);
  }
  return DEFAULT_SHORTS;
}

/**
 * Get all shorts (Firestore first with localStorage fallback)
 */
export async function getTempleShorts(): Promise<TempleShort[]> {
  try {
    const docRef = doc(db, 'temple_shorts_config', SHORTS_DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data?.shorts) && data.shorts.length > 0) {
        localStorage.setItem(LOCAL_SHORTS_KEY, JSON.stringify(data.shorts));
        return data.shorts as TempleShort[];
      }
    }
  } catch (err) {
    console.warn('Failed to fetch shorts from Firestore, using local fallback:', err);
  }
  return getLocalShorts();
}

/**
 * Save all shorts to Firestore and localStorage
 */
export async function saveTempleShorts(shorts: TempleShort[]): Promise<boolean> {
  try {
    const cleanList = shorts.map((s, idx) => {
      const cleanUrl = normalizeYouTubeShortUrl(s.youtubeUrl || '');
      return {
        id: s.id || `short-${Date.now()}-${idx}`,
        title: (s.title || '').trim() || 'ମନ୍ଦିର ପୂଜା ଭିଡିଓ (Temple Puja Video)',
        youtubeUrl: cleanUrl,
        templeName: (s.templeName || '').trim() || 'ଓଡ଼ିଶା ପ୍ରସିଦ୍ଧ ମନ୍ଦିର',
        templeId: s.templeId || '',
        description: (s.description || '').trim(),
        createdAt: s.createdAt || new Date().toISOString(),
      };
    }).filter((s) => s.youtubeUrl.length > 0 && extractYouTubeId(s.youtubeUrl) !== null);

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(LOCAL_SHORTS_KEY, JSON.stringify(cleanList));
      }
    } catch (e) {}

    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('temple_shorts_updated', { detail: cleanList }));
      }
    } catch (e) {}

    const docRef = doc(db, 'temple_shorts_config', SHORTS_DOC_ID);
    await setDoc(docRef, {
      shorts: cleanList,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    return true;
  } catch (err) {
    console.error('Error saving temple shorts:', err);
    return false;
  }
}

/**
 * Subscribe in real-time to Temple Shorts updates
 */
export function subscribeTempleShorts(callback: (shorts: TempleShort[]) => void): () => void {
  // 1. Trigger immediately with local cache
  callback(getLocalShorts());

  const handleLocalUpdate = (e: any) => {
    if (e.detail) {
      callback(e.detail);
    } else {
      callback(getLocalShorts());
    }
  };

  window.addEventListener('temple_shorts_updated', handleLocalUpdate);
  window.addEventListener('storage', handleLocalUpdate);

  // 2. Attach Firestore listener
  let unsubFs: (() => void) | null = null;
  try {
    const docRef = doc(db, 'temple_shorts_config', SHORTS_DOC_ID);
    unsubFs = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data?.shorts)) {
            try {
              if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.setItem(LOCAL_SHORTS_KEY, JSON.stringify(data.shorts));
              }
            } catch (e) {}
            callback(data.shorts as TempleShort[]);
          }
        }
      },
      (err) => {
        console.warn('Firestore shorts snapshot error fallback:', err);
      }
    );
  } catch (err) {
    console.warn('Error setting up firestore shorts subscription:', err);
  }

  return () => {
    window.removeEventListener('temple_shorts_updated', handleLocalUpdate);
    window.removeEventListener('storage', handleLocalUpdate);
    if (unsubFs) unsubFs();
  };
}
