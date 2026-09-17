import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

const clientConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

const hasFirebaseConfig = Boolean(
  clientConfig.apiKey &&
  clientConfig.authDomain &&
  clientConfig.projectId &&
  clientConfig.appId,
);

if (!getApps().length && hasFirebaseConfig) {
  initializeApp(clientConfig);
}

const auth = getApps().length ? getAuth() : null;
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

export async function signInWithGoogle() {
  if (!auth) {
    throw new Error("Firebase client is not configured.");
  }
  return signInWithPopup(auth, googleProvider);
}

export async function signInWithGithub() {
  if (!auth) {
    throw new Error("Firebase client is not configured.");
  }
  return signInWithPopup(auth, githubProvider);
}

export function signOutUser() {
  if (!auth) {
    return Promise.resolve();
  }
  return signOut(auth);
}

/**
 * Returns the current user's Firebase ID token, or null if Firebase is not
 * configured or no user is signed in. Used to authenticate API requests so the
 * server can apply per-user quotas instead of treating everyone as a guest.
 */
export async function getIdToken(): Promise<string | null> {
  if (!auth?.currentUser) return null;
  try {
    return await auth.currentUser.getIdToken();
  } catch {
    return null;
  }
}

export { auth, onAuthStateChanged };
