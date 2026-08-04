import { ReactNode } from "react";

interface PanelCardProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  action?: ReactNode;
}

export default function PanelCard({ title, icon, children, action }: PanelCardProps) {
  return (
    <article className="closet-panel-outer flex h-full min-h-[280px] flex-col">
      <div className="closet-panel-header">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/30 text-closet-brown">
          {icon}
        </span>
        <h2 className="flex-1 font-sans text-xl font-bold text-closet-brown">{title}</h2>
        {action}
      </div>
      <div className="closet-panel-body flex flex-1 flex-col">{children}</div>
    </article>
  );
}
