"use client";

import { faqItems } from "@/data/faq";

export default function FaqView() {
  return (
    <div className="mx-auto max-w-2xl animate-fade-up space-y-3">
      {faqItems.map((item, index) => (
        <details
          key={item.question}
          className="group closet-panel-outer overflow-hidden"
          open={index === 0}
        >
          <summary className="closet-panel-header cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/30 text-closet-brown transition-transform duration-200 group-open:rotate-90">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
            <h2 className="flex-1 font-sans text-base font-bold text-closet-brown sm:text-lg">{item.question}</h2>
          </summary>
          <div className="closet-panel-body border-t border-closet-rose/10 pt-4">
            <p className="text-base leading-relaxed text-closet-brown-light">{item.answer}</p>
          </div>
        </details>
      ))}
    </div>
  );
}
