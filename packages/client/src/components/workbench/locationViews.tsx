import type { LocationNode } from "@eesimple/types";

import { LocationMapSection } from "../LocationMapSection";
import { RomanizedLabel } from "../RomanizedLabel";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  useDisplayPreferenceSettings,
  useShowLocationAncestorsOnMap,
  useUpdateDisplayPreferenceSettings,
} from "@/hooks/useAppSettings";
import { useLocationTree } from "@/hooks/useLocations";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { findAncestorPath, flattenTree } from "@/lib/tagTree";

export { LocationGalleryView } from "./locationGalleryView";
export { LocationHierarchyView } from "./locationHierarchyView";

export function LocationGeneralView({
  entity: node,
}: {
  entity: LocationNode;
}) {
  const {
    data,
  } = useLocationTree();
  const showAncestors = useShowLocationAncestorsOnMap();
  const {
    data: displayPrefs,
  } = useDisplayPreferenceSettings();
  const updatePrefs = useUpdateDisplayPreferenceSettings();
  const parent = node.parentId
    ? flattenTree(data ?? []).find(item => item.node.id === node.parentId)?.node
    : null;
  const coordinates = node.latitude != null && node.longitude != null
    ? `${node.latitude}, ${node.longitude}`
    : "—";

  // Ancestor chain (root → parent), stripped of children so only the ancestors themselves plot —
  // otherwise `collectMapped` would re-plot the whole tree under a root ancestor.
  const path = findAncestorPath(data ?? [], node.slug);
  const ancestors = (path ? path.slice(0, -1) : []).map(ancestor => ({
    ...ancestor,
    children: [],
  }));
  const mapTree = showAncestors
    ? [...ancestors, node, ...node.children]
    : [node, ...node.children];

  function toggleAncestors(next: boolean): void {
    if (!displayPrefs) return;
    updatePrefs.mutate({
      ...displayPrefs,
      showLocationAncestorsOnMap: next,
    }, {
      onSuccess: () => notifySuccess(next ? "Showing ancestors on map" : "Hiding ancestors on map"),
      onError: error => notifyError(error.message),
    });
  }

  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Parent</dt>
        <dd>{parent
          ? (
            <RomanizedLabel
              name={parent.name}
              romanized={parent.romanizedName}
            />
          )
          : "(root)"}
        </dd>
        <dt className="text-muted-foreground">Children</dt>
        <dd>{node.children.length}</dd>
        <dt className="text-muted-foreground">Slug</dt>
        <dd className="font-mono">{node.slug}</dd>
        <dt className="text-muted-foreground">Coordinates</dt>
        <dd>{coordinates}</dd>
        {node.placeType
          ? (
            <>
              <dt className="text-muted-foreground">Place type</dt>
              <dd>{node.placeType}</dd>
            </>
          )
          : null}
        {node.countryCode
          ? (
            <>
              <dt className="text-muted-foreground">Country</dt>
              <dd>{node.countryCode}</dd>
            </>
          )
          : null}
        {node.mapUrl
          ? (
            <>
              <dt className="text-muted-foreground">Map</dt>
              <dd>
                <a
                  href={node.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  Open map
                </a>
              </dd>
            </>
          )
          : null}
        {node.officialLink
          ? (
            <>
              <dt className="text-muted-foreground">Official link</dt>
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
              <dt className="text-muted-foreground">Wikipedia (EN)</dt>
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
              <dt className="text-muted-foreground">Wikipedia (Local)</dt>
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
        <dt className="text-muted-foreground">Bookmarks</dt>
        <dd>{node.bookmarkCount ?? 0}</dd>
        <dt className="text-muted-foreground">Created</dt>
        <dd>{new Date(node.createdAt).toLocaleDateString()}</dd>
      </dl>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Checkbox
            id="loc-show-ancestors"
            checked={showAncestors}
            onCheckedChange={checked => toggleAncestors(checked === true)}
          />
          <Label
            htmlFor="loc-show-ancestors"
            className="cursor-pointer"
          >
            Show ancestors on map
          </Label>
        </div>
        <LocationMapSection
          mapKey={node.id}
          tree={mapTree}
          autoRefreshLocationId={node.id}
          mapClassName="h-80 w-full rounded-lg border"
          scope={{
            kind: "location",
            currentPlaceType: node.placeType,
          }}
        />
      </div>
    </div>
  );
}
