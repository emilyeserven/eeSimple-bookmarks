import type { CheckUrlResult, FetchIsbnMetadataResult, FetchMetadataResult, ResolveUrlResult, ScanResult } from "@eesimple/types";

import { request } from "./client";

function buildSiteParams({
  url, siteName,
}: { url: string;
  siteName?: string; }): URLSearchParams {
  const params = new URLSearchParams({
    url,
  });
  if (siteName) params.set("siteName", siteName);
  return params;
}

export const metadataApi = {
  fetchTitle: ({
    url, siteName,
  }: { url: string;
    siteName?: string; }) =>
    request<{ title: string }>(`/fetch-title?${buildSiteParams({
      url,
      siteName,
    }).toString()}`),
  fetchMetadata: ({
    url, siteName,
  }: { url: string;
    siteName?: string; }) =>
    request<FetchMetadataResult>(`/fetch-metadata?${buildSiteParams({
      url,
      siteName,
    }).toString()}`),
  checkUrl: ({
    url,
  }: { url: string }) =>
    request<CheckUrlResult>(`/check-url?url=${encodeURIComponent(url)}`),
  resolveUrl: ({
    url,
  }: { url: string }) =>
    request<ResolveUrlResult>(`/resolve-url?url=${encodeURIComponent(url)}`),
  fetchIsbnMetadata: ({
    isbn,
  }: { isbn: string }) =>
    request<FetchIsbnMetadataResult>(`/fetch-isbn-metadata?isbn=${encodeURIComponent(isbn)}`),
  isbnFromBookUrl: ({
    url,
  }: { url: string }) =>
    request<{ isbn: string | null }>(`/isbn/from-book-url?url=${encodeURIComponent(url)}`),
  // Consolidated single-fetch scan: redirect + website + duplicate + metadata + favicon in one call.
  // `resolveRedirect: false` (for redirect-ignore-listed domains) tells the server to skip redirects.
  scan: ({
    url, siteName, resolveRedirect,
  }: { url: string;
    siteName?: string;
    resolveRedirect?: boolean; }) => {
    const params = buildSiteParams({
      url,
      siteName,
    });
    if (resolveRedirect === false) params.set("resolveRedirect", "false");
    return request<ScanResult>(`/scan?${params.toString()}`);
  },
};
