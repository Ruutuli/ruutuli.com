import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import AdminLoginForm from "@/components/admin/AdminLoginForm";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-closet-blush shadow-closet">
            <Image src="/images/maki.png" alt="" width={48} height={48} className="object-cover" />
          </div>
          <h1 className="font-display text-3xl font-bold text-closet-brown">Ruutuli Admin</h1>
          <p className="mt-2 text-sm text-closet-brown-light">Sign in to manage roster, wigs, and site content.</p>
        </div>
        <div className="rounded-3xl border border-closet-pink/60 bg-white p-8 shadow-closet-lg">
          <Suspense>
            <AdminLoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
