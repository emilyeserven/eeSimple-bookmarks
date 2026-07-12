import type { ReactNode } from "react";

import { Fragment } from "react";

import {
  Building2,
  Clapperboard,
  Drama,
  FileInput,
  FolderOpen,
  Globe,
  Languages,
  ListFilter,
  Mail,
  MapPin,
  MonitorPlay,
  Share2,
  SlidersHorizontal,
  Tags,
  UserRound,
  Wand2,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { PinnedItemsCard } from "./PinnedItemsCard";
import { SidebarCategoryVisibilityList } from "./SidebarCategoryVisibilityList";
import { SidebarConnectorLinksSettings } from "./SidebarConnectorLinksSettings";
import { SidebarCustomTaxonomyVisibilityList } from "./SidebarCustomTaxonomyVisibilityList";
import { SidebarExternalLinksSettings } from "./SidebarExternalLinksSettings";
import { SidebarItemsMatrix } from "./SidebarItemsCard";
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
    key: "categories",
    label: "Categories",
    icon: FolderOpen,
  },
  {
    key: "tags",
    label: "Tags",
    icon: Tags,
  },
  {
    key: "websites",
    label: "Websites",
    icon: Globe,
  },
  {
    key: "media-types",
    label: "Media Types",
    icon: Clapperboard,
  },
  {
    key: "genres-moods",
    label: "Genres & Moods",
    icon: Drama,
  },
  {
    key: "languages",
    label: "Languages",
    icon: Languages,
  },
  {
    key: "locations",
    label: "Locations",
    icon: MapPin,
  },
  {
    key: "youtube-channels",
    label: "YouTube Channels",
    icon: MonitorPlay,
  },
  {
    key: "newsletters",
    label: "Imports",
    icon: Mail,
  },
  {
    key: "people",
    label: "People",
    icon: UserRound,
  },
  {
    key: "groups",
    label: "Groups",
    icon: Building2,
  },
] as const;

const CUSTOMIZATION_ITEMS = [
  {
    key: "custom-properties",
    label: "Custom Properties",
    icon: SlidersHorizontal,
  },
  {
    key: "relationship-types",
    label: "Relationship Types",
    icon: Share2,
  },
  {
    key: "autofill",
    label: "Autofill Rules",
    icon: Wand2,
  },
  {
    key: "import-rules",
    label: "Import Rules",
    icon: FileInput,
  },
  {
    key: "saved-filters",
    label: "Saved Filters",
    icon: ListFilter,
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
    key: "action",
    label: "Action",
  },
] as const;

/** Sidebar visibility — which groups/items appear in the left sidebar, plus the opt-in links. */
export function DisplaySidebarSettings() {
  const {
    t,
  } = useTranslation();
  const {
    sidebar,
    setCategoryMode,
    setTaxonomyItemMode,
    setCustomizationItemMode,
    toggleSidebarGroup,
  } = useSidebarSettings();

  const {
    hiddenCategoryIds,
    seeMoreCategoryIds,
    hiddenTaxonomyItems,
    seeMoreTaxonomyItems,
    hiddenCustomizationItems,
    seeMoreCustomizationItems,
    hiddenSidebarGroups,
  } = sidebar;

  // The Categories / Taxonomies / Customization sections share one card, divided by separators.
  // Only the groups that aren't hidden contribute a section.
  const groupedSections: ReactNode[] = [];
  if (!hiddenSidebarGroups.includes("categories")) {
    groupedSections.push(
      <SidebarSettingsSection
        title={t("Categories")}
        description={t("Choose how each category appears in the left sidebar.")}
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
        title={t("Taxonomies")}
        description={t("Choose how each taxonomy browser appears in the left sidebar.")}
      >
        <SidebarItemsMatrix
          items={TAXONOMY_ITEMS.map(item => ({
            ...item,
            label: t(item.label),
          }))}
          hiddenItems={hiddenTaxonomyItems}
          seeMoreItems={seeMoreTaxonomyItems}
          onSetMode={setTaxonomyItemMode}
          hiddenLabel={t("Hide")}
        />
        <SidebarCustomTaxonomyVisibilityList />
      </SidebarSettingsSection>,
    );
  }
  if (!hiddenSidebarGroups.includes("customization")) {
    groupedSections.push(
      <SidebarSettingsSection
        title={t("Customization")}
        description={t("Choose how each customization tool appears in the left sidebar.")}
      >
        <SidebarItemsMatrix
          items={CUSTOMIZATION_ITEMS.map(item => ({
            ...item,
            label: t(item.label),
          }))}
          hiddenItems={hiddenCustomizationItems}
          seeMoreItems={seeMoreCustomizationItems}
          onSetMode={setCustomizationItemMode}
          hiddenLabel={t("Hide")}
        />
      </SidebarSettingsSection>,
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">{t("Sidebar")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("Choose which groups and items appear in the left sidebar.")}
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
              <Label htmlFor={`group-${group.key}`}>{t(group.label)}</Label>
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

      </div>

      <SidebarConnectorLinksSettings />

      <SidebarExternalLinksSettings />
    </div>
  );
}
