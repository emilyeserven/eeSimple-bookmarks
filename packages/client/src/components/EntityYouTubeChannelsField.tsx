import type { YouTubeChannel } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { MultiCombobox } from "./MultiCombobox";
import { useEntityCreateOption } from "./useEntityCreateOption";

import { Label } from "@/components/ui/label";

interface Props {
  channels: YouTubeChannel[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  /** Description text tailored to the owning entity (website, group, …). */
  description: string;
}

/**
 * Multi-select field for associating YouTube channels with an owner entity. Saving happens
 * immediately on each selection change. Shared by `WebsiteYouTubeChannelsField` and
 * `GroupYouTubeChannelsField`, which each supply owner-specific copy.
 */
export function EntityYouTubeChannelsField({
  channels,
  selectedIds,
  onChange,
  description,
}: Props) {
  const {
    t,
  } = useTranslation();
  const channelCreate = useEntityCreateOption("youtube-channel", channel => onChange([...selectedIds, channel.id]));

  const options = channels.map(channel => ({
    value: channel.id,
    label: channel.name,
  }));

  return (
    <>
      <div className="space-y-2">
        <Label className="block">{t("YouTube channels")}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
        <MultiCombobox
          options={options}
          values={selectedIds}
          onValuesChange={onChange}
          placeholder={t("No channels selected")}
          searchPlaceholder={t("Search channels…")}
          emptyText={t("No channels found.")}
          createOption={channelCreate.createOption}
        />
      </div>
      {channelCreate.modal}
    </>
  );
}
