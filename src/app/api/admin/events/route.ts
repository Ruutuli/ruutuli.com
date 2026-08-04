import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated, requireAdmin } from "@/lib/admin/auth";
import { badRequest, notFound, readJsonBody, unauthorized } from "@/lib/admin/api";
import { createEvent, deleteEvent, getEvents, updateEvent } from "@/lib/store/eventStore";
import { deleteTasksByEventId } from "@/lib/store/taskStore";
import { ConEvent } from "@/types/event";

export async function GET() {
  if (!(await isAdminAuthenticated())) return unauthorized();
  return NextResponse.json(await getEvents());
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const body = await readJsonBody<Partial<ConEvent>>(request);
  if (!body?.title || !body.date) return badRequest("title and start date are required");
  if (body.endDate && body.endDate < body.date) {
    return badRequest("end date must be on or after start date");
  }

  const event = await createEvent({
    title: body.title,
    date: body.date,
    endDate: body.endDate?.trim() || undefined,
    location: body.location,
    description: body.description,
    id: body.id,
  });

  return NextResponse.json(event, { status: 201 });
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const body = await readJsonBody<Partial<ConEvent> & { id?: string }>(request);
  if (!body?.id) return badRequest("id is required");
  if (body.endDate && body.date && body.endDate < body.date) {
    return badRequest("end date must be on or after start date");
  }
  if (body.endDate === "") body.endDate = undefined;

  const updated = await updateEvent(body.id, body);
  if (!updated) return notFound("Event not found");
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return badRequest("id is required");

  const deletedTasks = await deleteTasksByEventId(id);
  const ok = await deleteEvent(id);
  if (!ok) return notFound("Event not found");
  return NextResponse.json({ ok: true, deletedTasks });
}
