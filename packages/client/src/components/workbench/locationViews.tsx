import type { MapAncestryDebug } from "@/lib/locationMapDebug";
import type { LocationNode } from "@eesimple/types";

import { useState } from "react";

import { useTranslation } from "react-i18next";

import { EntityNamesTabView, PrimaryLanguageTabView } from "../entityNames/EntityNamesTab";
import { LocalizedNameLabel } from "../LocalizedNameLabel";
import { LocationMapSection } from "../LocationMapSection";

import { DetailField } from "@/components/DetailField";
import { useLocationTree } from "@/hooks/useLocations";
import { findAncestorPath, flattenTree } from "@/lib/tagTree";

export { LocationHierarchyView } from "./locationHierarchyView";

/**
 * The read-only location **view** field components for the field registry (`workbench/location.tsx`,
 * #1191 field extraction). Each is a self-contained component (one field key) that loads its own data
 * via cached react-query hooks — `LayoutDrivenTabBody` invokes a field's `view` renderer as a plain
 * call, so any hook must live inside a mounted component. Scalar rows use the shared self-hiding
 * `DetailField`; `LocationMapView` carries the Leaflet map (its own view-only field), extracted with
 * the ancestry/`onlyDirectRelatives` logic — its `LocationMapSection` props are preserved exactly per
 * the `locations-map` skill.
 */

/** Parent link row (root when unparented). */
export function LocationParentView({
  entity: node,
}: {
  entity: LocationNode;
}) {
  const {
    t,
  } = useTranslation();
  const {
    data,
  } = useLocationTree();
  const parent = node.parentId
    ? flattenTree(data ?? []).find(item => item.node.id === node.parentId)?.node
    : null;
  return (
    <DetailField label={t("Parent")}>
      {parent
        ? (
          <LocalizedNameLabel
            names={parent.names ?? []}
            base={parent.name}
          />
        )
        : t("(root)")}
    </DetailField>
  );
}

/** Direct-children count row. */
export function LocationChildrenCountView({
  entity: node,
}: {
  entity: LocationNode;
}) {
  const {
    t,
  } = useTranslation();
  return <DetailField label={t("Children")}>{node.children.length}</DetailField>;
}

/** Slug row. */
export function LocationSlugView({
  entity: node,
}: {
  entity: LocationNode;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <DetailField label={t("Slug")}>
      <span className="font-mono">{node.slug}</span>
    </DetailField>
  );
}

/** Description row (self-hiding when empty). */
export function LocationDescriptionView({
  entity: node,
}: {
  entity: LocationNode;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <DetailField label={t("Description")}>
      {node.description ? node.description : null}
    </DetailField>
  );
}

/** Primary language block (self-labelled standalone view). */
export function LocationPrimaryLanguageView({
  entity: node,
}: {
  entity: LocationNode;
}) {
  return (
    <PrimaryLanguageTabView
      ownerType="location"
      ownerId={node.id}
    />
  );
}

/** Additional multilingual names (read-only chips). */
export function LocationNamesView({
  entity: node,
}: {
  entity: LocationNode;
}) {
  return (
    <EntityNamesTabView
      ownerType="location"
      ownerId={node.id}
    />
  );
}

/** Coordinates row (always shown; "—" when unset). */
export function LocationCoordinatesView({
  entity: node,
}: {
  entity: LocationNode;
}) {
  const {
    t,
  } = useTranslation();
  const coordinates = node.latitude != null && node.longitude != null
    ? `${node.latitude}, ${node.longitude}`
    : t("—");
  return <DetailField label={t("Coordinates")}>{coordinates}</DetailField>;
}

/** Map link row (self-hiding when no map URL). */
export function LocationMapUrlView({
  entity: node,
}: {
  entity: LocationNode;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <DetailField label={t("Map")}>
      {node.mapUrl
        ? (
          <a
            href={node.mapUrl}
            target="_blank"
            rel="noreferrer"
            className="hover:underline"
          >
            {t("Open map")}
          </a>
        )
        : null}
    </DetailField>
  );
}

/** Place-type row (self-hiding when unset). */
export function LocationPlaceTypeView({
  entity: node,
}: {
  entity: LocationNode;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <DetailField label={t("Place type")}>
      {node.placeType ? node.placeType : null}
    </DetailField>
  );
}

/** Country row (self-hiding when unset). */
export function LocationCountryView({
  entity: node,
}: {
  entity: LocationNode;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <DetailField label={t("Country")}>
      {node.countryCode ? node.countryCode : null}
    </DetailField>
  );
}

/** Official-link row (self-hiding when unset). */
export function LocationOfficialLinkView({
  entity: node,
}: {
  entity: LocationNode;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <DetailField label={t("Official link")}>
      {node.officialLink
        ? (
          <a
            href={node.officialLink}
            target="_blank"
            rel="noreferrer"
            className="hover:underline"
          >
            {node.officialLink}
          </a>
        )
        : null}
    </DetailField>
  );
}

/** Wikipedia (EN) + (Local) rows — one field, each row self-hiding when unset. */
export function LocationWikipediaLinksView({
  entity: node,
}: {
  entity: LocationNode;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <>
      <DetailField label={t("Wikipedia (EN)")}>
        {node.wikipediaLinkEn
          ? (
            <a
              href={node.wikipediaLinkEn}
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              {node.wikipediaLinkEn}
            </a>
          )
          : null}
      </DetailField>
      <DetailField label={t("Wikipedia (Local)")}>
        {node.wikipediaLinkLocal
          ? (
            <a
              href={node.wikipediaLinkLocal}
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              {node.wikipediaLinkLocal}
            </a>
          )
          : null}
      </DetailField>
    </>
  );
}

/** Bookmark-count row. */
export function LocationBookmarkCountView({
  entity: node,
}: {
  entity: LocationNode;
}) {
  const {
    t,
  } = useTranslation();
  return <DetailField label={t("Bookmarks")}>{node.bookmarkCount ?? 0}</DetailField>;
}

/** Created-at row. */
export function LocationCreatedView({
  entity: node,
}: {
  entity: LocationNode;
}) {
  const {
    t,
  } = useTranslation();
  return <DetailField label={t("Created")}>{new Date(node.createdAt).toLocaleDateString()}</DetailField>;
}

/**
 * The location map — its own view-only field (#1191). Extracted verbatim from the former
 * `LocationGeneralView`: the ancestor chain (root → parent, children stripped so only the ancestors
 * plot), the "only direct relatives" toggle, and the map's ancestry Debug diagnostic. Every
 * `LocationMapSection` prop (`mapKey`, `scope`, `ancestorChildrenScope`, `ancestryDebug`) is preserved
 * exactly — see the `locations-map` skill before touching this.
 */
export function LocationMapView({
  entity: node,
}: {
  entity: LocationNode;
}) {
  const {
    data,
  } = useLocationTree();
  const [onlyDirectRelatives, setOnlyDirectRelatives] = useState(false);

  // Ancestor chain (root → parent), stripped of children so only the ancestors themselves plot —
  // otherwise `collectMapped` would re-plot the whole tree under a root ancestor. "Only direct"
  // narrows this to just the immediate parent, and narrows the plotted children to just the
  // immediate ones (grandchildren's own subtrees stripped too).
  const path = findAncestorPath(data ?? [], node.slug);
  const fullAncestors = (path ? path.slice(0, -1) : []).map(ancestor => ({
    ...ancestor,
    children: [],
  }));
  const ancestors = onlyDirectRelatives ? fullAncestors.slice(-1) : fullAncestors;
  const nodeForMap = onlyDirectRelatives
    ? {
      ...node,
      children: node.children.map(child => ({
        ...child,
        children: [],
      })),
    }
    : node;
  // `collectMapped` already walks `nodeForMap.children` recursively, so appending them again here
  // would give every child (and its subtree) a second, colliding React key.
  const mapTree = [...ancestors, nodeForMap];

  // Diagnostic for the map's Debug modal: why the parent chain is (or isn't) plotted. Distinguishes
  // "root location, no ancestors exist" (parentId null) from "path didn't resolve" (foundInTree
  // false / empty chain) — see MapAncestryDebug.
  const ancestryDebug: MapAncestryDebug = {
    onlyDirectRelatives,
    treeLoaded: data !== undefined,
    treeNodeCount: flattenTree(data ?? []).length,
    nodeId: node.id,
    nodeSlug: node.slug,
    parentId: node.parentId ?? null,
    foundInTree: path !== null,
    ancestors: fullAncestors.map(ancestor => ({
      id: ancestor.id,
      name: ancestor.name,
      slug: ancestor.slug,
      placeType: ancestor.placeType,
    })),
  };

  return (
    <LocationMapSection
      mapKey={node.id}
      tree={mapTree}
      autoRefreshLocationId={node.id}
      mapClassName="h-80 w-full rounded-lg border"
      showLevels
      scope={{
        kind: "location",
        currentPlaceType: node.placeType,
      }}
      ancestorChildrenScope={{
        onlyDirect: onlyDirectRelatives,
        onToggle: setOnlyDirectRelatives,
      }}
      ancestryDebug={ancestryDebug}
    />
  );
}

/**
 * The full read-only location General view, **recomposed** from the atomized view fields above (the
 * real Info page renders them individually through the layout registry). Kept so the
 * `locationViews.stories.tsx` story renders unchanged (the "recompose, not delete" rule).
 */
export function LocationGeneralView({
  entity,
}: {
  entity: LocationNode;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <LocationParentView entity={entity} />
        <LocationChildrenCountView entity={entity} />
        <LocationSlugView entity={entity} />
        <LocationDescriptionView entity={entity} />
        <LocationPrimaryLanguageView entity={entity} />
        <LocationNamesView entity={entity} />
        <LocationCoordinatesView entity={entity} />
        <LocationPlaceTypeView entity={entity} />
        <LocationCountryView entity={entity} />
        <LocationMapUrlView entity={entity} />
        <LocationOfficialLinkView entity={entity} />
        <LocationWikipediaLinksView entity={entity} />
        <LocationBookmarkCountView entity={entity} />
        <LocationCreatedView entity={entity} />
      </div>
      <LocationMapView entity={entity} />
    </div>
  );
}
