"use client";

import Image from "next/image";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { formatTaskDue } from "@/data/tasks";
import { BUILD_TASK_TYPE_LABELS, BuildTask, getOpenBuildTasks, isBuildTaskDone } from "@/types/task";
import { getDashboardBuildTasks } from "@/data/tasks";

export default function WeekTasks({ tasks }: { tasks: BuildTask[] }) {
  const siteConfig = useSiteConfig();
  const visible = getDashboardBuildTasks(tasks, 6);

  return (
    <section className="cosplan-panel animate-fade-up [animation-delay:280ms]">
      <div className="cosplan-panel-header">
        <Image src={siteConfig.assets.maki} alt="" width={22} height={22} className="h-5 w-5" />
        <h2 className="font-sans text-base font-bold text-closet-brown">Build Journal</h2>
      </div>
      <div className="cosplan-panel-body !pt-2">
        {visible.length === 0 ? (
          <p className="py-2 text-sm text-closet-brown-light">All caught up on build tasks!</p>
        ) : (
          <ul className="divide-y divide-closet-pink/35">
            {visible.map((task) => {
              const done = isBuildTaskDone(task);
              return (
                <li
                  key={task.id}
                  className={`flex items-start gap-3 py-3.5 transition-opacity duration-300 first:pt-2 ${done ? "opacity-50" : ""}`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
                      done ? "border-closet-rose bg-closet-rose text-white" : "border-closet-pink bg-white"
                    }`}
                    aria-hidden
                  >
                    {done && (
                      <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-bold uppercase tracking-wide text-closet-rose">
                      {task.character} · {BUILD_TASK_TYPE_LABELS[task.type]}
                    </span>
                    {task.dueDate && (
                      <span className="block text-xs font-bold uppercase tracking-wide text-closet-brown-light">
                        {formatTaskDue(task.dueDate)}
                      </span>
                    )}
                    <span className={`mt-0.5 block text-sm font-medium text-closet-brown ${done ? "line-through" : ""}`}>
                      {task.link ? (
                        <a href={task.link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {task.label}
                        </a>
                      ) : (
                        task.label
                      )}
                    </span>
                    {task.percent > 0 && task.percent < 100 && (
                      <span className="text-xs font-medium text-closet-brown-light">{task.percent}% done</span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
