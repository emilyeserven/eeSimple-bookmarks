/**
 * Optional hosted metadata provider (Tier 2, DEFAULT OFF). When an operator configures a
 * Browserless endpoint (self-hosted `ghcr.io/browserless/chromium`), a single call renders the
 * page with a real browser and returns title/description/image/author/publisher/date — handling
 * JS rendering and bot protection that the direct scrape can't.
 *
 * Privacy / self-hosted ethos: nothing leaves the box unless the endpoint is configured. When
 * unset, `hostedMetadataEnabled()` is false and the metadata pipeline behaves identically to before
 * (direct scrape only). Callers always fall back to the direct scrape when this returns `null`.
 */

import {
  extractAuthorNames,
  extractDescription,
  extractImageUrl,
  extractPublisher,
  extractTitle,
  isPublicHttpUrl,
  metaContent,
} from "@/services/metadata";
import {
  getActiveHostedEndpoint,
  getActiveHostedProvider,
  getDecryptedHostedApiKey,
} from "@/services/appSettings";

const HOSTED_TIMEOUT_MS = 15000;

/** Whether a hosted metadata provider is configured (its endpoint env var is set). Sync, env-only. */
export function hostedMetadataEnabled(): boolean {
  return Boolean(process.env.HOSTED_METADATA_ENDPOINT);
}

/** Whether a hosted metadata provider is configured — checks DB first, then env var. */
export async function hostedMetadataEnabledAsync(): Promise<boolean> {
  return Boolean(await getActiveHostedEndpoint());
}

/** The configured provider name — DB first, then env var. */
export async function hostedMetadataProviderAsync(): Promise<string | null> {
  return getActiveHostedProvider();
}

/** Normalized hosted-provider metadata. Every field is nullable — a provider may omit any of them. */
export interface HostedMetadata {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  authorName: string | null;
  publisher: string | null;
  datePosted: string | null;
}

/** Normalize an ISO-ish date string to `"YYYY-MM-DD"`, or `null`. */
export function normalizeDate(raw: string | null): string | null {
  if (raw === null) return null;
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(raw.trim());
  return match ? match[1] : null;
}

/**
 * Fetch metadata for `url` from the configured Browserless instance. Posts to
 * `/chromium/content`, receives rendered HTML, then parses it with the existing `extract*`
 * utilities. Returns `null` when the provider is disabled, the request fails, or every field is
 * empty. Never throws.
 */
export async function fetchHostedMetadata(url: string): Promise<HostedMetadata | null> {
  const endpoint = await getActiveHostedEndpoint();
  if (!endpoint) return null;
  const token = await getDecryptedHostedApiKey();

  let html: string;
  try {
    const res = await fetch(`${endpoint.replace(/\/$/, "")}/chromium/content`, {
      method: "POST",
      redirect: "follow",
      signal: AbortSignal.timeout(HOSTED_TIMEOUT_MS),
      headers: {
        "Content-Type": "application/json",
        "Accept": "text/html",
        ...(token
          ? {
            Authorization: `Bearer ${token}`,
          }
          : {}),
      },
      body: JSON.stringify({
        url,
      }),
    });
    if (!res.ok) return null;
    html = await res.text();
  }
  catch {
    return null;
  }

  const authors = extractAuthorNames(html);
  const imageUrl = extractImageUrl(html, url);
  const rawDate = metaContent(html, /property=["']article:published_time["']/i) ?? null;

  const result: HostedMetadata = {
    title: extractTitle(html),
    description: extractDescription(html),
    imageUrl: imageUrl && isPublicHttpUrl(imageUrl) ? imageUrl : null,
    authorName: authors[0] ?? null,
    publisher: extractPublisher(html),
    datePosted: normalizeDate(rawDate),
  };
  if (
    result.title === null
    && result.description === null
    && result.imageUrl === null
    && result.authorName === null
  ) {
    return null;
  }
  return result;
}
