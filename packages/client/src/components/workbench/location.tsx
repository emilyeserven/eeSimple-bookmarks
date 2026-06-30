/* eslint-disable react-refresh/only-export-components -- this module exports an entity descriptor that pairs tab bodies with metadata, not a component */
import type { EntityWorkbench } from "./types";
import type { LocationNode } from "@eesimple/types";

import { Link } from "@tanstack/react-router";

import { AutofillRulesList } from "../AutofillRulesList";
import { CardDisplayRulesList } from "../CardDisplayRulesList";
import { HierarchyView } from "../HierarchyView";
import { LocationGeneralForm } from "../LocationGeneralForm";
import { LocationMapSection } from "../LocationMapSection";
import { LocationTreeList } from "../LocationTreeList";
import { RomanizedLabel } from "../RomanizedLabel";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  useDisplayPreferenceSettings,
  useShowLocationAncestorsOnMap,
  useUpdateDisplayPreferenceSettings,
} from "@/hooks/useAppSettings";
import { useExpandedSet } from "@/hooks/useExpandedSet";
import { useDeleteLocation, useLocationById, useLocationBySlug, useLocationTree } from "@/hooks/useLocations";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { findAncestorPath, flattenTree } from "@/lib/tagTree";

function LocationGeneralView({
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
        />
      </div>
    </div>
  );
}

function LocationHierarchyView({
  entity: node,
}: {
  entity: LocationNode;
}) {
  const {
    data,
  } = useLocationTree();
  const {
    expanded, onToggle,
  } = useExpandedSet(node.children.map(c => c.id));
  const path = findAncestorPath(data ?? [], node.slug);
  const ancestors = path ? path.slice(0, -1) : [];
  return (
    <HierarchyView
      ancestors={ancestors}
      renderAncestorLink={ancestor => (
        <Link
          to="/taxonomies/locations/$locationSlug/general"
          params={{
            locationSlug: ancestor.slug,
          }}
          className="hover:underline"
        >
          <RomanizedLabel
            name={ancestor.name}
            romanized={ancestor.romanizedName}
          />
        </Link>
      )}
      hasChildren={node.children.length > 0}
      childrenEmptyLabel="No child locations."
      childrenList={(
        <LocationTreeList
          tree={node.children}
          expanded={expanded}
          onToggle={onToggle}
          columns={1}
        />
      )}
    />
  );
}

/** Single source of truth for a location's tabbed view/edit UI (main pane routes + right panel). */
export const locationWorkbench: EntityWorkbench<LocationNode> = {
  useBySlug: (slug) => {
    const {
      location, isLoading,
    } = useLocationBySlug(slug);
    return {
      entity: location,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      location, isLoading, error,
    } = useLocationById(id);
    return {
      entity: location,
      isLoading,
      error,
    };
  },
  name: node => node.name,
  isBuiltIn: () => false,
  canDelete: () => true,
  useDelete: () => {
    const mutation = useDeleteLocation();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: "Location not found.",
  navAriaLabel: "Location sections",
  getSlug: location => location.slug,
  tabs: [
    {
      key: "general",
      label: "General",
      view: {
        title: "General",
        description: "Name, coordinates, and location details.",
        render: LocationGeneralView,
      },
      edit: {
        title: "General",
        description: "Name, coordinates, parent, alternate names, and tags.",
        render: ({
          entity,
        }) => <LocationGeneralForm node={entity} />,
      },
    },
    {
      key: "hierarchy",
      label: "Hierarchy",
      view: {
        title: "Hierarchy",
        description: "Parent and child locations.",
        render: LocationHierarchyView,
      },
    },
    {
      key: "autofill",
      label: "Autofill Rules",
      view: {
        title: "Autofill Rules",
        description: "Autofill rules that apply this location.",
        render: ({
          entity,
        }) => (
          <AutofillRulesList
            locationId={entity.id}
            query=""
          />
        ),
      },
      edit: {
        title: "Autofill Rules",
        description: "Autofill rules that apply this location.",
        render: ({
          entity,
        }) => (
          <AutofillRulesList
            locationId={entity.id}
            query=""
          />
        ),
      },
    },
    {
      key: "display-rules",
      label: "Display Rules",
      view: {
        title: "Display Rules",
        description: "Card display rules whose conditions reference this location.",
        render: ({
          entity,
        }) => <CardDisplayRulesList locationId={entity.id} />,
      },
      edit: {
        title: "Display Rules",
        description: "Card display rules whose conditions reference this location.",
        render: ({
          entity,
        }) => <CardDisplayRulesList locationId={entity.id} />,
      },
    },
  ],
};
