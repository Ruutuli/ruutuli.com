"use client";

import { useEffect, useState } from "react";

const SHOW_AFTER_PX = 320;

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > SHOW_AFTER_PX);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      className={`fixed bottom-5 right-5 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-closet-pink/60 bg-white text-closet-rose shadow-closet transition-all duration-300 hover:-translate-y-1 hover:border-closet-rose/50 hover:bg-closet-blush hover:shadow-closet-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-closet-pink focus-visible:ring-offset-2 sm:bottom-6 sm:right-6 sm:h-12 sm:w-12 ${
        visible
          ? "pointer-events-auto translate-y-0 opacity-100 animate-bounce-soft"
          : "pointer-events-none translate-y-2 opacity-0"
      }`}
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    </button>
  );
}
