import type { Tag, TagNode, UpdateTagInput } from "@eesimple/types";

import { useId, useState } from "react";

import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { AddTagModal } from "./AddTagModal";
import { EntityNamesTabEditor } from "./entityNames/EntityNamesTab";
import { PrimaryLanguageField } from "./entityNames/PrimaryLanguageField";
import { GenreMoodAssignmentSection } from "./GenreMoodAssignmentSection";
import { tagSchema } from "./tagFormSchema";
import { TreeCombobox } from "./TreeCombobox";
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
  description: "Description",
  editableOnCard: "Editable on card",
  excludeFromBackfill: "Exclude from backfilling",
};

interface TagFieldProps {
  node: TagNode;
}

/**
 * The tag's name field (the `name` field in the tag workbench registry). A standalone placeable field:
 * its own small `useAppForm` (validated with `tagSchema.shape.name`), auto-saving on blur — following
 * the new slug when a rename changes it, and re-syncing the primary-language name value.
 */
export function TagNameField({
  node,
}: TagFieldProps) {
  const {
    t,
  } = useTranslation();
  const navigate = useNavigate();
  const updateTag = useUpdateTag();
  const primaryLanguage = usePrimaryLanguageField("tag", node.id);
  const autoSave = useFieldAutoSave<UpdateTagInput, Tag>({
    id: node.id,
    update: updateTag,
    labels: LABELS,
    initial: {
      name: node.name,
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: node.name,
    },
    validators: {
      onChange: tagSchema.pick({
        name: true,
      }),
    },
  });

  return (
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
                      to: "/tags/$tagSlug/edit",
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
  );
}

/**
 * The tag's description field (the `description` field in the registry). A standalone placeable field
 * with its own small `useAppForm`, auto-saving on blur.
 */
export function TagDescriptionField({
  node,
}: TagFieldProps) {
  const {
    t,
  } = useTranslation();
  const updateTag = useUpdateTag();
  const autoSave = useFieldAutoSave<UpdateTagInput, Tag>({
    id: node.id,
    update: updateTag,
    labels: LABELS,
    initial: {
      description: node.description ?? null,
    },
  });

  const form = useAppForm({
    defaultValues: {
      description: node.description ?? "",
    },
    validators: {
      onChange: tagSchema.pick({
        description: true,
      }),
    },
  });

  return (
    <form.AppField name="description">
      {field => (
        <field.TextareaField
          label={t("Description")}
          onBlur={() => autoSave.saveField(
            "description",
            field.state.value.trim() || null,
            {
              valid: field.state.meta.errors.length === 0,
            },
          )}
        />
      )}
    </form.AppField>
  );
}

/**
 * The tag's primary-language picker (the `primaryLanguage` field). A standalone placeable field; it
 * mounts its own `usePrimaryLanguageField` (react-query-backed, so it coordinates with `TagNameField`'s
 * blur-sync via the shared cache).
 */
export function TagPrimaryLanguageEdit({
  node,
}: TagFieldProps) {
  const primaryLanguage = usePrimaryLanguageField("tag", node.id);
  return (
    <PrimaryLanguageField
      value={primaryLanguage.primaryLanguageId}
      onValueChange={v => primaryLanguage.setPrimaryLanguage(v, node.name)}
    />
  );
}

/** The tag's additional-names editor (the `names` field). Self-saving via `EntityNamesTabEditor`. */
export function TagNamesEdit({
  node,
}: TagFieldProps) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-1">
      <Label>{t("Names")}</Label>
      <EntityNamesTabEditor
        ownerType="tag"
        ownerId={node.id}
      />
    </div>
  );
}

interface TagParentEditProps extends TagFieldProps {
  /** Full tag tree, used to build the parent select options. */
  allTags: TagNode[];
  /** Tag ids to exclude from the parent options (a tag can't reparent under its subtree). */
  forbiddenIds: Set<string>;
}

/**
 * The tag's parent picker (the `parent` field). Edit-only — its value is already visible in view mode
 * via the `stats` field's `TaxonomyNodeStats` block. A standalone `TreeCombobox` (not wrapped in a
 * shared form, since it has no cross-field validation), owning its own display state and the inline
 * "Create tag" flow, auto-saving `parentId` on change.
 */
export function TagParentEdit({
  node,
  allTags,
  forbiddenIds,
}: TagParentEditProps) {
  const {
    t,
  } = useTranslation();
  const updateTag = useUpdateTag();
  const id = useId();
  const [addTagOpen, setAddTagOpen] = useState(false);
  const [parentId, setParentId] = useState(node.parentId ?? "");
  const autoSave = useFieldAutoSave<UpdateTagInput, Tag>({
    id: node.id,
    update: updateTag,
    labels: LABELS,
    initial: {
      parentId: node.parentId,
    },
  });

  const parentOptions = tagNodesToOptions(allTags, forbiddenIds);
  const label = t("Parent");

  return (
    <>
      <div className="space-y-1">
        <Label htmlFor={id}>{label}</Label>
        <TreeCombobox
          id={id}
          aria-label={label}
          options={parentOptions}
          value={parentId || undefined}
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
          onValueChange={(value) => {
            setParentId(value ?? "");
            autoSave.saveField("parentId", value || null);
          }}
        />
      </div>

      <AddTagModal
        open={addTagOpen}
        onOpenChange={setAddTagOpen}
        onCreated={(tag) => {
          // Select the freshly created tag as this tag's parent and persist it.
          setParentId(tag.id);
          autoSave.saveField("parentId", tag.id);
        }}
      />
    </>
  );
}

/**
 * The tag's two behavior checkboxes (the `options` field): whether it shows as a quick toggle on
 * bookmark cards, and whether it's excluded from autofill backfilling. Bundled since both are simple
 * boolean toggles of the same character; each saves independently on change, no form needed.
 */
export function TagOptionsFields({
  node,
}: TagFieldProps) {
  const {
    t,
  } = useTranslation();
  const updateTag = useUpdateTag();
  const autoSave = useFieldAutoSave<UpdateTagInput, Tag>({
    id: node.id,
    update: updateTag,
    labels: LABELS,
    initial: {
      editableOnCard: node.editableOnCard ?? false,
      excludeFromBackfill: node.excludeFromBackfill ?? false,
    },
  });

  return (
    <div className="space-y-2">
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
    </div>
  );
}

interface TagGeneralFormProps {
  /** The tag being edited. */
  node: TagNode;
  /** Full tag tree, used to build the parent select options. */
  allTags: TagNode[];
  /** Tag ids to exclude from the parent options (a tag can't reparent under its subtree). */
  forbiddenIds: Set<string>;
}

/**
 * Edit a tag's name, parent, description, primary language, additional names, card/autofill options,
 * and genres/moods. Each field auto-saves (no Save button). Composed from the same placeable
 * sub-fields the tag workbench registry uses, so this whole-form shell stays in lockstep with the
 * layout-driven General tab.
 */
export function TagGeneralForm({
  node,
  allTags,
  forbiddenIds,
}: TagGeneralFormProps) {
  return (
    <div className="space-y-4">
      <TagNameField node={node} />
      <TagPrimaryLanguageEdit node={node} />
      <TagDescriptionField node={node} />
      <TagNamesEdit node={node} />
      <TagParentEdit
        node={node}
        allTags={allTags}
        forbiddenIds={forbiddenIds}
      />
      <TagOptionsFields node={node} />
      <GenreMoodAssignmentSection
        ownerType="tag"
        ownerId={node.id}
      />
    </div>
  );
}
