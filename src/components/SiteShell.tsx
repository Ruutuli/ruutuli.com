import Background from "@/components/Background";
import BackToTop from "@/components/BackToTop";
import { Footer } from "@/components/Footer";
import Header from "@/components/Header";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <Background />
      <Header />
      <main className="relative z-10 flex-1">{children}</main>
      <Footer />
      <BackToTop />
    </div>
  );
}
