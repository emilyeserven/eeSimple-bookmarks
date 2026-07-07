import type { MapAncestryDebug } from "@/lib/locationMapDebug";
import type { LocationNode } from "@eesimple/types";

import { useState } from "react";

import { useTranslation } from "react-i18next";

import { EntityNamesTabView, PrimaryLanguageDlRow } from "../entityNames/EntityNamesTab";
import { LocalizedNameLabel } from "../LocalizedNameLabel";
import { LocationMapSection } from "../LocationMapSection";

import { useLocationTree } from "@/hooks/useLocations";
import { findAncestorPath, flattenTree } from "@/lib/tagTree";

export { LocationHierarchyView } from "./locationHierarchyView";

export function LocationGeneralView({
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
  const [onlyDirectRelatives, setOnlyDirectRelatives] = useState(false);
  const parent = node.parentId
    ? flattenTree(data ?? []).find(item => item.node.id === node.parentId)?.node
    : null;
  const coordinates = node.latitude != null && node.longitude != null
    ? `${node.latitude}, ${node.longitude}`
    : t("—");

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
    <div className="space-y-6">
      <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">{t("Parent")}</dt>
        <dd>{parent
          ? (
            <LocalizedNameLabel
              names={parent.names ?? []}
              base={parent.name}
            />
          )
          : t("(root)")}
        </dd>
        <dt className="text-muted-foreground">{t("Children")}</dt>
        <dd>{node.children.length}</dd>
        <dt className="text-muted-foreground">{t("Slug")}</dt>
        <dd className="font-mono">{node.slug}</dd>
        {node.description
          ? (
            <>
              <dt className="text-muted-foreground">{t("Description")}</dt>
              <dd>{node.description}</dd>
            </>
          )
          : null}
        <PrimaryLanguageDlRow
          ownerType="location"
          ownerId={node.id}
        />
        <dt className="text-muted-foreground">{t("Names")}</dt>
        <dd>
          <EntityNamesTabView
            ownerType="location"
            ownerId={node.id}
          />
        </dd>
        <dt className="text-muted-foreground">{t("Coordinates")}</dt>
        <dd>{coordinates}</dd>
        {node.placeType
          ? (
            <>
              <dt className="text-muted-foreground">{t("Place type")}</dt>
              <dd>{node.placeType}</dd>
            </>
          )
          : null}
        {node.countryCode
          ? (
            <>
              <dt className="text-muted-foreground">{t("Country")}</dt>
              <dd>{node.countryCode}</dd>
            </>
          )
          : null}
        {node.mapUrl
          ? (
            <>
              <dt className="text-muted-foreground">{t("Map")}</dt>
              <dd>
                <a
                  href={node.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  {t("Open map")}
                </a>
              </dd>
            </>
          )
          : null}
        {node.officialLink
          ? (
            <>
              <dt className="text-muted-foreground">{t("Official link")}</dt>
              <dd>
                <a
                  href={node.officialLink}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  {node.officialLink}
                </a>
              </dd>
            </>
          )
          : null}
        {node.wikipediaLinkEn
          ? (
            <>
              <dt className="text-muted-foreground">{t("Wikipedia (EN)")}</dt>
              <dd>
                <a
                  href={node.wikipediaLinkEn}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  {node.wikipediaLinkEn}
                </a>
              </dd>
            </>
          )
          : null}
        {node.wikipediaLinkLocal
          ? (
            <>
              <dt className="text-muted-foreground">{t("Wikipedia (Local)")}</dt>
              <dd>
                <a
                  href={node.wikipediaLinkLocal}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  {node.wikipediaLinkLocal}
                </a>
              </dd>
            </>
          )
          : null}
        <dt className="text-muted-foreground">{t("Bookmarks")}</dt>
        <dd>{node.bookmarkCount ?? 0}</dd>
        <dt className="text-muted-foreground">{t("Created")}</dt>
        <dd>{new Date(node.createdAt).toLocaleDateString()}</dd>
      </dl>
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
    </div>
  );
}
