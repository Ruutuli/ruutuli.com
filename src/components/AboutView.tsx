"use client";

import Link from "next/link";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import ScallopHeroFrame from "@/components/ScallopHeroFrame";
import { faqItems } from "@/data/faq";

const aboutFacts = [
  { label: "Name", value: "Ruu (Ruutuli)" },
  { label: "Astrological Sign", value: "Virgo" },
  { label: "Favorite Color", value: "Red" },
  { label: "Handedness", value: "Right-handed" },
  { label: "Fur Babies", value: "Pascal & Bobby" },
] as const;

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-closet-rose/10 py-3 last:border-b-0 sm:flex-row sm:items-baseline sm:gap-4">
      <dt className="shrink-0 text-sm font-bold uppercase tracking-wide text-closet-rose sm:w-36">{label}</dt>
      <dd className="text-base font-medium text-closet-brown">{value}</dd>
    </div>
  );
}

export default function AboutView() {
  const siteConfig = useSiteConfig();
  const heroArt = siteConfig.assets.chibi || siteConfig.assets.pageDoll || siteConfig.assets.makiHero;

  return (
    <div className="mx-auto max-w-4xl">
      <section className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="animate-fade-up text-center lg:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-closet-rose">about me</p>
          <h1 className="mt-2.5 font-display text-4xl font-bold leading-[1.1] tracking-tight text-closet-brown sm:text-5xl">
            Hi, I&apos;m Ruu
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-closet-brown-light sm:text-lg lg:mx-0">
            Casual cosplayer. Weaponized autism. This website exists for teehees.
          </p>
        </div>

        <div className="animate-fade-up flex justify-center [animation-delay:120ms] lg:justify-end">
          <ScallopHeroFrame src={heroArt} alt="Ruu chibi illustration" />
        </div>
      </section>

      <section className="mt-12 animate-fade-up space-y-6 [animation-delay:180ms]">
        <article className="closet-panel-outer">
          <div className="closet-panel-header">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/30 text-closet-brown">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <h2 className="flex-1 font-sans text-xl font-bold text-closet-brown">A Few Simple Facts</h2>
          </div>
          <dl className="closet-panel-body">
            {aboutFacts.map((fact) => (
              <FactRow key={fact.label} label={fact.label} value={fact.value} />
            ))}
          </dl>
        </article>

        <article className="closet-panel-outer">
          <div className="closet-panel-header">
            <h2 className="flex-1 font-sans text-xl font-bold text-closet-brown">Bio</h2>
          </div>
          <div className="closet-panel-body space-y-4">
            <p className="text-base leading-relaxed text-closet-brown-light">
              I&apos;m {siteConfig.displayName} — {siteConfig.roles.toLowerCase()}. I work a full-time job, and
              cosplay is one of my hobbies alongside approximately a million others. I roleplay, make OCs, create
              random stuff, and bounce between projects until something new catches my eye.
            </p>
            <p className="text-base leading-relaxed text-closet-brown-light">
              I&apos;m mostly self-taught and I learn by doing (and failing a lot). No fancy training, no awards
              speech — just wigs, hot glue, and stubbornness. This site is my cosplay closet on the internet:
              builds, con plans, and general chaos.
            </p>
            <p className="text-base leading-relaxed text-closet-brown-light">
              When I&apos;m not cosplaying, I&apos;m probably with my fur babies Pascal and Bobby, or starting
              something new I&apos;ll abandon in two weeks. Welcome in.
            </p>
          </div>
        </article>

        <section id="faq" className="scroll-mt-24 space-y-4">
          <div className="text-center lg:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-closet-rose">questions</p>
            <h2 className="mt-2 font-sans text-2xl font-bold text-closet-brown sm:text-3xl">FAQ</h2>
          </div>
          <div className="space-y-3">
            {faqItems.map((item) => (
              <details key={item.question} className="group closet-panel-outer">
                <summary className="closet-panel-header cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/30 text-closet-brown transition-transform duration-200 group-open:rotate-90">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                  <h3 className="flex-1 font-sans text-base font-bold text-closet-brown sm:text-lg">{item.question}</h3>
                </summary>
                <div className="closet-panel-body pt-4">
                  <p className="text-base leading-relaxed text-closet-brown-light">{item.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap justify-center gap-3 pt-2 lg:justify-start">
          <Link href="/roster" className="closet-btn-peach btn-shimmer !px-6 !py-2.5 text-sm">
            View Cosplays
          </Link>
          <Link href="/contact" className="closet-btn-outline !px-6 !py-2.5 text-sm">
            Contact
          </Link>
        </div>
      </section>
    </div>
  );
}
