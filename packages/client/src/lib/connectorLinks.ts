import type { ConnectorsStatus } from "@eesimple/types";
import type React from "react";

import { Archive, BookMarked, MonitorPlay, Tv } from "lucide-react";

import i18n from "../i18n";

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
  if (!trimmed) return i18n.t("Hosted Metadata");
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
    // Prefer the browser-facing sidebar override (e.g. a MagicDNS hostname) when set; the connector
    // base URL is only guaranteed reachable from the middleware container, not from the browser.
    href: c => c.kavita.sidebarUrl || c.kavita.baseUrl,
    label: () => i18n.t("Kavita"),
  },
  {
    key: "archivebox",
    icon: Archive,
    isConfigured: c => Boolean(c.archiveBox.baseUrl),
    href: c => c.archiveBox.baseUrl,
    label: () => i18n.t("ArchiveBox"),
  },
  {
    key: "plex",
    icon: Tv,
    // The web app opens without the token, so gate on the base URL alone (not `plex.enabled`).
    isConfigured: c => Boolean(c.plex.baseUrl),
    // Land on the Plex web UI (the raw base URL serves the XML API root, not the app).
    href: c => (c.plex.baseUrl ? `${c.plex.baseUrl.replace(/\/$/, "")}/web` : null),
    label: () => i18n.t("Plex"),
  },
  {
    key: "hosted-metadata",
    icon: MonitorPlay,
    isConfigured: c => Boolean(c.hostedMetadata.baseUrl),
    // The bare base URL is the Browserless debugger UI, which requires a `?token=` query param we
    // don't expose to the client — visiting it directly 401s. `/docs` serves the instance's
    // interactive API docs without auth, so the link always lands somewhere useful.
    href: c => (c.hostedMetadata.baseUrl ? `${c.hostedMetadata.baseUrl.replace(/\/$/, "")}/docs` : null),
    label: c => providerLabel(c.hostedMetadata.provider),
  },
];
