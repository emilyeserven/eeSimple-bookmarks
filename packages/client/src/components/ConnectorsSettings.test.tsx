import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ConnectorsSettings } from "./ConnectorsSettings";

// YouTube Data API on, hosted provider off — exercises both the Active and Inactive badges.
vi.mock("../hooks/useConnectors", () => ({
  useConnectors: () => ({
    data: {
      hostedMetadata: {
        enabled: false,
        provider: null,
      },
      youtubeDataApi: {
        enabled: true,
      },
      instagram: {
        apiKey: false,
      },
      instagramReelArchive: {
        enabled: false,
      },
      objectStorage: {
        configured: false,
      },
      archiveBox: {
        enabled: false,
        baseUrl: null,
      },
      kavita: {
        enabled: false,
        baseUrl: null,
      },
      geocoding: {
        enabled: true,
        endpoint: "https://nominatim.openstreetmap.org",
      },
      wikidata: {
        enabled: true,
        endpoint: "https://www.wikidata.org",
      },
    },
  }),
}));

vi.mock("@tanstack/react-query", () => ({
  useMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("../hooks/useAppSettings", () => ({
  useConnectorsSettings: () => ({
    data: {
      hostedMetadataEndpoint: "",
      hostedMetadataProvider: "",
      hostedMetadataApiKeySet: false,
      encryptionEnabled: false,
      archiveBoxEndpoint: "",
      kavitaEndpoint: "",
      kavitaApiKeySet: false,
      youtubeApiKeySet: false,
    },
  }),
  useUpdateConnectorsSettings: () => ({
    mutate: vi.fn(),
  }),
}));

describe("ConnectorsSettings", () => {
  it("renders a card per connector with the oEmbed provider list and live status", () => {
    render(<ConnectorsSettings />);

    expect(screen.getByText("oEmbed providers")).toBeInTheDocument();
    // The provider chips come from the shared OEMBED_PROVIDERS registry.
    expect(screen.getByText("Vimeo")).toBeInTheDocument();
    expect(screen.getByText("TikTok")).toBeInTheDocument();
    expect(screen.getByText("DuckDuckGo Icons")).toBeInTheDocument();
    expect(screen.getByText("YouTube")).toBeInTheDocument();
    // "ArchiveBox" appears as the card title and in its description link.
    expect(screen.getAllByText("ArchiveBox").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Base URL").length).toBeGreaterThan(0);
    // The Kavita card renders with its editable form (API key field).
    expect(screen.getAllByText("Kavita").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("API key")).toBeInTheDocument();
    // The YouTube card renders with its editable form (API key field).
    expect(screen.getByLabelText("YouTube API key")).toBeInTheDocument();

    // YouTube Data API is enabled → an Active badge; the hosted provider is disabled → Inactive.
    expect(screen.getAllByText("Active").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Inactive").length).toBeGreaterThan(0);
  });
});
