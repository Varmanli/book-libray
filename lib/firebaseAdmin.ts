export async function verifyIdToken(idToken: string) {
  const NEXT_PUBLIC_FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!NEXT_PUBLIC_FIREBASE_API_KEY) {
    throw new Error("FIREBASE_API_KEY تنظیم نشده است");
  }

  const resp = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${NEXT_PUBLIC_FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    }
  );

  const data = await resp.json();

  if (!resp.ok || !data.users || data.users.length === 0) {
    throw new Error("توکن معتبر نیست");
  }

  // داده کاربر
  return data.users[0];
}
