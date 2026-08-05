import type { Metadata } from "next";
import SiteShell from "@/components/SiteShell";
import CalendarView from "@/components/CalendarView";
import { getCosplays } from "@/lib/store/cosplayStore";
import { getEvents } from "@/lib/store/eventStore";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Calendar | Ruutuli Cosplay",
  description: "Cons, shoots, and build deadlines.",
};

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
