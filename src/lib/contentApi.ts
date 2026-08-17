import { DailyPanchang, SpiritualStory } from '../types';
import { db, sanitizeFirestoreData } from './firebase';
import { collection, doc, setDoc, getDocs, getDoc, onSnapshot, deleteDoc, updateDoc } from 'firebase/firestore';

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

function sanitizeStoryList(stories: SpiritualStory[]): SpiritualStory[] {
  if (!Array.isArray(stories)) return [];
  return stories.filter((s) => !isDummyStory(s));
}

export async function getSpiritualStories(): Promise<SpiritualStory[]> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_STORIES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const clean = sanitizeStoryList(parsed);
        localStorage.setItem(LOCAL_STORAGE_STORIES, JSON.stringify(clean));
        return clean;
      }
    }
  } catch (err) {
    console.warn('Error reading local stories:', err);
  }

  try {
    const snap = await getDocs(collection(db, 'spiritual_stories'));
    if (!snap.empty) {
      const allDocs = snap.docs.map((d) => d.data() as SpiritualStory);
      const clean = sanitizeStoryList(allDocs);
      // Clean up legacy dummy docs from Firestore
      for (const d of snap.docs) {
        if (isDummyStory(d.data() as SpiritualStory)) {
          deleteDoc(doc(db, 'spiritual_stories', d.id)).catch(() => {});
        }
      }
      localStorage.setItem(LOCAL_STORAGE_STORIES, JSON.stringify(clean));
      return clean;
    } else {
      localStorage.setItem(LOCAL_STORAGE_STORIES, JSON.stringify([]));
      return [];
    }
  } catch (err) {
    console.warn('Firestore stories error, returning empty list:', err);
    return [];
  }
}

export function subscribeSpiritualStories(callback: (stories: SpiritualStory[]) => void): () => void {
  getSpiritualStories().then(callback).catch(() => callback([]));

  try {
    return onSnapshot(
      collection(db, 'spiritual_stories'),
      (snap) => {
        if (!snap.empty) {
          const stories = sanitizeStoryList(snap.docs.map((d) => d.data() as SpiritualStory));
          localStorage.setItem(LOCAL_STORAGE_STORIES, JSON.stringify(stories));
          callback(stories);
        } else {
          localStorage.setItem(LOCAL_STORAGE_STORIES, JSON.stringify([]));
          callback([]);
        }
      },
      (err) => {
        console.warn('Stories subscription warning:', err);
      }
    );
  } catch (err) {
    console.warn('Stories listener setup error:', err);
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
      title: story.title || current?.title || 'ନୂତନ ଆଧ୍ୟାତ୍ମିକ କାହାଣୀ',
      category: story.category || current?.category || 'ଜଗନ୍ନାଥ ଲୀଳା',
      summary: story.summary || current?.summary || '',
      content: story.content || current?.content || '',
      imageUrl: story.imageUrl || current?.imageUrl || 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?q=80&w=1000&auto=format&fit=crop',
      author: story.author || current?.author || 'ପଣ୍ଡିତ ମହାଶୟ',
      readTimeMinutes: Number(story.readTimeMinutes) || current?.readTimeMinutes || 4,
      likesCount: story.likesCount ?? current?.likesCount ?? 0,
      publishedAt: story.publishedAt || current?.publishedAt || new Date().toISOString().split('T')[0],
      isFeatured: story.isFeatured ?? current?.isFeatured ?? false,
    };
  } else {
    const newId = 'story-' + Math.floor(100000 + Math.random() * 900000);
    updatedStory = {
      id: newId,
      title: story.title || 'ନୂତନ ଆଧ୍ୟାତ୍ମିକ କାହାଣୀ',
      category: story.category || 'ଜଗନ୍ନାଥ ଲୀଳା',
      summary: story.summary || '',
      content: story.content || '',
      imageUrl: story.imageUrl || 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?q=80&w=1000&auto=format&fit=crop',
      author: story.author || 'ପଣ୍ଡିତ ମହାଶୟ',
      readTimeMinutes: Number(story.readTimeMinutes) || 4,
      likesCount: 0,
      publishedAt: new Date().toISOString().split('T')[0],
      isFeatured: story.isFeatured ?? false,
    };
  }

  const newStories = [
    updatedStory,
    ...existing.filter((s) => s.id !== updatedStory.id),
  ];

  localStorage.setItem(LOCAL_STORAGE_STORIES, JSON.stringify(newStories));

  try {
    await setDoc(doc(db, 'spiritual_stories', updatedStory.id), sanitizeFirestoreData(updatedStory));
  } catch (err) {
    console.warn('Firestore save story error:', err);
  }

  return updatedStory;
}

export async function deleteSpiritualStory(storyId: string): Promise<boolean> {
  const existing = await getSpiritualStories();
  const filtered = existing.filter((s) => s.id !== storyId);
  localStorage.setItem(LOCAL_STORAGE_STORIES, JSON.stringify(filtered));

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
