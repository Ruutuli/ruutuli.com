export type MediaKitPlatformId = "instagram" | "tiktok" | "youtube" | "twitch" | "bluesky";

export interface MediaKitHeroImage {
  /** Direct image URL */
  src?: string;
  /** Pull main image from a cosplay record */
  cosplayId?: string;
  alt: string;
  objectPosition?: string;
  /** Rotation in degrees — used on secondary hero photos */
  rotation?: number;
}

export interface MediaKitCollaborationService {
  title: string;
  description: string;
}

export interface MediaKitPlatform {
  id: MediaKitPlatformId;
  enabled: boolean;
  handle?: string;
  url?: string;
  followers?: string;
  subscribers?: string;
  engagementRate?: string;
  averageViews?: string;
  monthlyReach?: string;
}

export interface MediaKitAudienceGender {
  label: string;
  percent: number;
}

export interface MediaKitAudienceDetails {
  primaryAgeRange?: string;
  topCountries?: string[];
  interests?: string[];
  genderDistribution?: MediaKitAudienceGender[];
  averageContentReach?: string;
}

export interface MediaKitPastCollaboration {
  name: string;
  logo?: string;
  type?: string;
  year?: string;
  url?: string;
}

export interface MediaKitPressFeature {
  publication: string;
  title: string;
  date?: string;
  thumbnail?: string;
  url?: string;
}

export interface MediaKitSettings {
  /** Eyebrow above hero heading */
  eyebrow: string;
  /** Hero heading — defaults to “Hi, I’m {displayName}!” when empty */
  heading: string;
  /** Hero introduction paragraph */
  introduction: string;
  hero: {
    main?: MediaKitHeroImage;
    secondary: MediaKitHeroImage[];
    /** Cosplay IDs to cycle through for the main hero photo */
    rotatingCosplayIds: string[];
    rotationIntervalMs: number;
  };
  businessEmail: string;
  location: string;
  showLocationPublicly: boolean;
  yearsCosplaying: string;
  completedCosplays: string;
  conventionsAttended: string;
  collaborationServices: MediaKitCollaborationService[];
  platforms: MediaKitPlatform[];
  audienceDetails: MediaKitAudienceDetails;
  pastCollaborations: MediaKitPastCollaboration[];
  pressFeatures: MediaKitPressFeature[];
  pdfUrl: string;
  pdfFileName: string;
  metricsLastUpdated: string;
  /** Optional YouTube URL for hero social row when not in site settings */
  youtubeUrl: string;
  /** Optional Bluesky URL for hero social row */
  blueskyUrl: string;
}
