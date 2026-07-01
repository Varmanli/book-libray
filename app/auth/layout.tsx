import "../globals.css";
import { AuthLayout as AuthShell } from "@/components/auth/AuthLayout";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthShell>{children}</AuthShell>;
}
