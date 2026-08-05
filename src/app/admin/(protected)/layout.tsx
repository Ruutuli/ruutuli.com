import { redirect } from "next/navigation";
import { isAdminAuthenticated, isAdminAuthConfigured } from "@/lib/admin/auth";

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  if (!isAdminAuthConfigured()) {
    redirect("/admin/login?error=not-configured");
  }

  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  return children;
}
