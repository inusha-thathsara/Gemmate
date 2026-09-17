"use client";
import React, { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import {
  auth,
  signInWithGoogle,
  signInWithGithub,
  signOutUser,
  onAuthStateChanged,
} from "../../../lib/firebaseClient";

export default function SignInButton() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!auth) {
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  if (!auth) {
    return <span style={{ color: "var(--text-3)" }}>Auth not configured</span>;
  }

  if (user) {
    return (
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span>{user.displayName || user.email}</span>
        <button onClick={() => signOutUser()}>Sign out</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button onClick={() => signInWithGoogle()}>Sign in with Google</button>
      <button onClick={() => signInWithGithub()}>Sign in with GitHub</button>
    </div>
  );
}
