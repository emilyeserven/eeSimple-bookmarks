import type { Group, UpdateGroupInput } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { Globe, Library } from "lucide-react";
import { z } from "zod";

import { useEntityCreateOption } from "./useEntityCreateOption";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useUpdateGroup } from "../hooks/useGroups";
import { useGroupTypes } from "../hooks/useGroupTypes";
import { useWebsites } from "../hooks/useWebsites";
import { useYouTubeChannels } from "../hooks/useYouTubeChannels";
import { useAppForm } from "../lib/form";
import { socialLinkSchema } from "../lib/socialLinks";

const groupGeneralSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  romanizedName: z.string(),
  websiteId: z.string().nullable(),
  groupTypeId: z.string().nullable(),
  socialLinks: z.array(socialLinkSchema),
});

const LABELS: Partial<Record<keyof UpdateGroupInput, string>> = {
  name: "Name",
  romanizedName: "Romanized name",
  websiteId: "Website",
  groupTypeId: "Group type",
  socialLinks: "Social media links",
  youtubeChannelIds: "YouTube channels",
};

/**
 * Owns the stateful pieces of the group General (edit) form: the autosave engine, the website
 * picker options, the add-website modal state, and the autosave snapshot. Returns one bag so
 * `GroupGeneralForm` stays a presentational shell.
 */
export function useGroupGeneralForm(group: Group) {
  const navigate = useNavigate();
  const update = useUpdateGroup();
  const {
    data: websites,
  } = useWebsites();
  const {
    data: groupTypes,
  } = useGroupTypes();
  const {
    data: youtubeChannels,
  } = useYouTubeChannels();

  const autoSave = useFieldAutoSave<UpdateGroupInput, Group>({
    id: group.id,
    update,
    labels: LABELS,
    initial: {
      name: group.name,
      romanizedName: group.romanizedName ?? "",
      websiteId: group.websiteId ?? null,
      groupTypeId: group.groupTypeId ?? null,
      socialLinks: group.socialLinks,
      youtubeChannelIds: group.youtubeChannelIds,
    },
  });

  const websiteOptions = (websites ?? []).map(website => ({
    value: website.id,
    label: website.siteName,
    icon: (
      <Globe className="size-4 shrink-0 text-muted-foreground" />
    ),
  }));

  const groupTypeOptions = (groupTypes ?? []).map(groupType => ({
    value: groupType.id,
    label: groupType.name,
    icon: (
      <Library className="size-4 shrink-0 text-muted-foreground" />
    ),
  }));

  const form = useAppForm({
    defaultValues: {
      name: group.name,
      romanizedName: group.romanizedName ?? "",
      websiteId: group.websiteId ?? null,
      groupTypeId: group.groupTypeId ?? null,
    },
    validators: {
      onChange: groupGeneralSchema,
    },
  });

  const websiteCreate = useEntityCreateOption("website", website => form.setFieldValue("websiteId", website.id));
  const groupTypeCreate = useEntityCreateOption(
    "group-type",
    groupType => form.setFieldValue("groupTypeId", groupType.id),
  );

  function saveName(value: string, valid: boolean): void {
    autoSave.saveField("name", value.trim(), {
      valid,
      // Renaming changes the slug; follow it so the edit page keeps resolving.
      onSuccess: (updated) => {
        if (updated.slug !== group.slug) {
          void navigate({
            to: "/taxonomies/groups/$groupSlug/edit/general",
            params: {
              groupSlug: updated.slug,
            },
          });
        }
      },
    });
  }

  return {
    form,
    saveField: autoSave.saveField,
    saveName,
    websiteOptions,
    websiteCreate,
    groupTypeOptions,
    groupTypeCreate,
    youtubeChannels: youtubeChannels ?? [],
  };
}
