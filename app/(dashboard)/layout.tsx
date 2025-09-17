import Footer from "@/components/Footer";
import "../globals.css";
import Header from "@/components/Header";
import { Toaster } from "react-hot-toast";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 👇 چون async component نوشتی، اینجا می‌تونی صبر کنی
  const cookieStore = await cookies(); // در نسخه تو Promise برمی‌گردونه
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login");
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET!);
  } catch (err) {
    redirect("/login");
  }

  return (
    <>
      <Header />
      <main className="pt-33 md:pt-20">{children}</main>
      <Toaster position="top-right" />
      <Footer />
    </>
  );
}
