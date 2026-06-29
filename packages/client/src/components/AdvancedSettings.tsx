import { DatabaseUsageCard } from "./DatabaseUsageCard";
import { OrphanCleanupCard } from "./OrphanCleanupCard";
import { PwaUpdateCard } from "./PwaUpdateCard";

/**
 * Advanced preferences — PWA update checking, orphaned-record cleanup, and a read-only summary of
 * how much disk space the database is using. (The opt-in sidebar links — Coolify, Docs, Storybook,
 * Drizzle Gateway, GitHub — moved to Settings → Display → Sidebar, see `SidebarExternalLinksSettings`.)
 */
export function AdvancedSettings() {
  return (
    <div className="space-y-6">
      <PwaUpdateCard />

      <OrphanCleanupCard />

      <DatabaseUsageCard />
    </div>
  );
}
