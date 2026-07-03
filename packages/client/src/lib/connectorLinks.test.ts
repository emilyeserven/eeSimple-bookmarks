// @vitest-environment node
import type { ConnectorsStatus } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { CONNECTOR_LINKS, providerLabel } from "./connectorLinks";

function makeStatus(overrides: Partial<ConnectorsStatus> = {}): ConnectorsStatus {
  return {
    hostedMetadata: {
      enabled: false,
      provider: null,
      baseUrl: null,
    },
    youtubeDataApi: {
      enabled: false,
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
    ...overrides,
  };
}

function link(key: string) {
  const found = CONNECTOR_LINKS.find(l => l.key === key);
  if (!found) throw new Error(`no connector link for ${key}`);
  return found;
}

describe("providerLabel", () => {
  it("title-cases a provider slug", () => {
    expect(providerLabel("browserless")).toBe("Browserless");
    expect(providerLabel("microlink")).toBe("Microlink");
  });

  it("falls back to 'Hosted Metadata' when empty", () => {
    expect(providerLabel(null)).toBe("Hosted Metadata");
    expect(providerLabel("")).toBe("Hosted Metadata");
    expect(providerLabel("   ")).toBe("Hosted Metadata");
  });
});

describe("CONNECTOR_LINKS", () => {
  it("is unconfigured and href-less when no endpoints are set", () => {
    const status = makeStatus();
    for (const l of CONNECTOR_LINKS) {
      expect(l.isConfigured(status)).toBe(false);
      expect(l.href(status)).toBeNull();
    }
  });

  it("gates kavita on the base URL alone (not enabled)", () => {
    const status = makeStatus({
      kavita: {
        enabled: false,
        baseUrl: "http://localhost:5000",
      },
    });
    expect(link("kavita").isConfigured(status)).toBe(true);
    expect(link("kavita").href(status)).toBe("http://localhost:5000");
    expect(link("kavita").label(status)).toBe("Kavita");
  });

  it("labels archivebox and resolves its href", () => {
    const status = makeStatus({
      archiveBox: {
        enabled: true,
        baseUrl: "http://localhost:8000",
      },
    });
    expect(link("archivebox").isConfigured(status)).toBe(true);
    expect(link("archivebox").label(status)).toBe("ArchiveBox");
    expect(link("archivebox").href(status)).toBe("http://localhost:8000");
  });

  it("gates plex on the base URL and lands on the web UI", () => {
    const status = makeStatus({
      plex: {
        enabled: false,
        baseUrl: "http://plex.local:32400/",
        machineIdentifier: null,
      },
    });
    expect(link("plex").isConfigured(status)).toBe(true);
    expect(link("plex").label(status)).toBe("Plex");
    expect(link("plex").href(status)).toBe("http://plex.local:32400/web");
  });

  it("labels the hosted-metadata link by provider name", () => {
    const status = makeStatus({
      hostedMetadata: {
        enabled: true,
        provider: "browserless",
        baseUrl: "http://localhost:3000",
      },
    });
    expect(link("hosted-metadata").isConfigured(status)).toBe(true);
    expect(link("hosted-metadata").label(status)).toBe("Browserless");
    expect(link("hosted-metadata").href(status)).toBe("http://localhost:3000/docs");
  });
});
