import * as admin from 'firebase-admin';
import { CachedRecipe, CachedRecipeSchema } from './schemas';

let db: admin.firestore.Firestore;

export function initializeFirebase() {
  if (!db) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (!projectId || !privateKey || !clientEmail) {
      throw new Error('Missing Firebase credentials in environment variables');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey,
        clientEmail,
      }),
    });

    db = admin.firestore();
  }

  return db;
}

export const recipeCache = {
  async get(key: string): Promise<CachedRecipe | null> {
    try {
      const db = initializeFirebase();
      const doc = await db.collection('recipes').doc(key).get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data();
      const validated = CachedRecipeSchema.parse(data);
      return validated;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  async set(key: string, data: Partial<CachedRecipe>): Promise<void> {
    try {
      const db = initializeFirebase();
      const now = Date.now();

      const cacheEntry: Partial<CachedRecipe> = {
        ...data,
        cacheKey: key,
        updatedAt: now,
        createdAt: data.createdAt || now,
      };

      await db.collection('recipes').doc(key).set(cacheEntry, { merge: true });
    } catch (error) {
      console.error('Cache set error:', error);
      throw error;
    }
  },
};

export function createCacheKey(inputs: Record<string, any>): string {
  const sorted = Object.keys(inputs)
    .sort()
    .reduce((acc, key) => {
      acc[key] = inputs[key];
      return acc;
    }, {} as Record<string, any>);

  return Buffer.from(JSON.stringify(sorted)).toString('base64');
}
