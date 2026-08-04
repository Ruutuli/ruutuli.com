import { isCosplayPlaceholderImage } from "@/lib/cosplay/images";
import { ProxiedNextImage } from "./GoogleDriveImage";

function RosterImageEmpty({ label, hint }: { label: string; hint?: string }) {
  const initial = label.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-closet-blush via-white to-closet-peach/25 p-4">
      <span className="font-display text-5xl font-bold text-closet-rose/25 sm:text-6xl">{initial}</span>
      {hint && (
        <span className="mt-2 text-center text-[10px] font-semibold uppercase tracking-wider text-closet-brown-light/60">
          {hint}
        </span>
      )}
    </div>
  );
}

type RosterImageSlotProps = {
  src: string | null | undefined;
  alt: string;
  emptyLabel: string;
  emptyHint?: string;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

/** Roster / cosplay UI image — skips box-blank placeholders. */
export default function RosterImageSlot({
  src,
  alt,
  emptyLabel,
  emptyHint,
  fill = true,
  className = "object-cover object-top",
  sizes,
  priority,
}: RosterImageSlotProps) {
  if (isCosplayPlaceholderImage(src)) {
    return <RosterImageEmpty label={emptyLabel} hint={emptyHint} />;
  }

  return (
    <ProxiedNextImage
      src={src}
      alt={alt}
      fill={fill}
      className={className}
      sizes={sizes}
      priority={priority}
      fallbackSrc=""
    />
  );
}
