import type { FilterConfigRow, FilterMode } from "./SortableFilterRow";
import type { DragEndEvent } from "@dnd-kit/core";
import type { DisplayPreferenceSettings } from "@eesimple/types";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useTranslation } from "react-i18next";

import { DisplayFiltersPreview } from "./DisplayFiltersPreview";
import { SortableFilterRow } from "./SortableFilterRow";
import {
  useDisplayPreferenceSettings,
  useUpdateDisplayPreferenceSettings,
} from "../hooks/useAppSettings";
import { useCustomProperties } from "../hooks/useCustomProperties";
import {
  applyFilterOrder,
  FILTER_FACETS,
  facetVisibilityHint,
  propertyVisibilityHint,
} from "../lib/filterFacets";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

/**
 * Display → Filters: a live preview of the filter rail above a single drag-sortable list of every
 * configurable filter (standard facets + enabled custom properties). Each row toggles between shown
 * by default and added on demand, and can be hidden by default on mobile. Order, on-demand set, and
 * mobile-hidden set are all persisted server-side in the display-preferences group.
 */
export function DisplayFiltersSettings() {
  const {
    t,
  } = useTranslation();
  const {
    data: prefs,
  } = useDisplayPreferenceSettings();
  const update = useUpdateDisplayPreferenceSettings();
  const {
    data: properties,
  } = useCustomProperties();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const onDemand = prefs?.onDemandFilters ?? [];
  const filterOrder = prefs?.filterOrder ?? [];
  const mobileHidden = prefs?.mobileHiddenFilters ?? [];

  const facetRows: FilterConfigRow[] = FILTER_FACETS.map(facet => ({
    key: facet.key,
    label: facet.label,
    hint: facetVisibilityHint(facet.key, t),
  }));
  const propertyRows: FilterConfigRow[] = (properties ?? [])
    .filter(property => property.enabled)
    .map(property => ({
      key: property.id,
      label: property.name,
      hint: propertyVisibilityHint(t),
    }));
  const rows = applyFilterOrder([...facetRows, ...propertyRows], filterOrder);
  const rowKeys = rows.map(row => row.key);

  /** Persist a patch onto the whole display-preferences object with the standard toast. */
  function setPrefs(patch: Partial<DisplayPreferenceSettings>): void {
    if (!prefs) return;
    update.mutate({
      input: {
        ...prefs,
        ...patch,
      },
      successMessage: t("Filters updated"),
    });
  }

  function setFilterMode(key: string, mode: FilterMode): void {
    setPrefs({
      onDemandFilters: mode === "on-demand"
        ? [...onDemand.filter(x => x !== key), key]
        : onDemand.filter(x => x !== key),
    });
  }

  function setMobileHidden(key: string, hidden: boolean): void {
    setPrefs({
      mobileHiddenFilters: hidden
        ? [...mobileHidden.filter(x => x !== key), key]
        : mobileHidden.filter(x => x !== key),
    });
  }

  function handleDragEnd(event: DragEndEvent): void {
    const {
      active, over,
    } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = rowKeys.indexOf(active.id as string);
    const newIndex = rowKeys.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    setPrefs({
      filterOrder: arrayMove(rowKeys, oldIndex, newIndex),
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{t("Filters")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("Drag to reorder filters. Choose which show by default versus added on demand from the “Add filter” control, and hide any by default on mobile.")}
        </p>
      </div>

      <DisplayFiltersPreview />

      <Card>
        <CardContent className="pt-6">
          {rows.length > 0
            ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={rowKeys}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {rows.map(row => (
                      <SortableFilterRow
                        key={row.key}
                        row={row}
                        onDemand={onDemand.includes(row.key)}
                        onSetMode={setFilterMode}
                        mobileHidden={mobileHidden.includes(row.key)}
                        onToggleMobile={setMobileHidden}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )
            : (
              <p className="text-sm text-muted-foreground">{t("None available yet.")}</p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
