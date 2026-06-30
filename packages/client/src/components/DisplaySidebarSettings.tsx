import type { ReactNode } from "react";

import { Fragment } from "react";

import { PinnedItemsCard } from "./PinnedItemsCard";
import { SidebarCategoryVisibilityList } from "./SidebarCategoryVisibilityList";
import { SidebarExternalLinksSettings } from "./SidebarExternalLinksSettings";
import { SidebarItemsCard, SidebarItemsMatrix } from "./SidebarItemsCard";
import { useSidebarSettings } from "../hooks/useSidebarSettings";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

/** A titled sub-section inside the consolidated Sidebar settings card. */
function SidebarSettingsSection({
  title, description, children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h4 className="font-medium">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

const TAXONOMY_ITEMS = [
  {
    key: "tags",
    label: "Tags",
  },
  {
    key: "websites",
    label: "Websites",
  },
  {
    key: "media-types",
    label: "Media Types",
  },
  {
    key: "youtube-channels",
    label: "YouTube Channels",
  },
  {
    key: "authors",
    label: "Authors",
  },
  {
    key: "publishers",
    label: "Publishers",
  },
] as const;

const CUSTOMIZATION_ITEMS = [
  {
    key: "custom-properties",
    label: "Custom Properties",
  },
  {
    key: "property-groups",
    label: "Property Groups",
  },
  {
    key: "relationship-types",
    label: "Relationship Types",
  },
  {
    key: "autofill",
    label: "Autofill Rules",
  },
  {
    key: "card-display-rules",
    label: "Card Display Rules",
  },
  {
    key: "import-rules",
    label: "Import Rules",
  },
] as const;

const MANAGEMENT_ITEMS = [
  {
    key: "categories",
    label: "Categories",
  },
  {
    key: "tags",
    label: "Tags",
  },
] as const;

const SIDEBAR_GROUPS = [
  {
    key: "categories",
    label: "Categories",
  },
  {
    key: "taxonomies",
    label: "Taxonomies",
  },
  {
    key: "customization",
    label: "Customization",
  },
  {
    key: "management",
    label: "Management",
  },
  {
    key: "action",
    label: "Action",
  },
] as const;

/** Sidebar visibility — which groups/items appear in the left sidebar, plus the opt-in links. */
export function DisplaySidebarSettings() {
  const {
    sidebar,
    setCategoryMode,
    setTaxonomyItemMode,
    setCustomizationItemMode,
    setManagementItemMode,
    toggleSidebarGroup,
  } = useSidebarSettings();

  const {
    hiddenCategoryIds,
    seeMoreCategoryIds,
    hiddenTaxonomyItems,
    seeMoreTaxonomyItems,
    hiddenCustomizationItems,
    seeMoreCustomizationItems,
    hiddenManagementItems,
    hiddenSidebarGroups,
  } = sidebar;

  // The Categories / Taxonomies / Customization sections share one card, divided by separators.
  // Only the groups that aren't hidden contribute a section.
  const groupedSections: ReactNode[] = [];
  if (!hiddenSidebarGroups.includes("categories")) {
    groupedSections.push(
      <SidebarSettingsSection
        title="Categories"
        description="Choose how each category appears in the left sidebar."
      >
        <SidebarCategoryVisibilityList
          onSetMode={setCategoryMode}
          hiddenCategoryIds={hiddenCategoryIds}
          seeMoreCategoryIds={seeMoreCategoryIds}
        />
      </SidebarSettingsSection>,
    );
  }
  if (!hiddenSidebarGroups.includes("taxonomies")) {
    groupedSections.push(
      <SidebarSettingsSection
        title="Taxonomies"
        description="Choose how each taxonomy browser appears in the left sidebar."
      >
        <SidebarItemsMatrix
          items={TAXONOMY_ITEMS}
          hiddenItems={hiddenTaxonomyItems}
          seeMoreItems={seeMoreTaxonomyItems}
          onSetMode={setTaxonomyItemMode}
        />
      </SidebarSettingsSection>,
    );
  }
  if (!hiddenSidebarGroups.includes("customization")) {
    groupedSections.push(
      <SidebarSettingsSection
        title="Customization"
        description="Choose how each customization tool appears in the left sidebar."
      >
        <SidebarItemsMatrix
          items={CUSTOMIZATION_ITEMS}
          hiddenItems={hiddenCustomizationItems}
          seeMoreItems={seeMoreCustomizationItems}
          onSetMode={setCustomizationItemMode}
        />
      </SidebarSettingsSection>,
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Sidebar</h3>
          <p className="text-sm text-muted-foreground">
            Choose which groups and items appear in the left sidebar.
          </p>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {SIDEBAR_GROUPS.map(group => (
            <div
              key={group.key}
              className="flex items-center gap-2"
            >
              <Checkbox
                id={`group-${group.key}`}
                checked={!hiddenSidebarGroups.includes(group.key)}
                onCheckedChange={() => toggleSidebarGroup(group.key)}
              />
              <Label htmlFor={`group-${group.key}`}>{group.label}</Label>
            </div>
          ))}
        </div>

        <PinnedItemsCard />

        {groupedSections.length > 0 && (
          <Card>
            <CardContent className="space-y-6 pt-6">
              {groupedSections.map((section, index) => (
                <Fragment key={index}>
                  {index > 0 && <Separator />}
                  {section}
                </Fragment>
              ))}
            </CardContent>
          </Card>
        )}

        {!hiddenSidebarGroups.includes("management") && (
          <SidebarItemsCard
            title="Management"
            description="Choose which management pages appear in the left sidebar."
            items={MANAGEMENT_ITEMS}
            hiddenItems={hiddenManagementItems}
            onSetMode={(key, mode) => setManagementItemMode(key, mode === "hidden" ? "hidden" : "visible")}
          />
        )}
      </div>

      <SidebarExternalLinksSettings />
    </div>
  );
}
