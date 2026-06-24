export const SOCIAL_MEDIA_PLATFORMS = [
  "x",
  "instagram",
  "facebook",
  "linkedin",
  "line",
  "naver",
  "amazon",
  "wikipedia",
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
};

export interface SocialLink {
  platform: SocialMediaPlatform;
  url: string;
}
