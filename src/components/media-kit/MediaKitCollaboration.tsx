import type { ReactNode } from "react";
import { MediaKitSettings } from "@/types/mediaKit";
import { getCollaborationContactHref, getVisibleCollaborationServices } from "@/lib/mediaKit/utils";

const SERVICE_ICONS: Record<string, ReactNode> = {
  "Cosplay Product Sponsorship": (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  ),
  "Convention Appearances": (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  "Product Features": (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  "Photoshoots & Creative Projects": (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

function DefaultIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function MediaKitCollaboration({
  mediaKit,
  contactEmail,
}: {
  mediaKit: MediaKitSettings;
  contactEmail: string;
}) {
  const services = getVisibleCollaborationServices(mediaKit);
  if (services.length === 0) return null;

  const contact = getCollaborationContactHref(mediaKit, contactEmail);

  return (
    <aside aria-labelledby="mediakit-collab-heading" className="flex self-stretch lg:w-[min(100%,340px)] lg:shrink-0">
      <div className="closet-panel-outer flex h-full w-full flex-col">
        <div className="closet-panel-header shrink-0">
          <h2 id="mediakit-collab-heading" className="font-sans text-xl font-bold text-closet-brown">
            Let&apos;s Collaborate
          </h2>
        </div>
        <div className="closet-panel-body flex min-h-0 flex-1 flex-col gap-5">
          <ul className="space-y-4">
            {services.map((service) => (
              <li key={service.title} className="flex gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-closet-pink/50 bg-closet-blush/50 text-closet-rose">
                  {SERVICE_ICONS[service.title] ?? <DefaultIcon />}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-closet-brown">{service.title}</h3>
                  <p className="mt-0.5 text-sm leading-relaxed text-closet-brown-light">{service.description}</p>
                </div>
              </li>
            ))}
          </ul>
          <a
            href={contact.href}
            className="cosplan-focus-ring mt-auto flex min-h-[44px] w-full items-center justify-center rounded-full bg-closet-rose px-5 py-3 text-sm font-bold text-white shadow-closet-soft transition-all hover:bg-closet-mauve hover:shadow-closet"
          >
            {contact.isEmail ? contact.label : "Get in touch"}
          </a>
        </div>
      </div>
    </aside>
  );
}
