// @vitest-environment node
import { PODCAST_LINK_PROVIDER_LABELS, PODCAST_LINK_PROVIDERS } from "@eesimple/types";
import { describe, expect, it } from "vitest";

import type { PodcastLinkFields } from "./podcastLinks";

import { podcastLinkUrl, resolvePodcastDefaultLink } from "./podcastLinks";

function makePodcast(overrides: Partial<PodcastLinkFields> = {}): PodcastLinkFields {
  return {
    feedUrl: null,
    itunesUrl: null,
    spotifyUrl: null,
    pocketCastsUrl: null,
    defaultLinkProvider: null,
    ...overrides,
  };
}

describe("podcastLinkUrl", () => {
  it("returns the field matching each provider", () => {
    const podcast = makePodcast({
      feedUrl: "https://feed.example/rss",
      itunesUrl: "https://itunes.example/id1",
      spotifyUrl: "https://open.spotify.com/show/1",
      pocketCastsUrl: "https://pca.st/1",
    });
    expect(podcastLinkUrl(podcast, "feed")).toBe(podcast.feedUrl);
    expect(podcastLinkUrl(podcast, "itunes")).toBe(podcast.itunesUrl);
    expect(podcastLinkUrl(podcast, "spotify")).toBe(podcast.spotifyUrl);
    expect(podcastLinkUrl(podcast, "pocketCasts")).toBe(podcast.pocketCastsUrl);
  });

  it("passes through null when a provider's field is unset", () => {
    const podcast = makePodcast();
    for (const provider of PODCAST_LINK_PROVIDERS) {
      expect(podcastLinkUrl(podcast, provider)).toBeNull();
    }
  });
});

describe("resolvePodcastDefaultLink", () => {
  it("returns null when there is no default provider and no links", () => {
    expect(resolvePodcastDefaultLink(makePodcast())).toBeNull();
  });

  it("returns the first available provider in canonical order when no default is set", () => {
    const podcast = makePodcast({
      spotifyUrl: "https://open.spotify.com/show/1",
      pocketCastsUrl: "https://pca.st/1",
    });
    expect(resolvePodcastDefaultLink(podcast)).toEqual({
      provider: "spotify",
      url: podcast.spotifyUrl,
      label: PODCAST_LINK_PROVIDER_LABELS.spotify,
    });
  });

  it("prefers the explicit default provider even when it's not first in canonical order", () => {
    const podcast = makePodcast({
      feedUrl: "https://feed.example/rss",
      itunesUrl: "https://itunes.example/id1",
      spotifyUrl: "https://open.spotify.com/show/1",
      pocketCastsUrl: "https://pca.st/1",
      defaultLinkProvider: "spotify",
    });
    expect(resolvePodcastDefaultLink(podcast)).toEqual({
      provider: "spotify",
      url: podcast.spotifyUrl,
      label: PODCAST_LINK_PROVIDER_LABELS.spotify,
    });
  });

  it("falls back to canonical order among the rest when the preferred provider's URL is null", () => {
    const podcast = makePodcast({
      itunesUrl: "https://itunes.example/id1",
      spotifyUrl: "https://open.spotify.com/show/1",
      defaultLinkProvider: "feed",
    });
    expect(resolvePodcastDefaultLink(podcast)).toEqual({
      provider: "itunes",
      url: podcast.itunesUrl,
      label: PODCAST_LINK_PROVIDER_LABELS.itunes,
    });
  });

  it("returns null when every field including the default is null", () => {
    expect(resolvePodcastDefaultLink(makePodcast({
      defaultLinkProvider: "feed",
    }))).toBeNull();
  });

  it("has a label for every canonical provider", () => {
    for (const provider of PODCAST_LINK_PROVIDERS) {
      expect(PODCAST_LINK_PROVIDER_LABELS[provider]).toBeTruthy();
    }
  });
});
