/**
 * Optional ArchiveBox web-archive connector (link-out only, DEFAULT OFF). When an operator
 * configures a base URL (`ARCHIVEBOX_ENDPOINT` env var or the saved setting), the client renders
 * link-outs to the bookmark's archived copy on that ArchiveBox instance — the public index search
 * (`<base>/?q=<url>`) and the add view (`<base>/add?url=<url>`).
 *
 * Self-hosted ethos: nothing leaves the box and no token is required — the links are opened by the
 * user's browser against their own ArchiveBox. The base URL is not a secret, so the
 * `/api/connectors` status endpoint returns it for the client to build links. When unset,
 * `archiveBoxEnabled()` is false and no archive UI is shown.
 */

import { getActiveArchiveBoxEndpoint } from "@/services/appSettings";

/** Whether an ArchiveBox base URL is configured (its endpoint env var is set). Sync, env-only. */
export function archiveBoxEnabled(): boolean {
  return Boolean(process.env.ARCHIVEBOX_ENDPOINT);
}

/** Whether ArchiveBox is configured — checks DB first, then env var. */
export async function archiveBoxEnabledAsync(): Promise<boolean> {
  return Boolean(await getActiveArchiveBoxEndpoint());
}

/** The active ArchiveBox base URL — DB first, then env var. Null when neither is set. */
export async function archiveBoxBaseUrl(): Promise<string | null> {
  return getActiveArchiveBoxEndpoint();
}
