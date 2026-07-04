import type { Group } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { MultiCombobox } from "./MultiCombobox";
import { useEntityCreateOption } from "./useEntityCreateOption";

import { Label } from "@/components/ui/label";

interface Props {
  groups: Group[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

/**
 * Multi-select field for associating groups with a YouTube channel — the mirror of
 * `GroupYouTubeChannelsField`. Saving happens immediately on each selection change.
 */
export function ChannelGroupsField({
  groups,
  selectedIds,
  onChange,
}: Props) {
  const groupCreate = useEntityCreateOption("group", group => onChange([...selectedIds, group.id]));
  const {
    t,
  } = useTranslation();

  const options = groups.map(group => ({
    value: group.id,
    label: group.name,
  }));

  return (
    <>
      <div className="space-y-2">
        <Label className="block">{t("Groups")}</Label>
        <p className="text-sm text-muted-foreground">
          {t("Groups associated with this channel.")}
        </p>
        <MultiCombobox
          options={options}
          values={selectedIds}
          onValuesChange={onChange}
          placeholder={t("No groups selected")}
          searchPlaceholder={t("Search groups…")}
          emptyText={t("No groups found.")}
          createOption={groupCreate.createOption}
        />
      </div>
      {groupCreate.modal}
    </>
  );
}
