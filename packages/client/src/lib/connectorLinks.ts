import type { ConnectorsStatus } from "@eesimple/types";
import type React from "react";

import { Archive, BookMarked, MonitorPlay, Tv } from "lucide-react";

/**
 * A single external link-out to a configured connector, shown in the sidebar's Connectors section and
 * listed (when configured) in the Settings → Display → Sidebar "Connector Links" card. Both surfaces
 * map over {@link CONNECTOR_LINKS} so they never drift.
 */
export interface ConnectorLink {
  /** Stable key used in the hidden/see-more placement lists. */
  key: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.ComponentType<any>;
  /** Whether the connector is configured (its endpoint is set) — gates both the card row and the link. */
  isConfigured: (c: ConnectorsStatus) => boolean;
  /** The external URL to open, or `null` when unconfigured. */
  href: (c: ConnectorsStatus) => string | null;
  /** The label shown for the link. */
  label: (c: ConnectorsStatus) => string;
}

/** Title-case a hosted-metadata provider slug (e.g. `browserless` → `Browserless`), else a fallback. */
export function providerLabel(provider: string | null): string {
  const trimmed = provider?.trim();
  if (!trimmed) return "Hosted Metadata";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/**
 * The connectors that expose a visitable instance URL. Only these appear as sidebar link-outs — the
 * keyless connectors (oEmbed, geocoding, …) and key-only ones (YouTube Data API) have no UI to open.
 */
export const CONNECTOR_LINKS: readonly ConnectorLink[] = [
  {
    key: "kavita",
    icon: BookMarked,
    // The web UI opens without the plugin key, so gate on the base URL alone (not `kavita.enabled`).
    isConfigured: c => Boolean(c.kavita.baseUrl),
    href: c => c.kavita.baseUrl,
    label: () => "Kavita",
  },
  {
    key: "archivebox",
    icon: Archive,
    isConfigured: c => Boolean(c.archiveBox.baseUrl),
    href: c => c.archiveBox.baseUrl,
    label: () => "ArchiveBox",
  },
  {
    key: "plex",
    icon: Tv,
    // The web app opens without the token, so gate on the base URL alone (not `plex.enabled`).
    isConfigured: c => Boolean(c.plex.baseUrl),
    // Land on the Plex web UI (the raw base URL serves the XML API root, not the app).
    href: c => (c.plex.baseUrl ? `${c.plex.baseUrl.replace(/\/$/, "")}/web` : null),
    label: () => "Plex",
  },
  {
    key: "hosted-metadata",
    icon: MonitorPlay,
    isConfigured: c => Boolean(c.hostedMetadata.baseUrl),
    href: c => c.hostedMetadata.baseUrl,
    label: c => providerLabel(c.hostedMetadata.provider),
  },
];
