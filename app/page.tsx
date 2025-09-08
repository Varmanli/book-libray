import LoginButton from "@/component/LoginButton";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl mb-4">کتابخانه من</h1>
      <LoginButton />
    </main>
  );
}
