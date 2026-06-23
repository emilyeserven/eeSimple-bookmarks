import type { CheckUrlResult, FetchMetadataResult } from "@eesimple/types";

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
};
