import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated, requireAdmin } from "@/lib/admin/auth";
import { badRequest, notFound, readJsonBody, unauthorized } from "@/lib/admin/api";
import { createTask, deleteTask, getTasks, saveTasks, updateTask } from "@/lib/store/taskStore";
import { BuildTask, BuildTaskStatus, BuildTaskType } from "@/types/task";

export async function GET() {
  if (!(await isAdminAuthenticated())) return unauthorized();
  return NextResponse.json(await getTasks());
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const body = await readJsonBody<Partial<BuildTask>>(request);
  if (!body?.label || !body.eventId || !body.character) {
    return badRequest("label, eventId, and character are required");
  }

  const task = await createTask({
    label: body.label,
    character: body.character,
    cosplayId: body.cosplayId,
    eventId: body.eventId,
    type: (body.type as BuildTaskType) ?? "todo",
    link: body.link,
    estimatedCost: body.estimatedCost,
    status: (body.status as BuildTaskStatus) ?? "not-started",
    percent: body.percent ?? 0,
    notes: body.notes,
    dueDate: body.dueDate,
  });

  return NextResponse.json(task, { status: 201 });
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const body = await readJsonBody<Partial<BuildTask> & { id?: string; tasks?: BuildTask[] }>(request);

  if (body?.tasks) {
    await saveTasks(body.tasks);
    return NextResponse.json(await getTasks());
  }

  if (!body?.id) return badRequest("id is required");

  const updated = await updateTask(body.id, body);
  if (!updated) return notFound("Task not found");
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

  const ok = await deleteTask(id);
  if (!ok) return notFound("Task not found");
  return NextResponse.json({ ok: true });
}
