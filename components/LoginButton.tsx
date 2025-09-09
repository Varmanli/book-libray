"use client";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { app } from "@/lib/firebase";
import { Button } from "@/components/ui/button";

export function GoogleLoginButton() {
  const auth = getAuth(app);
  const [user, setUser] = useState(auth.currentUser);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => setUser(u));
    return unsubscribe;
  }, [auth]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push("/books");
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  return user ? (
    <Button
      onClick={handleLogout}
      variant="destructive"
      className="rounded-lg px-10 py-5 text-lg cursor-pointer"
    >
      خروج
    </Button>
  ) : (
    <Button
      onClick={handleLogin}
      className="rounded-lg px-10 py-5 text-lg cursor-pointer"
    >
      ورود یا ثبت نام
    </Button>
  );
}
