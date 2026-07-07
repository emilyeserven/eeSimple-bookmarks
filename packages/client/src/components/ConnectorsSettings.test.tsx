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
        baseUrl: null,
      },
      youtubeDataApi: {
        enabled: true,
      },
      youtubeEmbed: {
        useNoCookie: true,
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
      plex: {
        enabled: false,
        baseUrl: null,
        machineIdentifier: null,
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
      plexEndpoint: "",
      plexTokenSet: false,
      youtubeApiKeySet: false,
    },
  }),
  useUpdateConnectorsSettings: () => ({
    mutate: vi.fn(),
  }),
}));

describe("ConnectorsSettings", () => {
  it("reflects connector on/off state in Active/Inactive badges and renders editable key fields", () => {
    render(<ConnectorsSettings />);

    // "ArchiveBox" appears as the card title and in its description link.
    expect(screen.getAllByText("ArchiveBox").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Base URL").length).toBeGreaterThan(0);
    // The Kavita card renders with its editable form (API key field).
    expect(screen.getAllByText("Kavita").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("API key")).toBeInTheDocument();
    // The YouTube card renders with its editable form (API key field).
    expect(screen.getByLabelText("YouTube API key")).toBeInTheDocument();

    // Only youtubeDataApi is enabled among the env-gated connectors → one Active status badge
    // (plus the filter bar's "Active" toggle label). The rest (hostedMetadata,
    // instagramReelArchive, archiveBox, kavita, plex) are disabled → five Inactive status badges
    // (plus the filter bar's "Inactive" toggle label). Confirms the badges are derived from live
    // connector state, not hardcoded.
    expect(screen.getAllByText("Active")).toHaveLength(2);
    expect(screen.getAllByText("Inactive")).toHaveLength(6);
  });
});
