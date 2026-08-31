import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { SpiritualStory } from '../src/types';

let firebaseConfig: Record<string, any> = {
  projectId: 'evident-quality-d40ks',
  appId: '1:1082236902872:web:7d91416ab47f9d8693e6ad',
  apiKey: 'AIzaSyAZJ7IYlhSIA4n3ZFS6WfLUdYpYWTdE_-o',
  authDomain: 'evident-quality-d40ks.firebaseapp.com',
  firestoreDatabaseId: 'ai-studio-remixpujasamagri-17b24a13-3233-4aaf-aaee-fb51d8caed6b',
};

try {
  const cfgPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(cfgPath)) {
    const raw = fs.readFileSync(cfgPath, 'utf-8');
    firebaseConfig = { ...firebaseConfig, ...JSON.parse(raw) };
  }
} catch (e) {
  console.warn('[Firebase Server Sync] Could not load config file, using fallback', e);
}

const firebaseServerApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const customDbId =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? firebaseConfig.firestoreDatabaseId
    : undefined;

export const serverFirestore = (() => {
  try {
    return initializeFirestore(
      firebaseServerApp,
      {
        experimentalAutoDetectLongPolling: true,
      },
      customDbId
    );
  } catch {
    return customDbId ? getFirestore(firebaseServerApp, customDbId) : getFirestore(firebaseServerApp);
  }
})();

// In-memory cache of stories for fast synchronous access
let cachedStories: Map<string, SpiritualStory> = new Map();

/**
 * Updates posts.json on disk with the given story
 */
export function updatePostsJson(story: SpiritualStory) {
  if (!story || !story.id) return;
  try {
    const cleanId = story.id.replace(/^(\/)?story\//i, '').replace(/\.html?$/i, '').replace(/\/$/, '').trim();
    const postsJsonPath = path.join(process.cwd(), 'posts.json');
    let postsData: Record<string, any> = {};
    if (fs.existsSync(postsJsonPath)) {
      try {
        postsData = JSON.parse(fs.readFileSync(postsJsonPath, 'utf-8'));
      } catch {}
    }

    const title = story.title || 'Bhakti Ananda Odia TV';
    const description = (story.summary || story.content || '').slice(0, 160);
    const image = story.imageUrl || 'https://www.bhaktianandaodiatvofficial.blog/brand-banner.svg';

    const postObj = {
      id: cleanId,
      title,
      description,
      image,
      author: story.author || 'Bhakti Ananda Odia TV',
    };

    postsData[`/story/${cleanId}`] = postObj;
    postsData[`/story/${cleanId}.html`] = postObj;
    postsData[`/story/${cleanId}/`] = postObj;
    postsData[`/story/${cleanId}/index.html`] = postObj;
    postsData[cleanId] = postObj;
    postsData[`${cleanId}.html`] = postObj;

    fs.writeFileSync(postsJsonPath, JSON.stringify(postsData, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Firebase Server Sync] Error writing posts.json:', err);
  }
}

/**
 * Fetches all stories from Firestore and updates posts.json & in-memory cache
 */
export async function syncAllStoriesFromFirestore(): Promise<SpiritualStory[]> {
  try {
    const snap = await getDocs(collection(serverFirestore, 'spiritual_stories'));
    if (!snap.empty) {
      const stories: SpiritualStory[] = [];
      snap.docs.forEach((docSnap) => {
        const data = docSnap.data() as SpiritualStory;
        if (data && data.id) {
          const cleanId = data.id.replace(/^(\/)?story\//i, '').replace(/\.html?$/i, '').replace(/\/$/, '').trim();
          cachedStories.set(data.id, data);
          cachedStories.set(cleanId, data);
          cachedStories.set(cleanId.toLowerCase(), data);
          cachedStories.set(`${cleanId}.html`, data);
          updatePostsJson(data);
          stories.push(data);
        }
      });
      console.log(`[Firebase Server Sync] 🔄 Successfully synchronized ${stories.length} stories from Firestore.`);
      return stories;
    }
  } catch (err) {
    console.warn('[Firebase Server Sync] Could not fetch all stories from Firestore:', err);
  }
  return [];
}

/**
 * Retrieves a single story by ID: First from cache, then from Firestore if missing
 */
export async function getStoryById(storyId: string): Promise<SpiritualStory | null> {
  if (!storyId) return null;
  const cleanId = storyId.trim().replace(/^(\/)?story\//i, '').replace(/\.html?$/i, '').replace(/\/$/, '').trim();

  // 1. Check in-memory cache
  if (cachedStories.has(cleanId)) {
    return cachedStories.get(cleanId) || null;
  }
  if (cachedStories.has(cleanId.toLowerCase())) {
    return cachedStories.get(cleanId.toLowerCase()) || null;
  }
  if (cachedStories.has(storyId.trim())) {
    return cachedStories.get(storyId.trim()) || null;
  }

  // 2. Fetch directly from Firestore doc
  try {
    const docRef = doc(serverFirestore, 'spiritual_stories', cleanId);
    let snap = await getDoc(docRef);
    if (!snap.exists()) {
      const altId = cleanId.startsWith('story-') ? cleanId.replace('story-', '') : `story-${cleanId}`;
      snap = await getDoc(doc(serverFirestore, 'spiritual_stories', altId));
    }
    if (snap.exists()) {
      const data = snap.data() as SpiritualStory;
      if (data) {
        cachedStories.set(data.id || cleanId, data);
        cachedStories.set(cleanId, data);
        cachedStories.set(cleanId.toLowerCase(), data);
        updatePostsJson(data);
        return data;
      }
    }
  } catch (err) {
    console.warn(`[Firebase Server Sync] Error fetching single story (${cleanId}) from Firestore:`, err);
  }

  return null;
}

/**
 * Cache a story manually (e.g. from API POST)
 */
export function cacheStory(story: SpiritualStory) {
  if (story && story.id) {
    const cleanId = story.id.replace(/^(\/)?story\//i, '').replace(/\.html?$/i, '').replace(/\/$/, '').trim();
    cachedStories.set(story.id, story);
    cachedStories.set(cleanId, story);
    cachedStories.set(cleanId.toLowerCase(), story);
    cachedStories.set(`${cleanId}.html`, story);
    updatePostsJson(story);
  }
}
