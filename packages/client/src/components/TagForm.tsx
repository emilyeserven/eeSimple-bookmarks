import type { DraftEntityName } from "./entityNames/draftEntityName";
import type { Tag, TagNode, UpdateEntityNameEntry } from "@eesimple/types";
import type React from "react";

import { Fragment, useState } from "react";

import { entriesFromDrafts } from "./entityNames/draftEntityName";
import { EntityNamesEditor } from "./entityNames/EntityNamesEditor";
import { tagSchema } from "./tagFormSchema";
import { Label } from "./ui/label";
import { useAppForm } from "../lib/form";
import { tagNodesToOptions } from "../lib/tagTree";

/** Props handed to `renderParentCreateModal` — everything it needs to wire up an `AddTagModal`. */
interface ParentCreateModalRenderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (tag: Tag) => void;
}

interface TagFormProps {
  /** Full tag tree, used to build the parent select options. */
  allTags: TagNode[];
  /** When true, render the parent select; false → name-only (e.g. root create). */
  showParent?: boolean;
  /** Tag ids to exclude from the parent options (a tag can't reparent under its subtree). */
  forbiddenIds?: Set<string>;
  defaultName?: string;
  defaultParentId?: string | null;
  submitLabel: string;
  pendingLabel: string;
  isError: boolean;
  errorMessage?: string;
  /**
   * Surface-specific wrapper around the submit button. Defaults to `Fragment` (inline,
   * used by the panel); the modal passes `DialogFooter` to keep its footer layout.
   */
  SubmitWrapper?: React.ComponentType<{ children: React.ReactNode }>;
  /** Called with normalized values on a valid submit; `parentId` is null for "(root)". */
  onSubmit: (value: { name: string;
    names: UpdateEntityNameEntry[];
    parentId: string | null; }) => void;
  /**
   * Renders the parent picker's inline "Create tag" modal (an `AddTagModal`). Taken as a render
   * prop rather than imported directly: `AddTagModal` renders this form, so a direct import here
   * would create a circular dependency (`AddTagModal` → `TagForm` → `AddTagModal`) — the caller
   * (`AddTagModal.tsx`) supplies its own nested instance instead. Only needed when `showParent`.
   */
  renderParentCreateModal?: (props: ParentCreateModalRenderProps) => React.ReactNode;
}

/**
 * Shared name (+ optional parent) tag form. Used by both the New-tag modal and the
 * right-hand panel's create/edit forms so the two surfaces stay in parity.
 */
export function TagForm({
  allTags,
  showParent = true,
  forbiddenIds,
  defaultName = "",
  defaultParentId = null,
  submitLabel,
  pendingLabel,
  isError,
  errorMessage,
  SubmitWrapper = Fragment,
  onSubmit,
  renderParentCreateModal,
}: TagFormProps) {
  const [addTagOpen, setAddTagOpen] = useState(false);
  const [nameDrafts, setNameDrafts] = useState<DraftEntityName[]>([]);
  const parentOptions = tagNodesToOptions(allTags, forbiddenIds);

  const form = useAppForm({
    defaultValues: {
      name: defaultName,
      parent: defaultParentId ?? "",
    },
    validators: {
      onChange: tagSchema,
    },
    onSubmit: ({
      value,
    }) => {
      onSubmit({
        name: value.name.trim(),
        names: entriesFromDrafts(nameDrafts),
        // With the parent select hidden, honor the fixed `defaultParentId` (used by the header's
        // "New sub-X" quick-add); otherwise read the chosen parent, treating "" (root) as null.
        parentId: !showParent
          ? (defaultParentId ?? null)
          : value.parent || null,
      });
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <form.AppField name="name">
        {field => (
          <field.TextField
            label="Name"
            placeholder="Tag name"
          />
        )}
      </form.AppField>

      <div className="space-y-1">
        <Label>Names</Label>
        <EntityNamesEditor
          value={nameDrafts}
          onChange={setNameDrafts}
        />
      </div>

      {showParent
        ? (
          <>
            <form.AppField name="parent">
              {field => (
                <field.TreeComboboxField
                  label="Parent"
                  options={parentOptions}
                  placeholder="Choose a parent"
                  searchPlaceholder="Search tags…"
                  emptyText="No tags found."
                  leadingOption={{
                    value: "",
                    label: "(root)",
                  }}
                  createOption={{
                    label: "Create tag",
                    onSelect: () => setAddTagOpen(true),
                  }}
                />
              )}
            </form.AppField>

            {renderParentCreateModal?.({
              open: addTagOpen,
              onOpenChange: setAddTagOpen,
              onCreated: (tag: Tag) => form.setFieldValue("parent", tag.id),
            })}
          </>
        )
        : null}

      <SubmitWrapper>
        <form.AppForm>
          <form.SubmitButton
            label={submitLabel}
            pendingLabel={pendingLabel}
          />
        </form.AppForm>
      </SubmitWrapper>

      {isError
        ? <p className="text-xs text-destructive">{errorMessage}</p>
        : null}
    </form>
  );
}
