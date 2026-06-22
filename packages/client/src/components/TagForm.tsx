import type { TagNode } from "@eesimple/types";
import type React from "react";

import { Fragment } from "react";

import { tagSchema } from "./tagFormSchema";
import { useAppForm } from "../lib/form";
import { flattenTree } from "../lib/tagTree";

/** Sentinel for the "(root)" option, since Radix Select forbids an empty-string value. */
const ROOT = "__root__";

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
    parentId: string | null; }) => void;
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
}: TagFormProps) {
  const parentOptions = [
    {
      value: ROOT,
      label: "(root)",
    },
    ...flattenTree(allTags)
      .filter(item => !forbiddenIds?.has(item.node.id))
      .map(item => ({
        value: item.node.id,
        label: `${"– ".repeat(item.depth)}${item.node.name}`,
      })),
  ];

  const form = useAppForm({
    defaultValues: {
      name: defaultName,
      parent: defaultParentId ?? ROOT,
    },
    validators: {
      onChange: tagSchema,
    },
    onSubmit: ({
      value,
    }) => {
      onSubmit({
        name: value.name.trim(),
        // With the parent select hidden, honor the fixed `defaultParentId` (used by the header's
        // "New sub-X" quick-add); otherwise read the chosen parent, treating ROOT as null.
        parentId: !showParent
          ? (defaultParentId ?? null)
          : value.parent === ROOT ? null : value.parent,
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

      {showParent
        ? (
          <form.AppField name="parent">
            {field => (
              <field.SelectField
                label="Parent"
                options={parentOptions}
                placeholder="Choose a parent"
              />
            )}
          </form.AppField>
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
