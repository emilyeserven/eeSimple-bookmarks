---
name: inline-create-modal
description: >-
  Add a name-only (or name + one flag) "Add new X" inline-create dialog in eeSimple Bookmarks,
  backed by the shared `InlineCreateModal` component. Use when asked to "let me create a
  category/tag/group inline", "add an Add-new-X button to a combobox", "add a quick-create modal",
  or when a form's entity-picker needs to mint a new entity without leaving the page. Mirrors
  `AddCategoryModal` and `AddRelationshipTypeModal` (the `extraFields`
  case).
  Also covers maintaining one — "add a field to the Add-X modal" (usually the wrong move; see When NOT to use it), "rename the inline-create dialog".
---

# Inline-create modal

When a form's combobox needs an "Add new X" escape hatch (create the entity, then select it without
navigating away), use a thin wrapper over the shared **`InlineCreateModal`**
(`packages/client/src/components/InlineCreateModal.tsx`). It owns the Dialog chrome, the single
**Name** field, zod validation, and form reset — you supply the labels and wire `onSubmit` to a
`useCreate*` mutation. **Do not** re-implement the Dialog + field + reset by hand.

## Build one

```tsx
import type { Widget } from "@eesimple/types";

import { InlineCreateModal } from "./InlineCreateModal";
import { useCreateWidget } from "../hooks/useWidgets";

interface AddWidgetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the created widget so the opener can select it. */
  onCreated?: (widget: Widget) => void;
}

export function AddWidgetModal({ open, onOpenChange, onCreated }: AddWidgetModalProps) {
  const createWidget = useCreateWidget();
  return (
    <InlineCreateModal
      open={open}
      onOpenChange={onOpenChange}
      title="New widget"
      description="Give the widget a name — fill in the rest later from its edit page."
      placeholder="e.g. Sprocket"
      submitLabel="Add widget"
      isError={createWidget.isError}
      errorMessage={createWidget.error?.message}
      onSubmit={(name, done) => {
        createWidget.mutate({ name }, {
          onSuccess: (widget) => { onCreated?.(widget); done(); },
        });
      }}
    />
  );
}
```

Contract:
- **`open` / `onOpenChange`** — standard controlled-dialog props; the opener owns the state.
- **`onSubmit(name, done)`** — called with the trimmed name. Call `done()` on mutation success — it
  closes the dialog and resets the field for the next open. Don't close the dialog yourself.
- **`onCreated`** (your wrapper's prop) — hand the created entity back so the combobox can select it.

## Name + one flag

A single extra field (e.g. a boolean checkbox) is still supported — pass `extraFields` (a
`ReactNode`) to render it between the name field and the submit row. `InlineCreateModal` stays
name-only internally: the flag's state is owned by **your wrapper** (a plain `useState`), and your
`onSubmit` closure folds it into the mutation payload alongside the trimmed name. Reset the flag in
the mutation's `onSuccess`, right before calling `done()`. See `AddRelationshipTypeModal.tsx`
(`directional`) for the reference implementation.

## When NOT to use it

- The create needs **more than a name + one flag** (parent selection, multiple fields, options) →
  it's a different shape. `AddTagModal` uses the full `TagForm` (parent selection) inside a plain
  `Dialog`, not `InlineCreateModal`.
- It's a full create **page/route**, not a modal → that's the `add-entity` skill.

## Wire it into a combobox

The opener (a `ComboboxField` / `MultiCombobox` with an "Add new…" affordance) holds `const [open,
setOpen] = useState(false)`, renders `<AddWidgetModal open={open} onOpenChange={setOpen}
onCreated={w => field.handleChange(w.id)} />`, and opens it from the combobox's create action. See
the `AddCategoryModal` usage inside `BookmarkForm`.

**Required, not optional.** The `combobox-new-entity-creation` skill is the authoritative checklist
of which comboboxes must wire `createOption` and which are exempt. When you build a new `Add*Modal`,
check that skill to see which existing pickers for that entity type still need to be wired.

## Maintaining an existing inline-create modal

- **"Add a field to the Add-X modal"** is usually the wrong move — the modal is deliberately
  name-only (see *When NOT to use it*). Extra fields belong on the entity's edit tabs after
  creation, or the flow graduates to the full create form. Push back before widening one.
- **Renaming the entity**: the dialog title/placeholder live in the thin wrapper
  (`Add<X>Modal.tsx`); the shared `InlineCreateModal` needs no change.
- **Auditing which pickers offer inline create** is the `combobox-new-entity-creation` skill —
  use its checklist rather than grepping ad hoc.
