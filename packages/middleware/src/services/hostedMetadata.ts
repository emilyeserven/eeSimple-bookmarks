/**
 * Optional hosted metadata provider (Tier 2, DEFAULT OFF). When an operator configures
 * `HOSTED_METADATA_ENDPOINT` (a Microlink-compatible API — Microlink itself, or iframely /
 * opengraph.io behind a compatible shape), a single call returns title/description/image/author/
 * publisher/date and handles JS rendering + bot protection that the direct scrape can't.
 *
 * Privacy / self-hosted ethos: nothing leaves the box unless the endpoint env var is set. When
 * unset, `hostedMetadataEnabled()` is false and the metadata pipeline behaves identically to before
 * (direct scrape only). Callers always fall back to the direct scrape when this returns `null`.
 */

import { isPublicHttpUrl } from "@/services/metadata";

const HOSTED_TIMEOUT_MS = 8000;

/** Whether a hosted metadata provider is configured (its endpoint env var is set). */
export function hostedMetadataEnabled(): boolean {
  return Boolean(process.env.HOSTED_METADATA_ENDPOINT);
}

/** The configured provider name (for display on the Connectors settings page), or `null`. */
export function hostedMetadataProvider(): string | null {
  return process.env.HOSTED_METADATA_PROVIDER ?? null;
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

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

/** Normalize an ISO-ish date string to `"YYYY-MM-DD"`, or `null`. */
function normalizeDate(raw: string | null): string | null {
  if (raw === null) return null;
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(raw.trim());
  return match ? match[1] : null;
}

/** Pull an image URL from a Microlink-style `image` field (a `{ url }` object or a bare string). */
function imageUrlOf(image: unknown): string | null {
  if (typeof image === "string") return asString(image);
  if (image && typeof image === "object" && "url" in image) {
    return asString((image as { url?: unknown }).url);
  }
  return null;
}

/**
 * Fetch metadata for `url` from the configured hosted provider. Returns `null` when the provider is
 * disabled, the request fails, or every field is empty. Never throws.
 */
export async function fetchHostedMetadata(url: string): Promise<HostedMetadata | null> {
  const endpoint = process.env.HOSTED_METADATA_ENDPOINT;
  if (!endpoint) return null;
  const apiKey = process.env.HOSTED_METADATA_API_KEY;

  const reqUrl = `${endpoint}${endpoint.includes("?") ? "&" : "?"}url=${encodeURIComponent(url)}`;
  let raw: Record<string, unknown>;
  try {
    const res = await fetch(reqUrl, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(HOSTED_TIMEOUT_MS),
      headers: {
        Accept: "application/json",
        ...(apiKey
          ? {
            "x-api-key": apiKey,
          }
          : {}),
      },
    });
    if (!res.ok) return null;
    raw = (await res.json()) as Record<string, unknown>;
  }
  catch {
    return null;
  }

  // Microlink nests the payload under `data`; some compatible providers return it flat.
  const data = (raw.data && typeof raw.data === "object" ? raw.data : raw) as Record<string, unknown>;
  const imageUrl = imageUrlOf(data.image);
  const result: HostedMetadata = {
    title: asString(data.title),
    description: asString(data.description),
    imageUrl: imageUrl && isPublicHttpUrl(imageUrl) ? imageUrl : null,
    authorName: asString(data.author),
    publisher: asString(data.publisher),
    datePosted: normalizeDate(asString(data.date) ?? asString(data.published)),
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
