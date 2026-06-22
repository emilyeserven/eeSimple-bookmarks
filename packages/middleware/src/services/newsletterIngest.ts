/**
 * Pure newsletter link-extraction: turn pasted/fetched/uploaded newsletter content into a deduped
 * list of candidate article links. No network, no DB — every function here is unit-testable.
 *
 * HTML parsing is regex-based, mirroring `services/metadata.ts` (no HTML-parser dependency). `.eml`
 * handling is a minimal in-house MIME extractor rather than a `mailparser` dependency — newsletters
 * are almost always a flat multipart/alternative with a `text/html` part, which this covers.
 */

import { decodeEntities } from "@/services/metadata";

/** A candidate link extracted from newsletter content, before unwrap/canonicalize/enrich. */
export interface LinkCandidate {
  /** The href exactly as found in the source (may be a tracker/wrapped URL). */
  rawUrl: string;
  /** Visible anchor text, entity-decoded + whitespace-collapsed; "" when none. */
  anchorText: string;
  /** Where the candidate came from — for diagnostics, not gating. */
  source: "html-anchor" | "plain-text";
}

/** Image extensions that mark a URL as a tracking pixel / asset rather than an article. */
const IMAGE_EXT = /\.(?:gif|png|jpe?g|webp|svg|ico|bmp)$/i;

/**
 * Anchor-text phrases that mark newsletter chrome (management/legal/footer links). Matched as a
 * substring of the lower-cased anchor text. Conservative on purpose — the review queue is the real
 * filter, so we'd rather keep a borderline link than silently drop a real article.
 */
const JUNK_ANCHOR_PHRASES = [
  "unsubscribe",
  "view in browser",
  "view online",
  "view this email",
  "read online",
  "update preferences",
  "update your preferences",
  "manage subscription",
  "manage your subscription",
  "email preferences",
  "privacy policy",
  "terms of service",
  "terms of use",
  "report spam",
  "add us to your address book",
  "forward to a friend",
  "forward this email",
];

/** Path fragments that mark a platform management/legal link regardless of host. */
const JUNK_PATH_FRAGMENTS = [
  "unsubscribe",
  "/manage",
  "/preferences",
  "/profile",
  "optout",
  "opt-out",
  "email-settings",
];

/** Hosts whose links are usually share buttons unless they carry a real title. */
const SOCIAL_HOSTS = new Set([
  "facebook.com",
  "twitter.com",
  "x.com",
  "linkedin.com",
  "instagram.com",
  "pinterest.com",
  "threads.net",
  "t.me",
  "wa.me",
  "reddit.com",
]);

/** Anchor words that, on a social host, mark the link as a share/follow button. */
const SOCIAL_WORDS = /\b(?:share|tweet|follow|like|pin it|facebook|twitter|linkedin|instagram)\b/i;

/** Lower-cased host with a leading `www.` stripped. */
function normalizeHost(parsed: URL): string {
  return parsed.hostname.replace(/^www\./i, "").toLowerCase();
}

/** Strip inner HTML tags from an anchor body and normalise the visible text. */
function anchorTextFrom(innerHtml: string): string {
  return decodeEntities(innerHtml.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

/** Keep only absolute http(s) hrefs; drop mailto:/tel:/#/javascript: and relative links. */
function isExtractableHref(href: string): boolean {
  return /^https?:\/\//i.test(href.trim());
}

/** Extract candidate links from newsletter HTML by scanning `<a …>text</a>`. Pure. */
export function extractHtmlCandidates(html: string): LinkCandidate[] {
  const candidates: LinkCandidate[] = [];
  for (const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const attrs = match[1] ?? "";
    const href = /href=["']([^"']*)["']/i.exec(attrs)?.[1];
    if (!href || !isExtractableHref(href)) continue;
    candidates.push({
      rawUrl: decodeEntities(href).trim(),
      anchorText: anchorTextFrom(match[2] ?? ""),
      source: "html-anchor",
    });
  }
  return candidates;
}

/** Extract bare URLs from a plain-text paste. Pure. */
export function extractTextCandidates(text: string): LinkCandidate[] {
  const candidates: LinkCandidate[] = [];
  for (const match of text.matchAll(/\bhttps?:\/\/[^\s<>"')\]]+/gi)) {
    // Trim trailing punctuation that commonly clings to URLs in prose.
    const rawUrl = match[0].replace(/[.,;:!?]+$/, "");
    if (rawUrl.length === 0) continue;
    candidates.push({
      rawUrl,
      anchorText: "",
      source: "plain-text",
    });
  }
  return candidates;
}

/** Whether `content` looks like HTML (has a tag) vs plain text. */
function looksLikeHtml(content: string): boolean {
  return /<a\b|<\/a>|<html|<body|<div|<table|<p[\s>]/i.test(content);
}

/** Extract candidates from raw content, sniffing HTML vs text when `kind` is "auto". Pure. */
export function extractCandidates(content: string, kind: "html" | "text" | "auto"): LinkCandidate[] {
  const resolved = kind === "auto" ? (looksLikeHtml(content) ? "html" : "text") : kind;
  return resolved === "html" ? extractHtmlCandidates(content) : extractTextCandidates(content);
}

/** True when a candidate looks like newsletter chrome (nav/footer/unsubscribe/social/pixel). Pure. */
export function isJunkLink(candidate: LinkCandidate): boolean {
  let parsed: URL;
  try {
    parsed = new URL(candidate.rawUrl);
  }
  catch {
    return true;
  }
  const host = normalizeHost(parsed);
  const path = parsed.pathname.toLowerCase();
  const anchor = candidate.anchorText.trim().toLowerCase();

  // Tracking pixel / asset link.
  if (IMAGE_EXT.test(path)) return true;
  // Platform management / legal link.
  if (JUNK_PATH_FRAGMENTS.some(fragment => path.includes(fragment))) return true;
  if (JUNK_ANCHOR_PHRASES.some(phrase => anchor.includes(phrase))) return true;
  // Social share/follow button — kept only when it carries a real (non-social) title.
  if (SOCIAL_HOSTS.has(host) && (anchor.length === 0 || SOCIAL_WORDS.test(anchor))) return true;

  return false;
}

/** Dedupe key: host + pathname, ignoring query/fragment (collapses the same article wrapped twice). */
function dedupeKey(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    return `${normalizeHost(parsed)}${parsed.pathname.replace(/\/$/, "")}`;
  }
  catch {
    return rawUrl;
  }
}

/** Drop junk links and dedupe, preserving first-seen order and keeping the richest anchor text. Pure. */
export function filterAndDedupe(candidates: LinkCandidate[]): LinkCandidate[] {
  const byKey = new Map<string, LinkCandidate>();
  for (const candidate of candidates) {
    if (isJunkLink(candidate)) continue;
    const key = dedupeKey(candidate.rawUrl);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, candidate);
    }
    else if (candidate.anchorText.length > existing.anchorText.length) {
      // Keep the first-seen position but adopt the better title seed.
      byKey.set(key, {
        ...existing,
        anchorText: candidate.anchorText,
      });
    }
  }
  return [...byKey.values()];
}

// --- Minimal .eml (MIME) extraction ----------------------------------------------------------

/** Map a MIME charset label to a Node-supported encoding. */
function nodeEncoding(charset: string | undefined): BufferEncoding {
  const c = (charset ?? "utf-8").toLowerCase();
  if (c.includes("utf-8") || c.includes("utf8") || c === "us-ascii" || c === "ascii") return "utf8";
  if (c.includes("8859-1") || c.includes("1252") || c.includes("latin1")) return "latin1";
  return "utf8";
}

/** Parse a header block into a lower-cased name → value map, unfolding continuation lines. */
function parseHeaders(block: string): Map<string, string> {
  const headers = new Map<string, string>();
  const unfolded = block.replace(/\r?\n[ \t]+/g, " ");
  for (const line of unfolded.split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    headers.set(line.slice(0, idx).trim().toLowerCase(), line.slice(idx + 1).trim());
  }
  return headers;
}

/** Pull a directive (e.g. `boundary`, `charset`) value out of a header like Content-Type. */
function directive(headerValue: string | undefined, name: string): string | undefined {
  if (!headerValue) return undefined;
  const match = new RegExp(`${name}\\s*=\\s*"([^"]*)"|${name}\\s*=\\s*([^;\\s]+)`, "i").exec(headerValue);
  return match ? (match[1] ?? match[2]) : undefined;
}

/** Decode a part body (latin1 string of original bytes) per its transfer-encoding + charset. */
function decodeBody(body: string, cte: string | undefined, charset: string | undefined): string {
  const encoding = (cte ?? "7bit").toLowerCase();
  if (encoding === "base64") {
    return Buffer.from(body.replace(/\s+/g, ""), "base64").toString(nodeEncoding(charset));
  }
  if (encoding === "quoted-printable") {
    const bytes = body
      .replace(/=\r?\n/g, "") // soft line breaks
      .replace(/=([0-9A-Fa-f]{2})/g, (_m, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)));
    return Buffer.from(bytes, "latin1").toString(nodeEncoding(charset));
  }
  return Buffer.from(body, "latin1").toString(nodeEncoding(charset));
}

/** Recursively extract the best html/text body from a MIME message or part (latin1 string). */
function parseMimePart(raw: string): { html: string | null;
  text: string | null; } {
  const splitAt = raw.search(/\r?\n\r?\n/);
  if (splitAt === -1) return {
    html: null,
    text: raw || null,
  };
  const headerBlock = raw.slice(0, splitAt);
  const body = raw.slice(splitAt).replace(/^\r?\n\r?\n/, "");
  const headers = parseHeaders(headerBlock);

  const contentType = (headers.get("content-type") ?? "text/plain").toLowerCase();
  const cte = headers.get("content-transfer-encoding");
  const charset = directive(headers.get("content-type"), "charset");

  if (contentType.startsWith("multipart/")) {
    const boundary = directive(headers.get("content-type"), "boundary");
    if (!boundary) return {
      html: null,
      text: null,
    };
    const parts = body.split(new RegExp(`\\r?\\n?--${boundary.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
    let html: string | null = null;
    let text: string | null = null;
    for (const part of parts.slice(1)) {
      if (part.startsWith("--")) break; // closing boundary
      const sub = parseMimePart(part.replace(/^\r?\n/, ""));
      html ??= sub.html;
      text ??= sub.text;
    }
    return {
      html,
      text,
    };
  }

  const decoded = decodeBody(body, cte, charset);
  if (contentType.startsWith("text/html")) return {
    html: decoded,
    text: null,
  };
  return {
    html: null,
    text: decoded,
  };
}

/** Extract the best HTML (or plain text) body from raw `.eml` bytes. */
export function extractEmlHtml(raw: Buffer): { html: string | null;
  text: string | null; } {
  return parseMimePart(raw.toString("latin1"));
}
