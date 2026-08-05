"use client";

import { useMemo, useState } from "react";
import { ConEvent } from "@/types/event";
import {
  formatEventDateRange,
  getDaysUntil,
  getEventTiming,
} from "@/data/calendar";
import { IconPlus } from "./icons";
import {
  AdminButton,
  AdminCard,
  AdminEmptyState,
  AdminField,
  AdminModal,
  AdminPageHeader,
  AdminTextarea,
  AdminToast,
} from "./ui";

const TIMING_STYLES = {
  upcoming: "bg-sky-100 text-sky-800",
  active: "bg-emerald-100 text-emerald-800",
  past: "bg-slate-100 text-slate-600",
};

function eventTimingLabel(event: ConEvent): string {
  const timing = getEventTiming(event.date, event.endDate);
  if (timing === "active") return "Happening now";
  if (timing === "past") return "Past";
  const days = getDaysUntil(event.date);
  if (days === 0) return "Starts today";
  if (days === 1) return "Starts tomorrow";
  return `Starts in ${days} days`;
}

export default function AdminEventsManager({ initialEvents }: { initialEvents: ConEvent[] }) {
  const [events, setEvents] = useState(initialEvents);
  const [editingEventId, setEditingEventId] = useState<string | "new" | null>(null);
  const [eventDraft, setEventDraft] = useState<Partial<ConEvent>>({ title: "", date: "" });
  const [message, setMessage] = useState("");

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => a.date.localeCompare(b.date)),
    [events],
  );

  async function saveEvent() {
    if (!eventDraft.title || !eventDraft.date) return;
    if (eventDraft.endDate && eventDraft.endDate < eventDraft.date) {
      setMessage("End date must be on or after start date");
      return;
    }
    const isNew = editingEventId === "new";
    const payload = {
      ...eventDraft,
      endDate: eventDraft.endDate?.trim() || undefined,
    };
    const res = await fetch("/api/admin/events", {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isNew ? payload : { ...payload, id: editingEventId }),
    });
    if (!res.ok) {
      setMessage(isNew ? "Could not create event" : "Could not update event");
      return;
    }
    const event = (await res.json()) as ConEvent;
    setEvents((prev) =>
      isNew
        ? [...prev, event].sort((a, b) => a.date.localeCompare(b.date))
        : prev.map((e) => (e.id === event.id ? event : e)).sort((a, b) => a.date.localeCompare(b.date)),
    );
    setEditingEventId(null);
    setEventDraft({ title: "", date: "" });
    setMessage(isNew ? `Event "${event.title}" created` : `Event "${event.title}" updated`);
  }

  async function removeEvent(id: string) {
    const event = events.find((e) => e.id === id);
    const label = event?.title ?? "this event";
    if (!confirm(`Delete "${label}"? This cannot be undone.`)) return;

    const res = await fetch(`/api/admin/events?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) {
      setMessage("Could not delete event");
      return;
    }

    setEvents((prev) => prev.filter((e) => e.id !== id));
    setMessage(`Event "${label}" deleted`);
  }

  function openNewEventForm() {
    setEventDraft({ title: "", date: "", endDate: "", location: "", description: "" });
    setEditingEventId("new");
  }

  function openEditEventForm(event: ConEvent) {
    setEventDraft({ ...event });
    setEditingEventId(event.id);
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Events & conventions"
        description="Manage your con calendar — picked when assigning builds to conventions."
        action={
          <AdminButton variant="primary" onClick={openNewEventForm}>
            <IconPlus />
            New event
          </AdminButton>
        }
      />

      {sortedEvents.length === 0 ? (
        <AdminCard className="p-6">
          <AdminEmptyState
            title="No events yet"
            description="Add conventions and deadlines to pick from when planning cosplays."
          />
          <div className="mt-4 text-center">
            <AdminButton variant="primary" onClick={openNewEventForm}>
              Create first event
            </AdminButton>
          </div>
        </AdminCard>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {sortedEvents.map((event) => {
            const timing = getEventTiming(event.date, event.endDate);

            return (
              <AdminCard key={event.id} className="flex flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-sans text-base font-bold text-closet-brown">{event.title}</h3>
                    <p className="mt-0.5 text-xs text-closet-brown-light">
                      {formatEventDateRange(event.date, event.endDate)}
                      {event.location ? ` · ${event.location}` : ""}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${TIMING_STYLES[timing]}`}>
                    {eventTimingLabel(event)}
                  </span>
                </div>
                {event.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-closet-brown-light">{event.description}</p>
                )}
                <div className="mt-4 flex gap-2">
                  <AdminButton variant="ghost" className="text-xs" onClick={() => openEditEventForm(event)}>
                    Edit
                  </AdminButton>
                  <AdminButton variant="danger" className="text-xs" onClick={() => void removeEvent(event.id)}>
                    Delete
                  </AdminButton>
                </div>
              </AdminCard>
            );
          })}
        </div>
      )}

      {editingEventId && (
        <AdminModal
          title={editingEventId === "new" ? "New event / con" : "Edit event"}
          onClose={() => {
            setEditingEventId(null);
            setEventDraft({ title: "", date: "" });
          }}
          footer={
            <>
              <AdminButton
                variant="secondary"
                onClick={() => {
                  setEditingEventId(null);
                  setEventDraft({ title: "", date: "" });
                }}
              >
                Cancel
              </AdminButton>
              <AdminButton variant="primary" onClick={saveEvent}>
                {editingEventId === "new" ? "Create event" : "Save changes"}
              </AdminButton>
            </>
          }
        >
          <div className="space-y-4">
            <AdminField
              label="Title"
              value={eventDraft.title ?? ""}
              onChange={(v) => setEventDraft({ ...eventDraft, title: v })}
              placeholder="MAGFest 2026"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminField
                label="Start date"
                value={eventDraft.date ?? ""}
                onChange={(v) => setEventDraft({ ...eventDraft, date: v })}
                type="date"
              />
              <AdminField
                label="End date"
                value={eventDraft.endDate ?? ""}
                onChange={(v) => setEventDraft({ ...eventDraft, endDate: v })}
                type="date"
              />
            </div>
            <p className="text-xs text-closet-brown-light">
              Leave end date blank for single-day events. For cons, set the last day of the show.
            </p>
            <AdminField
              label="Location"
              value={eventDraft.location ?? ""}
              onChange={(v) => setEventDraft({ ...eventDraft, location: v })}
            />
            <AdminTextarea
              label="Description"
              value={eventDraft.description ?? ""}
              onChange={(v) => setEventDraft({ ...eventDraft, description: v })}
            />
          </div>
        </AdminModal>
      )}

      <AdminToast message={message} onDone={() => setMessage("")} />
    </div>
  );
}
