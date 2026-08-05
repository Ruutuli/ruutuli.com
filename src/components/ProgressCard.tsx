import { ProxiedNextImage } from "@/components/GoogleDriveImage";
import { Cosplay } from "@/types/cosplay";

interface ProgressCardProps {
  cosplay: Cosplay;
}

function overallProgress(cosplay: Cosplay): number {
  if (!cosplay.progress?.length) return 0;
  const total = cosplay.progress.reduce((sum, p) => sum + p.percent, 0);
  return Math.round(total / cosplay.progress.length);
}

function statusLabel(status: Cosplay["status"]): string {
  switch (status) {
    case "in-progress":
      return "In Progress";
    case "planned":
      return "Planned";
    case "retired":
      return "Retired";
    default:
      return "Completed";
  }
}

function statusColor(status: Cosplay["status"]): string {
  switch (status) {
    case "in-progress":
      return "text-closet-rose border-closet-pink/40 bg-closet-blush";
    case "planned":
      return "text-closet-mauve border-closet-rose/30 bg-closet-rose/10";
    case "retired":
      return "text-zinc-600 border-zinc-300/60 bg-zinc-100";
    default:
      return "text-emerald-700 border-emerald-400/40 bg-emerald-500/15";
  }
}

export default function ProgressCard({ cosplay }: ProgressCardProps) {
  const overall = overallProgress(cosplay);
  const showProgress = cosplay.status !== "retired";

  return (
    <article className="closet-card group animate-fade-up overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:border-closet-rose/40 hover:shadow-closet-lg">
      <div className="flex flex-col md:flex-row">
        <div className="relative h-48 w-full shrink-0 md:h-auto md:w-48">
          <ProxiedNextImage
            src={cosplay.image}
            alt={`${cosplay.character} WIP`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="192px"
          />
          <div className={`absolute inset-0 bg-gradient-to-r ${cosplay.accent} opacity-20 mix-blend-overlay`} />
        </div>

        <div className="flex flex-1 flex-col p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-closet-rose/70">{cosplay.series}</p>
              <h3 className="mt-1 font-sans text-xl font-semibold text-closet-brown">
                {cosplay.character}
              </h3>
            </div>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wider ${statusColor(cosplay.status)}`}
            >
              {statusLabel(cosplay.status)}
            </span>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-closet-brown-light">{cosplay.description}</p>

          {showProgress && (
            <div className="mt-5 flex items-center gap-4">
              <div className="relative h-14 w-14 shrink-0">
                <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="24" fill="none" stroke="rgb(251 232 236)" strokeWidth="4" />
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    stroke="rgb(217 89 112)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${(overall / 100) * 150.8} 150.8`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-closet-brown">
                  {overall}%
                </span>
              </div>
              <div className="flex-1 space-y-3">
                {cosplay.progress?.map((item) => (
                  <div key={item.label}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-closet-brown-light">{item.label}</span>
                      <span className="font-medium text-closet-brown">{item.percent}%</span>
                    </div>
                    <div className="closet-progress-track h-1.5">
                      <div className="closet-progress-fill" style={{ width: `${item.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {cosplay.startedDate && (
            <p className="mt-4 text-xs text-closet-brown-light/70">
              Started {cosplay.startedDate}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
