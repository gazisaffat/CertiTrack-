'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User as FirebaseUser
} from 'firebase/auth';

import { getFirebaseAuth } from '@/lib/firebase';
import { api, setUnauthorizedHandler, tokenStore } from '@/lib/api';
import type { AppUser } from '@/lib/types';

interface AuthValue {
  user: AppUser | null;
  loading: boolean;
  isAdmin: boolean;
  registerWithEmail: (name: string, email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);
const googleProvider = new GoogleAuthProvider();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Trades the Firebase ID token for the app's own JWT. Role is decided
   * server-side and signed into that JWT — the client never asserts it.
   */
  const exchangeToken = useCallback(async (firebaseUser: FirebaseUser) => {
    const idToken = await firebaseUser.getIdToken();
    const { token, user: appUser } = await api.post<{ token: string; user: AppUser }>(
      '/api/auth/session',
      { idToken }
    );
    tokenStore.set(token);
    setUser(appUser);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      void signOut(getFirebaseAuth());
    });
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (firebaseUser) => {
      try {
        if (firebaseUser) {
          await exchangeToken(firebaseUser);
        } else {
          tokenStore.clear();
          setUser(null);
        }
      } catch (err) {
        console.error('[auth] session exchange failed:', err);
        tokenStore.clear();
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [exchangeToken]);

  const registerWithEmail = useCallback(
    async (name: string, email: string, password: string) => {
      const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
      await updateProfile(credential.user, { displayName: name });
      // The listener fires before displayName is set, so refresh the session.
      await exchangeToken(credential.user);
    },
    [exchangeToken]
  );

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
    // Await the exchange so the cookie exists before the router navigates —
    // otherwise middleware would bounce the user straight back to /login.
    await exchangeToken(credential.user);
  }, [exchangeToken]);

  const signInWithGoogle = useCallback(async () => {
    const credential = await signInWithPopup(getFirebaseAuth(), googleProvider);
    await exchangeToken(credential.user);
  }, [exchangeToken]);

  const logout = useCallback(async () => {
    await signOut(getFirebaseAuth());
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      loading,
      isAdmin: user?.role === 'admin',
      registerWithEmail,
      signInWithEmail,
      signInWithGoogle,
      logout
    }),
    [user, loading, registerWithEmail, signInWithEmail, signInWithGoogle, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an AuthProvider');
  return context;
}
