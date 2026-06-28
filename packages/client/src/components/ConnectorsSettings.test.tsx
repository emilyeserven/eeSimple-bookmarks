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
      objectStorage: {
        configured: false,
      },
      archiveBox: {
        enabled: false,
        baseUrl: null,
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
    expect(screen.getByText("Base URL")).toBeInTheDocument();

    // YouTube Data API is enabled → an Active badge; the hosted provider is disabled → Inactive.
    expect(screen.getAllByText("Active").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Inactive").length).toBeGreaterThan(0);
  });
});
