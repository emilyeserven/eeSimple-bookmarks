import type { Group, UpdateGroupInput } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { Library } from "lucide-react";
import { z } from "zod";

import { useEntityCreateOption } from "./useEntityCreateOption";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useUpdateGroup } from "../hooks/useGroups";
import { useGroupTypes } from "../hooks/useGroupTypes";
import { useYouTubeChannels } from "../hooks/useYouTubeChannels";
import i18n from "../i18n";
import { useAppForm } from "../lib/form";
import { labeledWebsiteSchema } from "../lib/labeledWebsites";
import { socialLinkSchema } from "../lib/socialLinks";

const groupGeneralSchema = z.object({
  name: z.string().trim().min(1, i18n.t("Name is required")),
  description: z.string(),
  groupTypeId: z.string().nullable(),
  socialLinks: z.array(socialLinkSchema),
  labeledWebsites: z.array(labeledWebsiteSchema),
});

const LABELS: Partial<Record<keyof UpdateGroupInput, string>> = {
  name: i18n.t("Name"),
  description: i18n.t("Description"),
  groupTypeId: i18n.t("Group type"),
  socialLinks: i18n.t("Social media links"),
  labeledWebsites: i18n.t("Websites"),
  youtubeChannelIds: i18n.t("YouTube channels"),
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
      description: group.description ?? null,
      groupTypeId: group.groupTypeId ?? null,
      socialLinks: group.socialLinks,
      labeledWebsites: group.labeledWebsites,
      youtubeChannelIds: group.youtubeChannelIds,
    },
  });

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
      description: group.description ?? "",
      groupTypeId: group.groupTypeId ?? null,
    },
    validators: {
      onChange: groupGeneralSchema,
    },
  });

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
    groupTypeOptions,
    groupTypeCreate,
    youtubeChannels: youtubeChannels ?? [],
  };
}
