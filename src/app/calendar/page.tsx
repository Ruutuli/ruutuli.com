import type { Metadata } from "next";
import SiteShell from "@/components/SiteShell";
import CalendarView from "@/components/CalendarView";
import { getCosplays } from "@/lib/store/cosplayStore";
import { getEvents } from "@/lib/store/eventStore";
import { getSiteConfig } from "@/lib/server/siteConfig";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteConfig();
  const title = "Calendar";
  const description = `Upcoming conventions, shoots, and build deadlines for ${site.displayName}.`;

  return {
    title,
    description,
    alternates: { canonical: "/calendar" },
    openGraph: {
      title: `${title} | ${site.name}`,
      description,
      url: "/calendar",
    },
    twitter: {
      card: "summary",
      title: `${title} | ${site.name}`,
      description,
    },
  };
}

export default async function CalendarPage() {
  const [events, cosplays] = await Promise.all([getEvents(), getCosplays()]);

  return (
    <SiteShell>
      <div className="closet-page">
        <CalendarView events={events} cosplays={cosplays} />
      </div>
    </SiteShell>
  );
}
