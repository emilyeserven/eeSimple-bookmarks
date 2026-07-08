import type { ComboboxOption } from "./Combobox";
import type { GenreMood, GenreMoodNode, UpdateGenreMoodInput } from "@eesimple/types";

import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { AddGenreMoodModal } from "./AddGenreMoodModal";
import { EntityNamesTabEditor } from "./entityNames/EntityNamesTab";
import { PrimaryLanguageField } from "./entityNames/PrimaryLanguageField";
import { Label } from "./ui/label";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useGenreMoodTree, useUpdateGenreMood } from "../hooks/useGenreMoods";
import { usePrimaryLanguageField } from "../hooks/usePrimaryLanguageField";
import { useAppForm } from "../lib/form";
import { flattenTree, subtreeIds } from "../lib/tagTree";

/** Sentinel for the "(root)" option; an empty value reads as "no selection" in the combobox. */
const ROOT = "__root__";

const NAME_LABELS: Partial<Record<keyof UpdateGenreMoodInput, string>> = {
  name: "Name",
};
const DESCRIPTION_LABELS: Partial<Record<keyof UpdateGenreMoodInput, string>> = {
  description: "Description",
};
const PARENT_LABELS: Partial<Record<keyof UpdateGenreMoodInput, string>> = {
  parentId: "Parent",
};

const nameSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

const descriptionSchema = z.object({
  description: z.string(),
});

interface GenreMoodFieldProps {
  /** The entry being edited. */
  node: GenreMoodNode;
}

/**
 * The entry's Name field (the `name` layout field). A standalone placeable field — its own
 * `useAppForm` instance and `useFieldAutoSave` call. Auto-saves on blur, follows a slug rename, and
 * re-syncs the primary-language name value via its own `usePrimaryLanguageField` (react-query-backed,
 * so it coordinates with the `primaryLanguage` field's own instance through the shared cache — the
 * same reasoning `CategoryDetailsFields`/`CategoryPrimaryLanguageEdit` already rely on).
 */
export function GenreMoodNameField({
  node,
}: GenreMoodFieldProps) {
  const {
    t,
  } = useTranslation();
  const navigate = useNavigate();
  const updateGenreMood = useUpdateGenreMood();
  const primaryLanguage = usePrimaryLanguageField("genreMood", node.id);
  const autoSave = useFieldAutoSave<UpdateGenreMoodInput, GenreMood>({
    id: node.id,
    update: updateGenreMood,
    labels: NAME_LABELS,
    initial: {
      name: node.name,
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: node.name,
    },
    validators: {
      onChange: nameSchema,
    },
  });

  return (
    <form.AppField name="name">
      {field => (
        <field.TextField
          label={t("Name")}
          placeholder={t("Entry name")}
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
                      to: "/taxonomies/genres-moods/$genreMoodSlug/edit",
                      params: {
                        genreMoodSlug: updated.slug,
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

/** The entry's Description field (the `description` layout field). Auto-saves on blur. */
export function GenreMoodDescriptionField({
  node,
}: GenreMoodFieldProps) {
  const {
    t,
  } = useTranslation();
  const updateGenreMood = useUpdateGenreMood();
  const autoSave = useFieldAutoSave<UpdateGenreMoodInput, GenreMood>({
    id: node.id,
    update: updateGenreMood,
    labels: DESCRIPTION_LABELS,
    initial: {
      description: node.description ?? null,
    },
  });

  const form = useAppForm({
    defaultValues: {
      description: node.description ?? "",
    },
    validators: {
      onChange: descriptionSchema,
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
 * The entry's Parent field (the `parent` layout field). Auto-saves on change. Fetches the full tree
 * itself (rather than taking it as a prop) so it can be mounted directly as a `WorkbenchField.edit`
 * renderer, which is called as a plain function — hooks must live inside the returned component.
 */
export function GenreMoodParentField({
  node,
}: GenreMoodFieldProps) {
  const {
    t,
  } = useTranslation();
  const updateGenreMood = useUpdateGenreMood();
  const {
    data,
  } = useGenreMoodTree();
  const forbiddenIds = new Set(subtreeIds(node));
  const [addOpen, setAddOpen] = useState(false);
  const autoSave = useFieldAutoSave<UpdateGenreMoodInput, GenreMood>({
    id: node.id,
    update: updateGenreMood,
    labels: PARENT_LABELS,
    initial: {
      parentId: node.parentId,
    },
  });

  const parentOptions: ComboboxOption[] = [
    {
      value: ROOT,
      label: t("(root)"),
    },
    ...flattenTree(data ?? [])
      .filter(item => !forbiddenIds.has(item.node.id))
      .map(item => ({
        value: item.node.id,
        label: item.node.name,
        depth: item.depth,
        names: item.node.names,
      })),
  ];

  const form = useAppForm({
    defaultValues: {
      parent: node.parentId ?? ROOT,
    },
  });

  return (
    <>
      <form.AppField name="parent">
        {field => (
          <field.ComboboxField
            label={t("Parent")}
            options={parentOptions}
            placeholder={t("Choose a parent")}
            searchPlaceholder={t("Search entries…")}
            emptyText={t("No entries found.")}
            createOption={{
              label: t("Create entry"),
              onSelect: () => setAddOpen(true),
            }}
            onValueChange={value =>
              autoSave.saveField("parentId", value && value !== ROOT ? value : null)}
          />
        )}
      </form.AppField>

      <AddGenreMoodModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={(genreMood) => {
          form.setFieldValue("parent", genreMood.id);
          autoSave.saveField("parentId", genreMood.id);
        }}
      />
    </>
  );
}

/**
 * The entry's primary-language picker (the `primaryLanguage` layout field). A standalone placeable
 * field, mirroring `CategoryPrimaryLanguageEdit`: mounts its own `usePrimaryLanguageField`
 * (react-query-backed, so it coordinates with the Name field's sync via the shared cache) and seeds a
 * newly-set primary row with the entry's saved name.
 */
export function GenreMoodPrimaryLanguageEdit({
  node,
}: GenreMoodFieldProps) {
  const primaryLanguage = usePrimaryLanguageField("genreMood", node.id);
  return (
    <PrimaryLanguageField
      value={primaryLanguage.primaryLanguageId}
      onValueChange={v => primaryLanguage.setPrimaryLanguage(v, node.name)}
    />
  );
}

/** The entry's additional-names editor (the `names` layout field). Self-saving via `EntityNamesTabEditor`. */
export function GenreMoodNamesEdit({
  node,
}: GenreMoodFieldProps) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-1">
      <Label>{t("Names")}</Label>
      <EntityNamesTabEditor
        ownerType="genreMood"
        ownerId={node.id}
      />
    </div>
  );
}
