import Footer from "@/components/Footer";
import "../globals.css";
import Header from "@/components/Header";
import { Toaster } from "react-hot-toast";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="pt-33 md:pt-20">{children}</main>
      <Toaster position="top-right" />
      <Footer />
    </>
  );
}
