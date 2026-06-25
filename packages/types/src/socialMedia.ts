export const SOCIAL_MEDIA_PLATFORMS = [
  "x",
  "instagram",
  "facebook",
  "linkedin",
  "line",
  "naver",
  "amazon",
  "wikipedia",
  "github",
  "goodreads",
  "bluesky",
] as const;

export type SocialMediaPlatform = typeof SOCIAL_MEDIA_PLATFORMS[number];

export const SOCIAL_MEDIA_PLATFORM_LABELS: Record<SocialMediaPlatform, string> = {
  x: "X",
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  line: "Line",
  naver: "Naver",
  amazon: "Amazon",
  wikipedia: "Wikipedia",
  github: "GitHub",
  goodreads: "Goodreads",
  bluesky: "Bluesky",
};

export interface SocialLink {
  platform: SocialMediaPlatform;
  url: string;
}
