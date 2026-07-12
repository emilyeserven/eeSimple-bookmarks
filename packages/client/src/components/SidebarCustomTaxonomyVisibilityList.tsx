import { GENRES_MOODS_TAXONOMY_SLUG } from "@eesimple/types";
import { useTranslation } from "react-i18next";

import { useTaxonomies, useUpdateTaxonomy } from "../hooks/useTaxonomies";
import { notifyError, notifySuccess } from "../lib/notifications";

import { SegmentedToggleRow } from "@/components/SegmentedToggleRow";
import { CategoryIcon } from "@/lib/icons";

type CustomTaxonomyDisplayMode = "visible" | "hidden";

/**
 * The per-custom-taxonomy visibility rows shown inside the Taxonomies sub-section of
 * `DisplaySidebarSettings`, alongside the static built-in `SidebarItemsMatrix`. Unlike categories
 * (which are toggled via the sidebar-customization `hiddenTaxonomyItems`/`seeMoreTaxonomyItems`
 * arrays), a custom taxonomy already has its own `showInSidebar` field — edited here mirrors the same
 * field Settings → Taxonomies edits, so the two pages always agree.
 */
export function SidebarCustomTaxonomyVisibilityList() {
  const {
    t,
  } = useTranslation();
  const {
    data: taxonomies,
  } = useTaxonomies();
  const update = useUpdateTaxonomy();

  const custom = (taxonomies ?? []).filter(
    taxonomy => !taxonomy.hidden && taxonomy.slug !== GENRES_MOODS_TAXONOMY_SLUG,
  );

  if (custom.length === 0) return null;

  const modeOptions: { value: CustomTaxonomyDisplayMode;
    label: string; }[] = [
    {
      value: "visible",
      label: t("Default"),
    },
    {
      value: "hidden",
      label: t("Listing only"),
    },
  ];

  const setMode = (taxonomyId: string, mode: CustomTaxonomyDisplayMode) => {
    update.mutate({
      id: taxonomyId,
      input: {
        showInSidebar: mode === "visible",
      },
    }, {
      onSuccess: () => notifySuccess(t("Sidebar")),
      onError: (err: Error) => notifyError(err.message),
    });
  };

  return (
    <div className="space-y-2 border-t pt-3">
      <p className="text-xs font-medium text-muted-foreground">{t("Custom taxonomies")}</p>
      {custom.map((taxonomy) => {
        const mode: CustomTaxonomyDisplayMode = taxonomy.showInSidebar ? "visible" : "hidden";
        return (
          <SegmentedToggleRow
            key={taxonomy.id}
            label={taxonomy.name}
            icon={(
              <CategoryIcon
                name={taxonomy.icon}
                className="size-3.5 shrink-0 text-muted-foreground"
              />
            )}
            options={modeOptions}
            value={mode}
            onChange={next => setMode(taxonomy.id, next)}
          />
        );
      })}
    </div>
  );
}
