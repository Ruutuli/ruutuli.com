import { SiteSettings } from "@/types/settings";

export const siteAssets = {
  maki: "/images/maki.png",
  makiBig: "/images/maki-big.png",
  makiHero: "/images/maki-hero.png",
  maki2: "/images/maki2.png",
  backgroundVideo: "/videos/bg-moving.mp4",
  backgroundImage: "/images/bg.png",
  avatar: "/images/ruubymei.png",
  chibi: "/images/cheebruu.png",
  pageDoll: "/images/chibi-ruu.png",
  chibis: [
    "/images/cheebruu.png",
    "/images/chibi-ruu.png",
    "/images/chibi-raffle-ruutuli.png",
    "/images/maki.png",
    "/images/maki2.png",
    "/images/maki-hero.png",
    "/images/maki-big.png",
    "/images/ruubday.png",
    "/images/ruubymei.png",
  ],
} as const;

export const defaultSiteSettings: SiteSettings = {
  name: "Ruutuli",
  displayName: "Ruutuli",
  tagline: "cosplay & builds",
  roles: "Artist || Cosplayer || Live2D Rigger || Gamer",
  bio: "Casual cosplayer sharing builds, conventions, and the chaos between — wigs, hot glue, and stubbornness.",
  contactEmail: "ruutulian@gmail.com",
  socials: {
    instagram: "https://www.instagram.com/ruutuli/",
    twitter: "https://x.com/ruutuli",
    tiktok: "https://www.tiktok.com/@ruutuli",
    twitch: "",
  },
};
