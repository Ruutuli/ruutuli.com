"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  IconCalendar,
  IconChecklist,
  IconCosplay,
  IconDashboard,
  IconExternal,
  IconGallery,
  IconLogout,
  IconSettings,
  IconWig,
} from "./icons";

const links = [
  { href: "/admin", label: "Overview", icon: IconDashboard, exact: true },
  { href: "/admin/todos", label: "To-Do List", icon: IconChecklist },
  { href: "/admin/cosplays", label: "Roster", icon: IconCosplay },
  { href: "/admin/gallery", label: "Gallery", icon: IconGallery },
  { href: "/admin/wigs", label: "Wigs", icon: IconWig },
  { href: "/admin/events", label: "Events", icon: IconCalendar },
  { href: "/admin/media-kit", label: "Media Kit", icon: IconExternal },
  { href: "/admin/settings", label: "Settings", icon: IconSettings },
];

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof IconDashboard;
  active: boolean;
}) {
  return (
    <Link href={href} className={`admin-nav-link ${active ? "admin-nav-link-active" : ""}`}>
      <Icon className="h-5 w-5 shrink-0" />
      {label}
    </Link>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="min-h-screen bg-cream-100 lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-closet-pink/50 bg-white/80 backdrop-blur-sm lg:flex">
        <div className="border-b border-closet-pink/40 px-5 py-6">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-closet-blush shadow-sm">
              <Image src="/images/maki.png" alt="" fill className="object-cover" sizes="40px" />
            </div>
            <div>
              <p className="font-display text-lg font-bold leading-tight text-closet-brown">Ruutuli</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-closet-brown-light">Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-4">
          {links.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              label={link.label}
              icon={link.icon}
              active={isActive(link.href, link.exact)}
            />
          ))}
        </nav>

        <div className="space-y-1 border-t border-closet-pink/40 p-4">
          <Link href="/" className="admin-nav-link" target="_blank">
            <IconExternal className="h-5 w-5" />
            View site
          </Link>
          <button type="button" onClick={logout} className="admin-nav-link w-full text-left">
            <IconLogout className="h-5 w-5" />
            Log out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-closet-pink/50 bg-white/90 px-4 py-4 backdrop-blur-sm lg:hidden">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="font-display text-lg font-bold text-closet-brown">Ruutuli Admin</p>
            </div>
            <div className="flex items-center gap-1">
              <Link href="/" className="admin-btn-ghost px-2" target="_blank" aria-label="View site">
                <IconExternal />
              </Link>
              <button type="button" onClick={logout} className="admin-btn-ghost px-2" aria-label="Log out">
                <IconLogout />
              </button>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto pb-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition-colors ${
                  isActive(link.href, link.exact)
                    ? "bg-closet-rose text-white"
                    : "bg-closet-blush/50 text-closet-brown hover:bg-closet-blush"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
