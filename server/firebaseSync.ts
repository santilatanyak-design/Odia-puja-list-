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
        experimentalForceLongPolling: true,
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
    console.log('[Firebase Server Sync] Fetching bypassed (Quota or Offline). Using cache.');
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

  // 2. Fetch directly from Firestore doc using REST API to prevent SDK hangs
  try {
    const projectId = firebaseConfig.projectId || 'evident-quality-d40ks';
    const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
    
    // We try the provided ID first, then fallback to "story-ID"
    let docId = cleanId;
    let url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/spiritual_stories/${docId}`;
    
    let res = await fetch(url);
    if (!res.ok) {
      docId = cleanId.startsWith('story-') ? cleanId.replace('story-', '') : `story-${cleanId}`;
      url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/spiritual_stories/${docId}`;
      res = await fetch(url);
    }
    
    if (res.ok) {
      const snap = await res.json();
      if (snap && snap.fields) {
        // Parse Firestore REST format
        const parseValue = (val: any): any => {
          if (!val) return null;
          if (val.stringValue !== undefined) return val.stringValue;
          if (val.integerValue !== undefined) return parseInt(val.integerValue, 10);
          if (val.doubleValue !== undefined) return parseFloat(val.doubleValue);
          if (val.booleanValue !== undefined) return val.booleanValue;
          if (val.mapValue !== undefined && val.mapValue.fields) {
            const mapRes: any = {};
            for (const [k, v] of Object.entries(val.mapValue.fields)) {
              mapRes[k] = parseValue(v);
            }
            return mapRes;
          }
          if (val.arrayValue !== undefined && val.arrayValue.values) {
            return val.arrayValue.values.map((v: any) => parseValue(v));
          }
          return null;
        };
        
        const data: any = {};
        for (const [k, v] of Object.entries(snap.fields)) {
          data[k] = parseValue(v);
        }
        
        if (data && (data.id || data.title)) {
          const finalData = data as SpiritualStory;
          cachedStories.set(finalData.id || cleanId, finalData);
          cachedStories.set(cleanId, finalData);
          cachedStories.set(cleanId.toLowerCase(), finalData);
          updatePostsJson(finalData);
          return finalData;
        }
      }
    }
  } catch (err) {
    console.warn(`[Firebase Server Sync] Error fetching single story (${cleanId}) via REST API:`, err);
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
