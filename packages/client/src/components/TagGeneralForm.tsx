import type { Tag, TagNode, UpdateTagInput } from "@eesimple/types";

import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { AddTagModal } from "./AddTagModal";
import { EntityNamesTabEditor } from "./entityNames/EntityNamesTab";
import { PrimaryLanguageField } from "./entityNames/PrimaryLanguageField";
import { GenreMoodAssignmentSection } from "./GenreMoodAssignmentSection";
import { tagSchema } from "./tagFormSchema";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { usePrimaryLanguageField } from "../hooks/usePrimaryLanguageField";
import { useUpdateTag } from "../hooks/useTags";
import { useAppForm } from "../lib/form";
import { tagNodesToOptions } from "../lib/tagTree";

const LABELS: Record<keyof UpdateTagInput, string> = {
  name: "Name",
  parentId: "Parent",
  editableOnCard: "Editable on card",
  excludeFromBackfill: "Exclude from backfilling",
};

interface TagGeneralFormProps {
  /** The tag being edited. */
  node: TagNode;
  /** Full tag tree, used to build the parent select options. */
  allTags: TagNode[];
  /** Tag ids to exclude from the parent options (a tag can't reparent under its subtree). */
  forbiddenIds: Set<string>;
}

/** Edit a tag's name and parent. Each field auto-saves (no Save button). */
export function TagGeneralForm({
  node,
  allTags,
  forbiddenIds,
}: TagGeneralFormProps) {
  const {
    t,
  } = useTranslation();
  const navigate = useNavigate();
  const updateTag = useUpdateTag();
  const primaryLanguage = usePrimaryLanguageField("tag", node.id);
  const [addTagOpen, setAddTagOpen] = useState(false);
  const autoSave = useFieldAutoSave<UpdateTagInput, Tag>({
    id: node.id,
    update: updateTag,
    labels: LABELS,
    initial: {
      name: node.name,
      parentId: node.parentId,
      editableOnCard: node.editableOnCard ?? false,
      excludeFromBackfill: node.excludeFromBackfill ?? false,
    },
  });

  const parentOptions = tagNodesToOptions(allTags, forbiddenIds);

  const form = useAppForm({
    defaultValues: {
      name: node.name,
      parent: node.parentId ?? "",
    },
    validators: {
      onChange: tagSchema,
    },
  });

  return (
    <div className="space-y-4">
      <form.AppField name="name">
        {field => (
          <field.TextField
            label={t("Name")}
            placeholder={t("Tag name")}
            onBlur={() => {
              const trimmed = field.state.value.trim();
              autoSave.saveField(
                "name",
                trimmed,
                {
                  valid: field.state.meta.errors.length === 0,
                  // Renaming changes the slug; follow it so the edit page keeps resolving.
                  onSuccess: (updated) => {
                    if (updated.slug !== node.slug) {
                      void navigate({
                        to: "/tags/$tagSlug/edit/general",
                        params: {
                          tagSlug: updated.slug,
                        },
                      });
                    }
                  },
                },
              );
              primaryLanguage.syncPrimaryValue(trimmed);
            }}
          />
        )}
      </form.AppField>

      <PrimaryLanguageField
        value={primaryLanguage.primaryLanguageId}
        onValueChange={v => primaryLanguage.setPrimaryLanguage(v, form.state.values.name)}
      />

      <div className="space-y-1">
        <Label>{t("Names")}</Label>
        <EntityNamesTabEditor
          ownerType="tag"
          ownerId={node.id}
        />
      </div>

      <form.AppField name="parent">
        {field => (
          <field.TreeComboboxField
            label={t("Parent")}
            options={parentOptions}
            placeholder={t("Choose a parent")}
            searchPlaceholder={t("Search tags…")}
            emptyText={t("No tags found.")}
            leadingOption={{
              value: "",
              label: t("(root)"),
            }}
            createOption={{
              label: t("Create tag"),
              onSelect: () => setAddTagOpen(true),
            }}
            onValueChange={value => autoSave.saveField("parentId", value || null)}
          />
        )}
      </form.AppField>

      <div className="flex items-center gap-2">
        <Checkbox
          id="tag-editable-on-card"
          checked={node.editableOnCard ?? false}
          onCheckedChange={checked => autoSave.saveField("editableOnCard", checked === true)}
        />
        <Label htmlFor="tag-editable-on-card">{t("Show as quick toggle on bookmark cards")}</Label>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="tag-exclude-from-backfill"
          checked={node.excludeFromBackfill ?? false}
          onCheckedChange={checked => autoSave.saveField("excludeFromBackfill", checked === true)}
        />
        <Label htmlFor="tag-exclude-from-backfill">{t("Exclude from autofill backfilling")}</Label>
      </div>

      <GenreMoodAssignmentSection
        ownerType="tag"
        ownerId={node.id}
      />

      <AddTagModal
        open={addTagOpen}
        onOpenChange={setAddTagOpen}
        onCreated={(tag) => {
          // Select the freshly created tag as this tag's parent and persist it.
          form.setFieldValue("parent", tag.id);
          autoSave.saveField("parentId", tag.id);
        }}
      />
    </div>
  );
}
