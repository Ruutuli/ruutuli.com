interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
}

export default function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div className="mb-12 animate-fade-up text-center sm:mb-14">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-closet-rose">{eyebrow}</p>
      <h2 className="mt-3 font-sans text-3xl font-bold tracking-tight text-closet-brown sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {description && (
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-closet-brown-light sm:text-lg">
          {description}
        </p>
      )}
    </div>
  );
}
