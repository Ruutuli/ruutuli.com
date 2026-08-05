import { MediaKitSettings } from "@/types/mediaKit";
import { MEDIA_KIT_FEATURED_COSPLAY_IDS } from "@/data/mediaKitContent";

export const defaultMediaKitSettings: MediaKitSettings = {
  eyebrow: "COSPLAYER · CREATOR · MAKER",
  heading: "Hi, I'm Ruu!",
  introduction:
    "I cosplay — handmade builds, bought pieces, mods, whatever the costume needs — plus con content for the games and stories I love. I've been at it since I was 16, so that's 17+ years of builds, photoshoots, and con weekends around the southeastern US.",
  hero: {
    main: {
      src: "/images/chibi-ruu.png",
      alt: "Ruu chibi illustration",
    },
    secondary: [
      {
        src: "/images/cheebruu.png",
        alt: "Ruu chibi",
        rotation: 4,
      },
      {
        src: "/images/chibi-raffle-ruutuli.png",
        alt: "Ruu chibi",
        rotation: -3,
      },
    ],
    rotatingCosplayIds: [],
    rotationIntervalMs: 9000,
  },
  businessEmail: "",
  location: "Southeastern US",
  showLocationPublicly: true,
  yearsCosplaying: "17+",
  completedCosplays: "60+",
  conventionsAttended: "30+",
  collaborationServices: [
    {
      title: "Convention Appearances",
      description:
        "Guest spots, panels, meet-and-greets — I'm usually open to it if the con and travel make sense.",
    },
    {
      title: "Cosplay Product Sponsorship",
      description:
        "I'm not really a general sponsored-post person. If you want to sponsor something for an actual build — a wig, fabric, prop, contacts, etc. — we can talk.",
    },
    {
      title: "Product Features",
      description:
        "If I'm already using your stuff on a cosplay, I'm happy to show it off in photos or at a con.",
    },
    {
      title: "Photoshoots & Creative Projects",
      description: "Cosplay shoots, themed sets, and weird one-off ideas — always down to hear about it.",
    },
  ],
  platforms: [
    { id: "instagram", enabled: false },
    { id: "tiktok", enabled: false },
    { id: "youtube", enabled: false },
    { id: "twitch", enabled: false },
    { id: "bluesky", enabled: false },
  ],
  audienceDetails: {},
  pastCollaborations: [],
  pressFeatures: [],
  pdfUrl: "",
  pdfFileName: "",
  metricsLastUpdated: "",
  youtubeUrl: "",
  blueskyUrl: "",
};

/** Cosplay IDs to flag as featured when seeding / patching the database. */
export const mediaKitFeaturedCosplayIds: string[] = [...MEDIA_KIT_FEATURED_COSPLAY_IDS];
