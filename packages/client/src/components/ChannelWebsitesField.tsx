import type { Website } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { MultiCombobox } from "./MultiCombobox";
import { useEntityCreateOption } from "./useEntityCreateOption";

import { Label } from "@/components/ui/label";

interface Props {
  websites: Website[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

/**
 * Multi-select field for associating websites with a YouTube channel — the mirror of
 * `WebsiteYouTubeChannelsField`. Saving happens immediately on each selection change.
 */
export function ChannelWebsitesField({
  websites,
  selectedIds,
  onChange,
}: Props) {
  const {
    t,
  } = useTranslation();
  const websiteCreate = useEntityCreateOption("website", website => onChange([...selectedIds, website.id]));

  const options = websites.map(website => ({
    value: website.id,
    label: website.siteName,
  }));

  return (
    <>
      <div className="space-y-2">
        <Label className="block">{t("Websites")}</Label>
        <p className="text-sm text-muted-foreground">
          {t("Websites associated with this channel.")}
        </p>
        <MultiCombobox
          options={options}
          values={selectedIds}
          onValuesChange={onChange}
          placeholder={t("No websites selected")}
          searchPlaceholder={t("Search websites…")}
          emptyText={t("No websites found.")}
          createOption={websiteCreate.createOption}
        />
      </div>
      {websiteCreate.modal}
    </>
  );
}
