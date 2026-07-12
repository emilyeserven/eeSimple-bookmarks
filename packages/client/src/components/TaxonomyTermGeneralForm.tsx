import type { ComboboxOption } from "./Combobox";
import type { Taxonomy, TaxonomyTerm, TaxonomyTermNode, UpdateTaxonomyTermInput } from "@eesimple/types";

import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { AddTaxonomyTermModal } from "./AddTaxonomyTermModal";
import { EntityNamesTabEditor } from "./entityNames/EntityNamesTab";
import { PrimaryLanguageField } from "./entityNames/PrimaryLanguageField";
import { Label } from "./ui/label";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { usePrimaryLanguageField } from "../hooks/usePrimaryLanguageField";
import { useTaxonomyTermTree, useUpdateTaxonomyTerm } from "../hooks/useTaxonomies";
import { useAppForm } from "../lib/form";
import { flattenTree, subtreeIds } from "../lib/tagTree";

/** Sentinel for the "(root)" option; an empty value reads as "no selection" in the combobox. */
const ROOT = "__root__";

const NAME_LABELS: Partial<Record<keyof UpdateTaxonomyTermInput, string>> = {
  name: "Name",
};
const DESCRIPTION_LABELS: Partial<Record<keyof UpdateTaxonomyTermInput, string>> = {
  description: "Description",
};
const PARENT_LABELS: Partial<Record<keyof UpdateTaxonomyTermInput, string>> = {
  parentId: "Parent",
};

const nameSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

const descriptionSchema = z.object({
  description: z.string(),
});

interface TaxonomyTermFieldProps {
  /** The taxonomy the term belongs to. */
  taxonomy: Taxonomy;
  /** The term being edited. */
  node: TaxonomyTermNode;
}

/**
 * The term's Name field (the `name` layout field). A standalone placeable field — its own
 * `useAppForm` instance and `useFieldAutoSave` call. Auto-saves on blur, follows a slug rename, and
 * re-syncs the primary-language name value via its own `usePrimaryLanguageField`. Mirrors
 * `GenreMoodNameField`, generalized to any taxonomy.
 */
export function TaxonomyTermNameField({
  taxonomy, node,
}: TaxonomyTermFieldProps) {
  const {
    t,
  } = useTranslation();
  const navigate = useNavigate();
  const updateTerm = useUpdateTaxonomyTerm(taxonomy.id);
  const primaryLanguage = usePrimaryLanguageField("taxonomyTerm", node.id);
  const autoSave = useFieldAutoSave<UpdateTaxonomyTermInput, TaxonomyTerm>({
    id: node.id,
    update: updateTerm,
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
          placeholder={t("Term name")}
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
                      to: "/taxonomies/$taxonomyKey/$termSlug/edit",
                      params: {
                        taxonomyKey: taxonomy.slug,
                        termSlug: updated.slug,
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

/** The term's Description field (the `description` layout field). Auto-saves on blur. */
export function TaxonomyTermDescriptionField({
  taxonomy, node,
}: TaxonomyTermFieldProps) {
  const {
    t,
  } = useTranslation();
  const updateTerm = useUpdateTaxonomyTerm(taxonomy.id);
  const autoSave = useFieldAutoSave<UpdateTaxonomyTermInput, TaxonomyTerm>({
    id: node.id,
    update: updateTerm,
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
          debounceSave
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
 * The term's Parent field (the `parent` layout field). Only meaningful for a hierarchical taxonomy —
 * callers gate rendering on `taxonomy.hierarchical`. Auto-saves on change.
 */
export function TaxonomyTermParentField({
  taxonomy, node,
}: TaxonomyTermFieldProps) {
  const {
    t,
  } = useTranslation();
  const updateTerm = useUpdateTaxonomyTerm(taxonomy.id);
  const {
    data,
  } = useTaxonomyTermTree(taxonomy.id);
  const forbiddenIds = new Set(subtreeIds(node));
  const [addOpen, setAddOpen] = useState(false);
  const autoSave = useFieldAutoSave<UpdateTaxonomyTermInput, TaxonomyTerm>({
    id: node.id,
    update: updateTerm,
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
            searchPlaceholder={t("Search terms…")}
            emptyText={t("No terms found.")}
            createOption={{
              label: t("Create term"),
              onSelect: () => setAddOpen(true),
            }}
            onValueChange={value =>
              autoSave.saveField("parentId", value && value !== ROOT ? value : null)}
          />
        )}
      </form.AppField>

      <AddTaxonomyTermModal
        taxonomyId={taxonomy.id}
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={(term) => {
          form.setFieldValue("parent", term.id);
          autoSave.saveField("parentId", term.id);
        }}
      />
    </>
  );
}

/**
 * The term's primary-language picker (the `primaryLanguage` layout field). Mirrors
 * `GenreMoodPrimaryLanguageEdit`.
 */
export function TaxonomyTermPrimaryLanguageEdit({
  node,
}: TaxonomyTermFieldProps) {
  const primaryLanguage = usePrimaryLanguageField("taxonomyTerm", node.id);
  return (
    <PrimaryLanguageField
      value={primaryLanguage.primaryLanguageId}
      onValueChange={v => primaryLanguage.setPrimaryLanguage(v, node.name)}
    />
  );
}

/** The term's additional-names editor (the `names` layout field). Self-saving via `EntityNamesTabEditor`. */
export function TaxonomyTermNamesEdit({
  node,
}: TaxonomyTermFieldProps) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-1">
      <Label>{t("Names")}</Label>
      <EntityNamesTabEditor
        ownerType="taxonomyTerm"
        ownerId={node.id}
      />
    </div>
  );
}
