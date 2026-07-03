import type { PlexTitle } from "./PlexTitleGeneralForm";

import { useConnectors } from "@/hooks/useConnectors";
import { useMediaProperties } from "@/hooks/useMediaProperties";
import { plexItemUrl } from "@/lib/plex";

/** The linked Plex item, deep-linked into Plex's web UI when the connector is enabled. */
function PlexItemValue({
  title,
}: {
  title: PlexTitle;
}) {
  const {
    data: connectors,
  } = useConnectors();
  if (title.plexRatingKey === null) return (
    <span
      className="text-muted-foreground"
    >Not linked
    </span>
  );
  const plex = connectors?.plex;
  if (!plex?.enabled || !plex.baseUrl || !plex.machineIdentifier) {
    return <span>Linked</span>;
  }
  return (
    <a
      href={plexItemUrl(plex.baseUrl, plex.machineIdentifier, title.plexRatingKey)}
      target="_blank"
      rel="noreferrer"
      className="hover:underline"
    >
      View on Plex
    </a>
  );
}

/** Read-only General view for any Plex-backed taxonomy row — shared by all workbench descriptors. */
export function PlexTitleGeneralView({
  entity,
  createdAt,
  bookmarkCount,
  renderExtra,
}: {
  entity: PlexTitle;
  createdAt: string;
  bookmarkCount?: number;
  /** Extra read-only rows (parent link / artists) appended below the standard fields. */
  renderExtra?: import("react").ReactNode;
}) {
  const {
    data: mediaProperties,
  } = useMediaProperties();
  const mediaProperty = entity.mediaPropertyId
    ? (mediaProperties ?? []).find(prop => prop.id === entity.mediaPropertyId)
    : undefined;

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Added</dt>
        <dd>{new Date(createdAt).toLocaleDateString()}</dd>
        <dt className="text-muted-foreground">Slug</dt>
        <dd className="font-mono">{entity.slug}</dd>
        <dt className="text-muted-foreground">Media property</dt>
        <dd>{mediaProperty?.name ?? <span className="text-muted-foreground">None</span>}</dd>
        {entity.year != null
          ? (
            <>
              <dt className="text-muted-foreground">Year</dt>
              <dd>{entity.year}</dd>
            </>
          )
          : null}
        <dt className="text-muted-foreground">Plex item</dt>
        <dd>
          <PlexItemValue title={entity} />
        </dd>
        <dt className="text-muted-foreground">Sort order</dt>
        <dd>{entity.sortOrder}</dd>
        {bookmarkCount != null
          ? (
            <>
              <dt className="text-muted-foreground">Bookmarks</dt>
              <dd>{bookmarkCount}</dd>
            </>
          )
          : null}
        {renderExtra}
      </dl>
    </div>
  );
}
