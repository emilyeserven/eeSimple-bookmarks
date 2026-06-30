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

/**
 * A social-media account identified from a URL or a {@link SocialLink}. `handle` is normalized
 * (lowercased, no leading "@", no trailing slash); `profileUrl` is the canonical profile URL for
 * the account (e.g. `https://instagram.com/{handle}`). Pure data — built by {@link socialAccountFromUrl}.
 */
export interface SocialAccountRef {
  platform: SocialMediaPlatform;
  handle: string;
  profileUrl: string;
}

/** GitHub paths that are app routes rather than usernames, so `github.com/{seg}` isn't a profile. */
export const GITHUB_SYSTEM_PATHS = new Set([
  "about", "pricing", "features", "marketplace", "sponsors", "team", "enterprise",
  "contact", "login", "join", "signup", "issues", "pulls", "search", "explore",
  "notifications", "gist", "gists", "security", "settings", "apps", "topics",
  "trending", "collections", "events", "sponsors", "readme", "customer-stories",
  "orgs", "users", "new", "account", "dashboard", "codespaces", "watching", "stars",
]);

/** Normalize a raw handle/username: trim, strip a leading "@", drop a trailing slash, lowercase. */
export function normalizeSocialHandle(raw: string): string {
  return raw
    .trim()
    .replace(/^@+/, "")
    .replace(/\/+$/, "")
    .toLowerCase();
}

interface ParsedUrl {
  host: string;
  segments: string[];
}

/** Parse an http(s) URL into a `www.`-stripped lowercase host + non-empty path segments, or null. */
function parseHttpUrl(value: string): ParsedUrl | null {
  let url: URL;
  try {
    url = new URL(value);
  }
  catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  return {
    host: url.hostname.toLowerCase().replace(/^www\./, ""),
    segments: url.pathname.split("/").filter(Boolean),
  };
}

function makeRef(platform: SocialMediaPlatform, handle: string, profileUrl: string): SocialAccountRef | null {
  const normalized = normalizeSocialHandle(handle);
  if (!normalized) return null;
  return {
    platform,
    handle: normalized,
    profileUrl,
  };
}

const INSTAGRAM_RESERVED = new Set([
  "p", "reel", "reels", "tv", "stories", "explore", "accounts", "direct", "about", "legal",
]);
const X_RESERVED = new Set([
  "home", "search", "i", "messages", "settings", "explore", "notifications",
  "hashtag", "intent", "share", "login", "signup", "tos", "privacy",
]);
const FACEBOOK_RESERVED = new Set([
  "profile.php", "pages", "groups", "events", "watch", "marketplace", "sharer",
  "login", "help", "about", "policies",
]);

/** A parsed URL's normalized parts, passed to each per-platform matcher. */
interface UrlParts {
  host: string;
  /** First path segment, normalized (lowercased, no `@`/trailing slash). */
  seg0: string;
  /** Second path segment, normalized. */
  seg1: string;
  segments: string[];
}

type PlatformMatcher = (parts: UrlParts) => SocialAccountRef | null;

// Instagram — first path segment is the username (covers `/{user}` and `/{user}/p/{code}`);
// bare `/p/{code}` and `/reel/{code}` are reserved and carry no username.
function matchInstagram({
  host, seg0,
}: UrlParts): SocialAccountRef | null {
  if (host !== "instagram.com" && !host.endsWith(".instagram.com")) return null;
  if (!seg0 || INSTAGRAM_RESERVED.has(seg0)) return null;
  return makeRef("instagram", seg0, `https://instagram.com/${seg0}`);
}

// X / Twitter — first segment is the handle (covers `/{user}` and `/{user}/status/{id}`).
function matchX({
  host, seg0,
}: UrlParts): SocialAccountRef | null {
  if (host !== "x.com" && host !== "twitter.com" && !host.endsWith(".twitter.com")) return null;
  if (!seg0 || X_RESERVED.has(seg0)) return null;
  return makeRef("x", seg0, `https://x.com/${seg0}`);
}

// Facebook — `facebook.com/{user}`; skip numeric `profile.php?id=…` (no clean handle).
function matchFacebook({
  host, seg0,
}: UrlParts): SocialAccountRef | null {
  if (host !== "facebook.com" && host !== "fb.com" && !host.endsWith(".facebook.com")) return null;
  if (!seg0 || FACEBOOK_RESERVED.has(seg0)) return null;
  return makeRef("facebook", seg0, `https://facebook.com/${seg0}`);
}

// LinkedIn — personal profiles only (`linkedin.com/in/{slug}`).
function matchLinkedIn({
  host, seg0, seg1,
}: UrlParts): SocialAccountRef | null {
  if (host !== "linkedin.com" && !host.endsWith(".linkedin.com")) return null;
  if (seg0 !== "in" || !seg1) return null;
  return makeRef("linkedin", seg1, `https://linkedin.com/in/${seg1}`);
}

// GitHub — single path segment that isn't an app route.
function matchGitHub({
  host, seg0, segments,
}: UrlParts): SocialAccountRef | null {
  if (host !== "github.com") return null;
  if (segments.length !== 1 || !seg0 || GITHUB_SYSTEM_PATHS.has(seg0)) return null;
  return makeRef("github", seg0, `https://github.com/${seg0}`);
}

// Bluesky — `bsky.app/profile/{handle}`.
function matchBluesky({
  host, seg0, seg1,
}: UrlParts): SocialAccountRef | null {
  if (host !== "bsky.app") return null;
  if (seg0 !== "profile" || !seg1) return null;
  return makeRef("bluesky", seg1, `https://bsky.app/profile/${seg1}`);
}

// Goodreads — keep the path-based shape; the handle is weak, so this is detect-only.
function matchGoodreads({
  host, segments,
}: UrlParts): SocialAccountRef | null {
  if (host !== "goodreads.com") return null;
  const last = segments[segments.length - 1];
  if (last === undefined) return null;
  return makeRef("goodreads", last, `https://goodreads.com/${segments.join("/")}`);
}

const PLATFORM_MATCHERS: PlatformMatcher[] = [
  matchInstagram,
  matchX,
  matchFacebook,
  matchLinkedIn,
  matchGitHub,
  matchBluesky,
  matchGoodreads,
];

/**
 * Given any URL, return the social account it points at, or null when it isn't a recognizable
 * profile. Handles the username-bearing shapes for Instagram, X/Twitter, Facebook, LinkedIn,
 * GitHub, Bluesky, and Goodreads.
 *
 * Important: Instagram post/reel permalinks (`instagram.com/p/{code}`, `/reel/{code}`) carry no
 * username, so they return null; the username-prefixed form (`instagram.com/{user}/p/{code}`) does
 * yield a handle (segment 0). Pure — unit-testable.
 */
export function socialAccountFromUrl(value: string): SocialAccountRef | null {
  const parsed = parseHttpUrl(value);
  if (!parsed) return null;
  const parts: UrlParts = {
    host: parsed.host,
    seg0: normalizeSocialHandle(parsed.segments[0] ?? ""),
    seg1: normalizeSocialHandle(parsed.segments[1] ?? ""),
    segments: parsed.segments,
  };
  for (const matcher of PLATFORM_MATCHERS) {
    const ref = matcher(parts);
    if (ref) return ref;
  }
  return null;
}

/** True when two refs are the same account (same platform + normalized handle). */
export function sameSocialAccount(a: SocialAccountRef, b: SocialAccountRef): boolean {
  return a.platform === b.platform && a.handle === b.handle;
}

/** Build a {@link SocialAccountRef} from a stored {@link SocialLink}, or null when its URL isn't parseable. */
export function socialAccountFromLink(link: SocialLink): SocialAccountRef | null {
  return socialAccountFromUrl(link.url);
}
