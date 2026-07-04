import type { ComboboxOption } from "./Combobox";
import type { GenreMood, GenreMoodNode, UpdateGenreMoodInput } from "@eesimple/types";

import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { AddGenreMoodModal } from "./AddGenreMoodModal";
import { EntityNamesTabEditor } from "./entityNames/EntityNamesTab";
import { GenreMoodAssignmentSection } from "./GenreMoodAssignmentSection";
import { genreMoodSchema } from "./genreMoodFormSchema";
import { Label } from "./ui/label";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useUpdateGenreMood } from "../hooks/useGenreMoods";
import { useAppForm } from "../lib/form";
import { flattenTree } from "../lib/tagTree";

/** Sentinel for the "(root)" option; an empty value reads as "no selection" in the combobox. */
const ROOT = "__root__";

const LABELS: Record<keyof UpdateGenreMoodInput, string> = {
  name: "Name",
  romanizedName: "Romanized name",
  parentId: "Parent",
};

interface GenreMoodGeneralFormProps {
  /** The entry being edited. */
  node: GenreMoodNode;
  /** Full tree, used to build the parent select options. */
  allGenreMoods: GenreMoodNode[];
  /** Ids to exclude from the parent options (an entry can't reparent under its own subtree). */
  forbiddenIds: Set<string>;
}

/** Edit an entry's name and parent. Each field auto-saves (no Save button). */
export function GenreMoodGeneralForm({
  node,
  allGenreMoods,
  forbiddenIds,
}: GenreMoodGeneralFormProps) {
  const {
    t,
  } = useTranslation();
  const navigate = useNavigate();
  const updateGenreMood = useUpdateGenreMood();
  const [addOpen, setAddOpen] = useState(false);
  const autoSave = useFieldAutoSave<UpdateGenreMoodInput, GenreMood>({
    id: node.id,
    update: updateGenreMood,
    labels: LABELS,
    initial: {
      name: node.name,
      romanizedName: node.romanizedName ?? "",
      parentId: node.parentId,
    },
  });

  const parentOptions: ComboboxOption[] = [
    {
      value: ROOT,
      label: t("(root)"),
    },
    ...flattenTree(allGenreMoods)
      .filter(item => !forbiddenIds.has(item.node.id))
      .map(item => ({
        value: item.node.id,
        label: item.node.name,
        depth: item.depth,
        romanized: item.node.romanizedName,
      })),
  ];

  const form = useAppForm({
    defaultValues: {
      name: node.name,
      parent: node.parentId ?? ROOT,
    },
    validators: {
      onChange: genreMoodSchema,
    },
  });

  return (
    <div className="space-y-6">
      <form.AppField name="name">
        {field => (
          <field.TextField
            label={t("Name")}
            placeholder={t("Entry name")}
            onBlur={() => autoSave.saveField(
              "name",
              field.state.value.trim(),
              {
                valid: field.state.meta.errors.length === 0,
                // Renaming changes the slug; follow it so the edit page keeps resolving.
                onSuccess: (updated) => {
                  if (updated.slug !== node.slug) {
                    void navigate({
                      to: "/taxonomies/genres-moods/$genreMoodSlug/edit/general",
                      params: {
                        genreMoodSlug: updated.slug,
                      },
                    });
                  }
                },
              },
            )}
          />
        )}
      </form.AppField>

      <div className="space-y-1">
        <Label>{t("Names")}</Label>
        <EntityNamesTabEditor
          ownerType="genreMood"
          ownerId={node.id}
        />
      </div>

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

      <GenreMoodAssignmentSection
        ownerType="genreMood"
        ownerId={node.id}
        excludeId={node.id}
        title={t("Related Genres & Moods")}
        description={t("Other Genres & Moods entries associated with this one.")}
      />

      <AddGenreMoodModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={(genreMood) => {
          form.setFieldValue("parent", genreMood.id);
          autoSave.saveField("parentId", genreMood.id);
        }}
      />
    </div>
  );
}
