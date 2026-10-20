'use client';

import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

let cachedAuth: Auth | null = null;

/**
 * Initialised lazily, and only in the browser.
 *
 * Calling getAuth() at module scope breaks `next build`: the root layout renders
 * on the server while prerendering, this module is evaluated there, and the
 * Firebase SDK throws because there is no browser to attach to. Deferring the
 * call keeps every auth interaction on the client, where it belongs.
 *
 * getApps() is checked because Fast Refresh re-runs this module during dev.
 */
export function getFirebaseAuth(): Auth {
  if (typeof window === 'undefined') {
    throw new Error('Firebase Auth is browser-only — call this from a client component.');
  }

  if (!cachedAuth) {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    cachedAuth = getAuth(app);
  }

  return cachedAuth;
}
