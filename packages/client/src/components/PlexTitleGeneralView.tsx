import type { PlexTitle } from "./PlexTitleGeneralForm";
import type { EntityNameOwnerType } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { EntityNamesTabView } from "./entityNames/EntityNamesTab";

import { useConnectors } from "@/hooks/useConnectors";
import { useMediaProperties } from "@/hooks/useMediaProperties";
import { plexItemUrl } from "@/lib/plex";

/** The linked Plex item's name + id, deep-linked into Plex's web UI when the connector is enabled. */
function PlexItemValue({
  title,
}: {
  title: PlexTitle;
}) {
  const {
    t,
  } = useTranslation();
  const {
    data: connectors,
  } = useConnectors();
  if (title.plexRatingKey === null) return (
    <span
      className="text-muted-foreground"
    >{t("Not linked")}
    </span>
  );
  const label = `${title.plexItemTitle ?? t("Untitled")} (#${title.plexRatingKey})`;
  const plex = connectors?.plex;
  if (!plex?.enabled || !plex.baseUrl || !plex.machineIdentifier) {
    return <span>{label}</span>;
  }
  return (
    <a
      href={plexItemUrl(plex.baseUrl, plex.machineIdentifier, title.plexRatingKey)}
      target="_blank"
      rel="noreferrer"
      className="hover:underline"
    >
      {label}
    </a>
  );
}

/** Read-only General view for any Plex-backed taxonomy row — shared by all workbench descriptors. */
export function PlexTitleGeneralView({
  entity,
  ownerType,
  createdAt,
  bookmarkCount,
  renderExtra,
}: {
  entity: PlexTitle;
  /** Which `entity_names` owner type this row is, for the read-only multilingual names row. */
  ownerType: EntityNameOwnerType;
  createdAt: string;
  bookmarkCount?: number;
  /** Extra read-only rows (parent link / credits) appended below the standard fields. */
  renderExtra?: import("react").ReactNode;
}) {
  const {
    t,
  } = useTranslation();
  const {
    data: mediaProperties,
  } = useMediaProperties();
  const mediaProperty = entity.mediaPropertyId
    ? (mediaProperties ?? []).find(prop => prop.id === entity.mediaPropertyId)
    : undefined;

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">{t("Added")}</dt>
        <dd>{new Date(createdAt).toLocaleDateString()}</dd>
        <dt className="text-muted-foreground">{t("Slug")}</dt>
        <dd className="font-mono">{entity.slug}</dd>
        <dt className="text-muted-foreground">{t("Media property")}</dt>
        <dd>{mediaProperty?.name ?? <span className="text-muted-foreground">{t("None")}</span>}</dd>
        {entity.year != null
          ? (
            <>
              <dt className="text-muted-foreground">{t("Year")}</dt>
              <dd>{entity.year}</dd>
            </>
          )
          : null}
        <dt className="text-muted-foreground">{t("Plex item")}</dt>
        <dd>
          <PlexItemValue title={entity} />
        </dd>
        {entity.wikipediaLinkEn
          ? (
            <>
              <dt className="text-muted-foreground">{t("Wikipedia (English)")}</dt>
              <dd>
                <a
                  href={entity.wikipediaLinkEn}
                  target="_blank"
                  rel="noreferrer"
                  className="
                    break-all text-primary
                    hover:underline
                  "
                >
                  {entity.wikipediaLinkEn}
                </a>
              </dd>
            </>
          )
          : null}
        {entity.wikipediaLinkLocal
          ? (
            <>
              <dt className="text-muted-foreground">{t("Wikipedia (local)")}</dt>
              <dd>
                <a
                  href={entity.wikipediaLinkLocal}
                  target="_blank"
                  rel="noreferrer"
                  className="
                    break-all text-primary
                    hover:underline
                  "
                >
                  {entity.wikipediaLinkLocal}
                </a>
              </dd>
            </>
          )
          : null}
        <dt className="text-muted-foreground">{t("Names")}</dt>
        <dd>
          <EntityNamesTabView
            ownerType={ownerType}
            ownerId={entity.id}
          />
        </dd>
        <dt className="text-muted-foreground">{t("Sort order")}</dt>
        <dd>{entity.sortOrder}</dd>
        {bookmarkCount != null
          ? (
            <>
              <dt className="text-muted-foreground">{t("Bookmarks")}</dt>
              <dd>{bookmarkCount}</dd>
            </>
          )
          : null}
        {renderExtra}
      </dl>
    </div>
  );
}
