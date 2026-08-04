"use client";

import Link from "next/link";
import { Cosplay } from "@/types/cosplay";
import { isCosplayPlaceholderImage } from "@/lib/cosplay/images";
import { BuildTask, getOpenBuildTasks } from "@/types/task";
import { getDashboardBuildTasks } from "@/data/tasks";
import { Wig } from "@/types/wig";
import { AdminCard, AdminPageHeader, AdminStatCard, AdminStatusBadge } from "./ui";
import { IconCosplay, IconGallery, IconPlus, IconTasks, IconWig } from "./icons";

interface AdminDashboardProps {
  cosplays: Cosplay[];
  wigs: Wig[];
  tasks: BuildTask[];
}

export default function AdminDashboard({ cosplays, wigs, tasks }: AdminDashboardProps) {
  const inProgress = cosplays.filter((c) => c.status === "in-progress").length;
  const completed = cosplays.filter((c) => c.status === "completed").length;
  const openTasks = getOpenBuildTasks(tasks).length;
  const spotlight = cosplays.find((c) => c.spotlight);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Overview"
        description="Quick snapshot of your cosplay portfolio and site content."
        action={
          <Link href="/admin/cosplays" className="admin-btn-primary">
            <IconPlus />
            Add build
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Roster" value={cosplays.length} hint={`${inProgress} in progress`} accent="rose" />
        <AdminStatCard label="Completed" value={completed} hint="Finished builds" accent="peach" />
        <AdminStatCard label="Wigs" value={wigs.length} hint="Inventory items" accent="blush" />
        <AdminStatCard label="Open tasks" value={openTasks} hint={`${tasks.length} total`} accent="brown" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard>
          <div className="flex items-center justify-between border-b border-closet-pink/50 px-5 py-4">
            <h2 className="font-sans text-lg font-bold text-closet-brown">Spotlight build</h2>
            <Link href="/admin/cosplays" className="text-sm font-semibold text-closet-rose hover:underline">
              Manage
            </Link>
          </div>
          <div className="p-5">
            {spotlight ? (
              <div className="flex gap-4">
                <div className="relative flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-closet-pink/50 bg-closet-blush">
                  {!isCosplayPlaceholderImage(spotlight.characterArt) ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={spotlight.characterArt} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-display text-2xl font-bold text-closet-rose/40">
                      {spotlight.character.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-sans text-lg font-bold text-closet-brown">{spotlight.character}</p>
                  <p className="text-sm text-closet-brown-light">{spotlight.series}</p>
                  <div className="mt-2">
                    <AdminStatusBadge status={spotlight.status} />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-closet-brown-light">No spotlight build set. Mark one in Roster → Edit.</p>
            )}
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between border-b border-closet-pink/50 px-5 py-4">
            <h2 className="font-sans text-lg font-bold text-closet-brown">Current focus</h2>
            <Link href="/admin/tasks" className="text-sm font-semibold text-closet-rose hover:underline">
              All tasks
            </Link>
          </div>
          <ul className="divide-y divide-closet-pink/35 p-2">
            {getDashboardBuildTasks(tasks, 5).map((task) => (
              <li key={task.id} className="flex items-center gap-3 px-3 py-3 text-sm">
                <span className="h-2 w-2 shrink-0 rounded-full bg-closet-rose" />
                <span className="min-w-0">
                  <span className="block text-[10px] font-bold uppercase tracking-wide text-closet-rose">{task.character}</span>
                  <span className="font-semibold text-closet-brown">{task.label}</span>
                </span>
              </li>
            ))}
            {openTasks === 0 && (
              <li className="px-3 py-6 text-center text-sm text-closet-brown-light">All caught up — no open tasks.</li>
            )}
          </ul>
        </AdminCard>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <QuickLink href="/admin/cosplays" icon={IconCosplay} label="Manage roster" hint={`${cosplays.length} builds`} />
        <QuickLink href="/admin/gallery" icon={IconGallery} label="Gallery" hint="Drive photos" />
        <QuickLink href="/admin/wigs" icon={IconWig} label="Wig inventory" hint={`${wigs.length} wigs`} />
        <QuickLink href="/admin/tasks" icon={IconTasks} label="Task list" hint={`${openTasks} open`} />
      </div>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
  hint,
}: {
  href: string;
  icon: typeof IconCosplay;
  label: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl border border-closet-pink/60 bg-white p-5 shadow-closet transition-all hover:-translate-y-0.5 hover:border-closet-rose/30 hover:shadow-closet-lg"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-closet-blush/70 text-closet-rose transition-colors group-hover:bg-closet-rose group-hover:text-white">
        <Icon className="h-5 w-5" />
      </span>
      <span>
        <span className="block font-sans font-bold text-closet-brown">{label}</span>
        <span className="text-xs font-medium text-closet-brown-light">{hint}</span>
      </span>
    </Link>
  );
}
