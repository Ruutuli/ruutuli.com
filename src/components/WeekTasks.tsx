"use client";

import Image from "next/image";
import Link from "next/link";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { formatTaskDue, getDashboardBuildTasks } from "@/data/tasks";
import { BUILD_TASK_TYPE_LABELS, BuildTask } from "@/types/task";

function taskIcon(type: BuildTask["type"]) {
  if (type === "buy") {
    return (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    );
  }
  if (type === "check") {
    return (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
    </svg>
  );
}

function JournalEntryRow({ task }: { task: BuildTask }) {
  const dateLabel = task.dueDate ? formatTaskDue(task.dueDate) : BUILD_TASK_TYPE_LABELS[task.type];
  const content = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-closet-blush text-closet-rose">
        {taskIcon(task.type)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-closet-brown">{task.label}</span>
        <span className="block text-xs text-closet-brown-light">{dateLabel}</span>
      </span>
      <svg className="h-4 w-4 shrink-0 text-closet-rose/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </>
  );

  const rowClass =
    "cosplan-focus-ring flex items-center gap-3 rounded-xl px-1 py-2.5 transition-colors hover:bg-closet-blush/40";

  if (task.link) {
    return (
      <li>
        <a href={task.link} target="_blank" rel="noopener noreferrer" className={rowClass}>
          {content}
        </a>
      </li>
    );
  }

  return (
    <li>
      <div className={rowClass}>{content}</div>
    </li>
  );
}

function JournalEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-2 py-4 text-center">
      <div className="relative mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-closet-blush/60">
        <svg className="h-10 w-10 text-closet-rose/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </div>
      <p className="font-sans text-base font-bold text-closet-brown">No journal entries yet</p>
      <p className="mt-2 max-w-[220px] text-sm leading-relaxed text-closet-brown-light">
        Log build milestones and task updates to keep your progress story in one place.
      </p>
    </div>
  );
}

export default function WeekTasks({ tasks }: { tasks: BuildTask[] }) {
  const siteConfig = useSiteConfig();
  const visible = getDashboardBuildTasks(tasks, 3);
  const hasEntries = visible.length > 0;

  return (
    <section
      id="focus"
      className="cosplan-journal-panel col-span-12 h-full min-h-0 w-full min-w-0 animate-fade-up [animation-delay:280ms] lg:col-span-3"
    >
      <div className="cosplan-panel-header shrink-0">
        <Image src={siteConfig.assets.maki} alt="" width={22} height={22} className="h-5 w-5" />
        <h2 className="font-sans text-base font-bold text-closet-brown">Build Journal</h2>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">
        {hasEntries ? (
          <ul className="min-h-0 flex-1 space-y-1">
            {visible.map((task) => (
              <JournalEntryRow key={task.id} task={task} />
            ))}
          </ul>
        ) : (
          <JournalEmptyState />
        )}

        <Link
          href="/admin/tasks"
          className="closet-btn cosplan-focus-ring mt-auto w-full shrink-0 !rounded-2xl !py-3 !text-sm"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {hasEntries ? "New Journal Entry" : "Create Entry"}
        </Link>
      </div>
    </section>
  );
}
