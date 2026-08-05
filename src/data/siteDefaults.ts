import { SiteSettings } from "@/types/settings";

export const siteAssets = {
  maki: "/images/maki.png",
  makiBig: "/images/maki-big.png",
  makiHero: "/images/maki-hero.png",
  backgroundVideo: "/videos/bg-moving.mp4",
  backgroundImage: "/images/bg.png",
  avatar: "/images/ruubymei.png",
  chibi: "/images/cheebruu.png",
  pageDoll: "/images/chibi-ruu.png",
} as const;

export const defaultSiteSettings: SiteSettings = {
  name: "Ruutuli",
  displayName: "Ruutuli",
  tagline: "personal site",
  roles: "Artist || Cosplayer || VTuber || Live2D Rigger || Gamer || Variety Streamer",
  bio: "The place where I put things and pretend I know what I'm doing.",
  contactEmail: "ruutulian@gmail.com",
  socials: {
    instagram: "https://www.instagram.com/ruutuli/",
    twitter: "https://x.com/ruutuli",
    tiktok: "https://www.tiktok.com/@ruutuli",
    twitch: "https://www.twitch.tv/ruutuli",
  },
};
