import { DailyPanchang, SpiritualStory, UnifiedFeedItem } from '../types';
import { db, sanitizeFirestoreData } from './firebase';
import { collection, doc, setDoc, getDocs, getDoc, onSnapshot, deleteDoc, updateDoc } from 'firebase/firestore';
import { getTemplesFromLocal } from './templeApi';
import { getDistrictItems } from './districtApi';
import { autoPublishStoryHtmlToS3 } from './publishStoryHtml';

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
// PANCHANG HELPERS
// =======================================================================

function isDummyPanchang(p: DailyPanchang | null | undefined): boolean {
  if (!p) return true;
  // If it has hardcoded demo strings from the initial template
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

  try {
    const docRef = doc(db, 'content_panchang', 'today');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as DailyPanchang;
      if (!isDummyPanchang(data)) {
        localStorage.setItem(LOCAL_STORAGE_PANCHANG, JSON.stringify(data));
        return data;
      } else {
        // Clean legacy demo doc from firestore
        deleteDoc(docRef).catch(() => {});
        localStorage.removeItem(LOCAL_STORAGE_PANCHANG);
        return null;
      }
    } else {
      return null;
    }
  } catch (err) {
    console.warn('Firestore panchang error, returning null:', err);
    return null;
  }
}

export function subscribeDailyPanchang(callback: (panchang: DailyPanchang | null) => void): () => void {
  // Emit local/current first
  getDailyPanchang().then(callback).catch(() => callback(null));

  try {
    const docRef = doc(db, 'content_panchang', 'today');
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as DailyPanchang;
          if (!isDummyPanchang(data)) {
            localStorage.setItem(LOCAL_STORAGE_PANCHANG, JSON.stringify(data));
            callback(data);
          } else {
            deleteDoc(docRef).catch(() => {});
            localStorage.removeItem(LOCAL_STORAGE_PANCHANG);
            callback(null);
          }
        } else {
          localStorage.removeItem(LOCAL_STORAGE_PANCHANG);
          callback(null);
        }
      },
      (err) => {
        console.warn('Panchang subscription warning:', err);
      }
    );
  } catch (err) {
    console.warn('Panchang listener setup error:', err);
    return () => {};
  }
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

  try {
    const docRef = doc(db, 'content_panchang', 'today');
    await setDoc(docRef, sanitizeFirestoreData(updated), { merge: true });
  } catch (err) {
    console.warn('Firestore save panchang error:', err);
  }

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

  const contentText = item.content || item.description || item.summary || item.excerpt || 'ପବିତ୍ର ଆଧ୍ୟାତ୍ମିକ କାହାଣୀ...';
  const summaryText = item.summary || item.description || (contentText ? contentText.slice(0, 150) + '...' : '');

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
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_STORIES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const clean = sanitizeStoryList(parsed);
        if (clean.length > 0) {
          localStorage.setItem(LOCAL_STORAGE_STORIES, JSON.stringify(clean));
          return clean;
        }
      }
    }
  } catch (err) {
    console.warn('Error reading local stories:', err);
  }

  try {
    const snap = await getDocs(collection(db, 'spiritual_stories'));
    if (!snap.empty) {
      const allDocs = snap.docs.map((d) => d.data());
      const clean = sanitizeStoryList(allDocs);
      // Clean up legacy dummy docs from Firestore
      for (const d of snap.docs) {
        if (isDummyStory(d.data() as SpiritualStory)) {
          deleteDoc(doc(db, 'spiritual_stories', d.id)).catch(() => {});
        }
      }
      localStorage.setItem(LOCAL_STORAGE_STORIES, JSON.stringify(clean));
      return clean;
    }
  } catch (err) {
    console.warn('Firestore stories error, bypassing:', err);
  }

  // Fallback to local storage if available
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_STORIES);
    if (raw) {
      const parsed = JSON.parse(raw);
      const clean = sanitizeStoryList(parsed);
      if (clean.length > 0) return clean;
    }
  } catch {}

  // Fallback to fetch /posts.json
  try {
    const res = await fetch('/posts.json');
    if (res.ok) {
      const posts = await res.json();
      const arr = Object.values(posts);
      const clean = sanitizeStoryList(arr);
      if (clean.length > 0) {
        localStorage.setItem(LOCAL_STORAGE_STORIES, JSON.stringify(clean));
        return clean;
      }
    }
  } catch {}

  return [];
}

export function subscribeSpiritualStories(callback: (stories: SpiritualStory[]) => void): () => void {
  getSpiritualStories().then(callback).catch(() => callback([]));

  try {
    return onSnapshot(
      collection(db, 'spiritual_stories'),
      (snap) => {
        if (!snap.empty) {
          const stories = sanitizeStoryList(snap.docs.map((d) => d.data()));
          localStorage.setItem(LOCAL_STORAGE_STORIES, JSON.stringify(stories));
          if (stories.length > 0) {
            try {
              fetch('/api/stories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stories }),
              }).catch(() => {});
            } catch {}
          }
          callback(stories);
        } else {
          // If Firestore is empty, try posts.json fallback
          fetch('/posts.json')
            .then((r) => r.json())
            .then((posts) => {
              const clean = sanitizeStoryList(Object.values(posts));
              callback(clean);
            })
            .catch(() => callback([]));
        }
      },
      (err) => {
        console.warn('Stories subscription warning, trying posts.json fallback:', err);
        // Fallback to local or posts.json
        try {
          const raw = localStorage.getItem(LOCAL_STORAGE_STORIES);
          if (raw) {
            const clean = sanitizeStoryList(JSON.parse(raw));
            if (clean.length > 0) {
              callback(clean);
              return;
            }
          }
        } catch {}

        fetch('/posts.json')
          .then((r) => r.json())
          .then((posts) => {
            const clean = sanitizeStoryList(Object.values(posts));
            callback(clean);
          })
          .catch(() => callback([]));
      }
    );
  } catch (err) {
    console.warn('Stories listener setup error:', err);
    fetch('/posts.json')
      .then((r) => r.json())
      .then((posts) => callback(sanitizeStoryList(Object.values(posts))))
      .catch(() => callback([]));
    return () => {};
  }
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

  try {
    fetch('/api/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ story: updatedStory }),
    }).catch(() => {});
  } catch {}

  try {
    await setDoc(doc(db, 'spiritual_stories', updatedStory.id), sanitizeFirestoreData(updatedStory));
  } catch (err) {
    console.warn('Firestore save story error:', err);
  }

  // Automatically publish static HTML directly to AWS S3 storage for instant social preview
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

  try {
    fetch(`/api/stories/${encodeURIComponent(storyId)}`, {
      method: 'DELETE',
    }).catch(() => {});
  } catch {}

  try {
    await deleteDoc(doc(db, 'spiritual_stories', storyId));
  } catch (err) {
    console.warn('Firestore delete story error:', err);
  }
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

  try {
    const docRef = doc(db, 'spiritual_stories', storyId);
    await updateDoc(docRef, { likesCount: updatedLikes });
  } catch (err) {
    console.warn('Firestore like error:', err);
  }

  return updatedLikes;
}

// =======================================================================
// UNIFIED MIXED FEED (Custom Posts + Temples + Purana + District Content)
// =======================================================================
export async function getAllContent(): Promise<UnifiedFeedItem[]> {
  try {
    const [stories, temples, districtItems] = await Promise.all([
      getSpiritualStories().catch(() => []),
      Promise.resolve(getTemplesFromLocal()).catch(() => []),
      getDistrictItems().catch(() => []),
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
