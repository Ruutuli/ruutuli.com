"use client";

import { useState } from "react";
import { ProxiedNextImage } from "@/components/GoogleDriveImage";
import { Cosplay } from "@/types/cosplay";

interface CosplayCardProps {
  cosplay: Cosplay;
  index: number;
}

export default function CosplayCard({ cosplay, index }: CosplayCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <article
      className="closet-card group relative animate-fade-up overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-closet-lg"
      style={{ animationDelay: `${index * 100}ms` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <ProxiedNextImage
          src={cosplay.image}
          alt={`${cosplay.character} cosplay`}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div
          className={`absolute inset-0 bg-gradient-to-t ${cosplay.accent} opacity-0 mix-blend-overlay transition-opacity duration-500 group-hover:opacity-25`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-closet-brown/80 via-closet-brown/10 to-transparent opacity-70" />

        {cosplay.featured && (
          <span className="absolute left-4 top-4 rounded-full bg-closet-rose/90 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
            Featured
          </span>
        )}

        <div
          className={`absolute inset-x-0 bottom-0 p-6 transition-transform duration-500 ${hovered ? "translate-y-0" : "translate-y-2"}`}
        >
          <p className="text-xs uppercase tracking-widest text-closet-peach-light">{cosplay.series}</p>
          <h3 className="mt-1 font-sans text-2xl font-semibold text-white">
            {cosplay.character}
          </h3>
          <p
            className={`mt-2 text-sm leading-relaxed text-white/90 transition-all duration-500 ${hovered ? "max-h-24 opacity-100" : "max-h-0 overflow-hidden opacity-0"}`}
          >
            {cosplay.description}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {cosplay.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-xs text-white/90"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
