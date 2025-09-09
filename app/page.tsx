import GoogleLoginButton from "@/component/LoginButton";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl mb-4">کتابخانه من</h1>
      <GoogleLoginButton />
    </main>
  );
}
