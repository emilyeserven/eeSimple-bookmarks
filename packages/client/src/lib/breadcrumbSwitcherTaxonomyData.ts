import type { TaxonomyEntity } from "./breadcrumbSwitcherTypes";
import type { AutofillRule, CustomProperty, ImportRule, PropertyGroup, Website, YouTubeChannel } from "@eesimple/types";

import { useAutofillRules } from "@/hooks/useAutofill";
import { useCustomProperties } from "@/hooks/useCustomProperties";
import { useImportRules } from "@/hooks/useImportRules";
import { usePropertyGroups } from "@/hooks/usePropertyGroups";
import { useWebsites } from "@/hooks/useWebsites";
import { useYouTubeChannels } from "@/hooks/useYouTubeChannels";

export interface TaxonomyLists {
  websites: Website[] | undefined;
  channels: YouTubeChannel[] | undefined;
  properties: CustomProperty[] | undefined;
  groups: PropertyGroup[] | undefined;
  rules: AutofillRule[] | undefined;
  importRules: ImportRule[] | undefined;
}

export interface TaxonomySwitcherData {
  lists: TaxonomyLists;
  loadingByEntity: Record<TaxonomyEntity, boolean>;
}

/** The flat slug-routed taxonomy lists for a taxonomy switcher spec (all already cached app-wide). */
export function useTaxonomySwitcherData(): TaxonomySwitcherData {
  const websites = useWebsites();
  const channels = useYouTubeChannels();
  const properties = useCustomProperties();
  const groups = usePropertyGroups();
  const rules = useAutofillRules();
  const importRules = useImportRules();

  return {
    lists: {
      websites: websites.data,
      channels: channels.data,
      properties: properties.data,
      groups: groups.data,
      rules: rules.data,
      importRules: importRules.data,
    },
    loadingByEntity: {
      "website": websites.isLoading,
      "youtube-channel": channels.isLoading,
      "custom-property": properties.isLoading,
      "property-group": groups.isLoading,
      "autofill": rules.isLoading,
      "import-rule": importRules.isLoading,
    },
  };
}
