import { useTranslation } from "react-i18next";

import {
  useDisplayPreferenceSettings,
  useUpdateDisplayPreferenceSettings,
} from "../hooks/useAppSettings";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { FILTER_FACETS } from "../lib/filterFacets";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type FilterMode = "default" | "on-demand";

interface FilterRow {
  key: string;
  label: string;
}

/** A titled list of filter rows, each toggled between shown-by-default and added-on-demand. */
function FilterRows({
  title, description, rows, onDemand, onSetMode,
}: {
  title: string;
  description: string;
  rows: readonly FilterRow[];
  onDemand: string[];
  onSetMode: (key: string, mode: FilterMode) => void;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <section className="space-y-3">
      <div>
        <h4 className="font-medium">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {rows.length > 0
        ? (
          <div className="space-y-2">
            {rows.map(row => (
              <div
                key={row.key}
                className="flex items-center justify-between gap-2"
              >
                <span className="truncate text-sm">{row.label}</span>
                <ToggleGroup
                  type="single"
                  size="sm"
                  value={onDemand.includes(row.key) ? "on-demand" : "default"}
                  onValueChange={value => value && onSetMode(row.key, value as FilterMode)}
                >
                  <ToggleGroupItem value="default">{t("Default")}</ToggleGroupItem>
                  <ToggleGroupItem value="on-demand">{t("On demand")}</ToggleGroupItem>
                </ToggleGroup>
              </div>
            ))}
          </div>
        )
        : (
          <p className="text-sm text-muted-foreground">{t("None available yet.")}</p>
        )}
    </section>
  );
}

/**
 * Display → Filters: choose which filter facets and custom properties appear in the filter rail by
 * default, versus being added on demand from the rail's "Add filter" control. Persisted server-side
 * via the display-preferences `onDemandFilters` list.
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

  const onDemand = prefs?.onDemandFilters ?? [];
  const propertyRows: FilterRow[] = (properties ?? [])
    .filter(property => property.enabled)
    .map(property => ({
      key: property.id,
      label: property.name,
    }));

  /** Add/remove a filter key from the on-demand list and persist the whole display-preferences object. */
  function setFilterMode(key: string, mode: FilterMode): void {
    if (!prefs) return;
    const next = mode === "on-demand"
      ? [...onDemand.filter(x => x !== key), key]
      : onDemand.filter(x => x !== key);
    update.mutate({
      input: {
        ...prefs,
        onDemandFilters: next,
      },
      successMessage: t("Filters updated"),
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{t("Filters")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("Choose which filters show by default in the filter sidebar. Filters set to “On demand” are hidden until you add them from the “Add filter” control.")}
        </p>
      </div>

      <Card>
        <CardContent className="space-y-6 pt-6">
          <FilterRows
            title={t("Standard filters")}
            description={t("Built-in facets such as tags, category, and media type.")}
            rows={FILTER_FACETS}
            onDemand={onDemand}
            onSetMode={setFilterMode}
          />
          <Separator />
          <FilterRows
            title={t("Custom properties")}
            description={t("Each enabled custom property can be shown by default or added on demand.")}
            rows={propertyRows}
            onDemand={onDemand}
            onSetMode={setFilterMode}
          />
        </CardContent>
      </Card>
    </div>
  );
}
