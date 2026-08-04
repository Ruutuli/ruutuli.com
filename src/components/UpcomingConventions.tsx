import Link from "next/link";
import PanelCard from "@/components/PanelCard";
import { formatCalendarEventDates, getUpcomingConventions } from "@/data/calendar";
import { ConEvent } from "@/types/event";

const calendarIcon = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const conBadgeStyles = [
  "bg-gradient-to-br from-violet-400 to-violet-600 text-white",
  "bg-gradient-to-br from-sky-400 to-blue-600 text-white",
];

export default function UpcomingConventions({ events }: { events: ConEvent[] }) {
  const cons = getUpcomingConventions(events, 2);

  return (
    <PanelCard
      title="Upcoming Conventions"
      icon={calendarIcon}
      action={
        <Link href="/calendar" className="text-xs font-bold text-closet-brown/70 hover:underline">
          View all
        </Link>
      }
    >
      {cons.length === 0 ? (
        <p className="text-sm text-closet-brown-light">No upcoming conventions yet.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {cons.map((event, i) => (
            <li
              key={event.id}
              className="flex items-center gap-4 rounded-2xl border-2 border-closet-blush/40 bg-white px-4 py-4"
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[10px] font-black leading-tight ${conBadgeStyles[i % conBadgeStyles.length]}`}
              >
                {event.title.split(" ").map((w) => w[0]).join("").slice(0, 3)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-closet-brown">{event.title}</p>
                <div className="mt-1 space-y-0.5 text-xs font-medium text-closet-brown-light">
                  <p className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatCalendarEventDates(event)}
                  </p>
                  {event.location && (
                    <p className="flex items-center gap-1.5">
                      <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {event.location}
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PanelCard>
  );
}
