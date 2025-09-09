"use client";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { useState, useEffect } from "react";
import { app } from "@/lib/firebase";

export default function GoogleLoginButton() {
  const auth = getAuth(app);
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => setUser(u));
    return unsubscribe;
  }, [auth]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div>
      {user ? (
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white rounded-full px-4 py-2"
        >
          خروج
        </button>
      ) : (
        <button
          onClick={handleLogin}
          className="bg-blue-600 text-white rounded-full px-4 py-2"
        >
          ورود با گوگل
        </button>
      )}
    </div>
  );
}
