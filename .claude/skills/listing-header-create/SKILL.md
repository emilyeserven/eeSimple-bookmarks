---
name: listing-header-create
description: >-
  Convert a listing page's embedded inline form into a header "New X" button that opens a minimal
  modal and navigates to the created entity's edit/general tab on success. Use when asked to "add
  a New X button to the listing page", "replace the inline create form with a modal", "implement
  #196 / #197 / #198 / #199 / #200 / #201 / #202", or "generalize the listing-page create
  pattern". Covers Media Types, Tags, Categories, Custom Properties, Websites, Property Groups,
  and Autofill Rules.
---

# Listing-header create modal

Every entity listing page should follow a single pattern:

1. A **"New X" button in the section header** (not an inline form embedded in the list body).
2. Clicking opens a **minimal modal** — name only for most entities; an extra required field for
   Websites (domain) and Custom Properties (type).
3. On success the modal closes and the app **navigates to the created entity's `edit/general` tab**.

The manager/listing component owns `useState` for modal open/close, `useNavigate`, and the
`onCreated` callback. The modal is thin — it calls `useCreate*` and delegates chrome/reset to
`InlineCreateModal` (Shape A) or a hand-rolled `Dialog` (Shapes B/C).

## Shape A — name-only (Categories, Media Types, Property Groups, Tags, Autofill Rules)

Wrap `InlineCreateModal` (`packages/client/src/components/InlineCreateModal.tsx`). It owns the
Dialog chrome, the Name field, zod validation, and form reset. Wire `onSubmit` to `useCreate*`
and call `onCreated?.(entity)` then `done()` in `onSuccess`.

```tsx
// packages/client/src/components/AddWidgetModal.tsx
import type { Widget } from "@eesimple/types";

import { InlineCreateModal } from "./InlineCreateModal";
import { useCreateWidget } from "../hooks/useWidgets";

interface AddWidgetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

Key contract: **do not** call `onOpenChange(false)` yourself — `done()` does that plus resets the
field. `AddCategoryModal` and `AddPropertyGroupModal` are working examples.

## Shape B — two text fields (Websites: domain + optional name)

`InlineCreateModal` is name-only; Websites need two fields. Build a small custom `Dialog` with
`useAppForm`, mirroring `AddWebsiteForm`'s zod schema but in a modal.

```tsx
// packages/client/src/components/AddWebsiteModal.tsx
import type { Website } from "@eesimple/types";

import { z } from "zod";

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useCreateWebsite } from "../hooks/useWebsites";
import { useAppForm } from "../lib/form";

const schema = z.object({
  domain: z.string().trim().min(1, "Domain is required"),
  siteName: z.string().trim(),
});

interface AddWebsiteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (website: Website) => void;
}

export function AddWebsiteModal({ open, onOpenChange, onCreated }: AddWebsiteModalProps) {
  const createWebsite = useCreateWebsite();
  const form = useAppForm({
    defaultValues: { domain: "", siteName: "" },
    validators: { onChange: schema },
    onSubmit: ({ value }) => {
      createWebsite.mutate(
        { domain: value.domain.trim(), siteName: value.siteName.trim() || undefined },
        {
          onSuccess: (website) => {
            onCreated?.(website);
            onOpenChange(false);
            form.reset();
          },
        },
      );
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New website</DialogTitle>
          <DialogDescription>
            Websites are normally created automatically from bookmark URLs — use this to add one
            by hand.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); void form.handleSubmit(); }}
        >
          <form.AppField name="domain">
            {field => <field.TextField label="Domain" placeholder="example.com" />}
          </form.AppField>
          <form.AppField name="siteName">
            {field => (
              <field.TextField label="Site name (optional)" placeholder="Defaults to the domain" />
            )}
          </form.AppField>
          {createWebsite.isError
            ? <p className="text-sm text-destructive">{createWebsite.error.message}</p>
            : null}
          <DialogFooter>
            <form.AppForm>
              <form.SubmitButton label="Add website" pendingLabel="Adding…" />
            </form.AppForm>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

## Shape C — name + type select (Custom Properties)

`CreateCustomPropertyInput` requires both `name` and `type: CustomPropertyType` (`number` /
`boolean` / `calculate` / `datetime` — there is **no** `text` default), so a name-only modal can't
create one. Build a 2-field Dialog with a Name text field and a type `<Select>`. Reuse
`TYPE_OPTIONS` from `packages/client/src/lib/propertyForm.ts` — it already lists all four types with
labels.

Use `useAppForm` with a zod schema validating `name: z.string().trim().min(1, "Name is required")`
and `type: z.enum(["number", "boolean", "calculate", "datetime"])` (default `"number"`). The
`<Select>` is controlled through `form.AppField name="type"` — read `field.state.value`, write
`field.handleChange`:

```tsx
<form.AppField name="type">
  {field => (
    <Select value={field.state.value} onValueChange={field.handleChange}>
      <SelectTrigger aria-label="Type"><SelectValue /></SelectTrigger>
      <SelectContent>
        {TYPE_OPTIONS.map(option => (
          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )}
</form.AppField>
```

In `onSubmit`, call `createCustomProperty.mutate({ name, type }, { onSuccess })`. Description copy:
"Pick a name and type — fill in the rest from its edit page."

## Manager-side pattern (same for all 7 entities)

The listing/manager component holds modal state, `useNavigate`, and the `onCreated` handler.
`useNavigate` from `@tanstack/react-router` works in any component, not just route components (see
`BookmarkForm`, `AutofillRuleGeneralForm`).

```tsx
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { AddWidgetModal } from "./AddWidgetModal";
import { Button } from "@/components/ui/button";

export function WidgetManager() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={() => setModalOpen(true)}>
          <Plus className="size-4" />
          New widget
        </Button>
      </div>

      {/* ...list rendering... */}

      <AddWidgetModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(widget) => {
          void navigate({
            to: "/widgets/$widgetSlug/edit/general",
            params: { widgetSlug: widget.slug },
          });
        }}
      />
    </section>
  );
}
```

## Entity-by-entity checklist

### 1. Media Types (issue #196) — Shape A

- Hook: `useCreateMediaType` (`hooks/useMediaTypes.ts`)
- Redirect: `/taxonomies/media-types/$mediaTypeSlug/edit/general`
- [ ] Create `AddMediaTypeModal.tsx` (title `"New media type"`, placeholder `"e.g. Newsletter"`,
  submit `"Add media type"`).
- [ ] Update `MediaTypesListing` (`MediaTypeManager.tsx`): add `useState`/`useNavigate`; replace
  `<AddMediaTypeForm />` with a header `Button`; render `<AddMediaTypeModal>` with `onCreated`.
- [ ] Remove the `AddMediaTypeForm` import (delete the file if unused elsewhere — grep first).

### 2. Tags (issue #197) — Shape A, special case: modal already exists, add redirect

`TagManager.tsx` already has a header Button and `<AddTagModal>`. `AddTagModal` wraps `TagForm`
directly (not `InlineCreateModal`) because tags have an optional parent-tag selector — keep that.

- [ ] Add `onCreated?: (tag: Tag) => void` prop to `AddTagModal.tsx` (import `Tag` from
  `@eesimple/types`).
- [ ] In the `createTag.mutate` `onSuccess` callback, call `onCreated?.(tag)` alongside
  `onOpenChange(false)`.
- [ ] In `TagManager.tsx`: add `useNavigate`; pass `onCreated` to `<AddTagModal>` navigating to
  `/tags/$tagSlug/edit/general`.

### 3. Categories (issue #198) — Shape A

`AddCategoryModal.tsx` already exists (Bookmark form combobox) — reuse unchanged.

- [ ] Update `CategoryManager.tsx`: add `useState`/`useNavigate`; remove `<AddCategoryForm />` and
  its import; add header `Button`; render `<AddCategoryModal>` with `onCreated` navigating to
  `/categories/$categorySlug/edit/general`.
- [ ] If `routes/categories.index.tsx` renders `<AddCategoryForm />` directly, remove it there too
  (rely on `<CategoryManager>`).

### 4. Custom Properties (issue #199) — Shape C, special case: replaces a Link-to-/new page

`CustomPropertyManager.tsx` currently has `<Button asChild><Link to="/custom-properties/new">`.

- Hook: `useCreateCustomProperty` (`hooks/useCustomProperties.ts`)
- Redirect: `/custom-properties/$propertySlug/edit/general`
- [ ] Create `AddCustomPropertyModal.tsx` (Shape C — name + type select).
- [ ] Update `CustomPropertyManager.tsx`: replace the `Link` button with a `Button` opening the
  modal; add `useState`/`useNavigate`/`<AddCustomPropertyModal>` with `onCreated`.
- [ ] Remove the `Link` import if no longer used here. The `/custom-properties/new` route and its
  full `PropertyForm` can stay for other uses.

### 5. Websites (issue #200) — Shape B

- Redirect: `/taxonomies/websites/$websiteSlug/edit/general`
- [ ] Create `AddWebsiteModal.tsx` (Shape B — domain + optional name).
- [ ] Update `WebsitesListing` (`WebsiteManager.tsx`): add `useState`/`useNavigate`; remove
  `<AddWebsiteForm />`; add header `Button` + `<Plus>` above the search input; render
  `<AddWebsiteModal>` with `onCreated`.
- [ ] Remove the `AddWebsiteForm` import (delete the file if unused elsewhere).

### 6. Property Groups (issue #201) — Shape A

`AddPropertyGroupModal.tsx` already exists (property form combobox) — reuse unchanged.

- [ ] Update `PropertyGroupsListing` (`PropertyGroupManager.tsx`): add `useState`/`useNavigate`;
  remove `<AddPropertyGroupForm />`; add header `Button`; render `<AddPropertyGroupModal>` with
  `onCreated` navigating to `/taxonomies/property-groups/$propertyGroupSlug/edit/general`.

### 7. Autofill Rules (issue #202) — Shape A, special case: currently opens the panel

`AutofillRulesToolbar` calls `openAutofill(NEW_SENTINEL)` (right-hand panel). Replace with a modal.
`CreateAutofillRuleInput` requires `conditions: ConditionTree` — default to `emptyConditionTree()`
(exported from `@eesimple/types`).

```tsx
// packages/client/src/components/AddAutofillRuleModal.tsx
import type { AutofillRule } from "@eesimple/types";

import { emptyConditionTree } from "@eesimple/types";

import { InlineCreateModal } from "./InlineCreateModal";
import { useCreateAutofillRule } from "../hooks/useAutofill";

interface AddAutofillRuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (rule: AutofillRule) => void;
}

export function AddAutofillRuleModal({ open, onOpenChange, onCreated }: AddAutofillRuleModalProps) {
  const createRule = useCreateAutofillRule();
  return (
    <InlineCreateModal
      open={open}
      onOpenChange={onOpenChange}
      title="New autofill rule"
      description="Give the rule a name — set its conditions and actions from the edit page."
      placeholder="e.g. GitHub Recipes"
      submitLabel="Add rule"
      isError={createRule.isError}
      errorMessage={createRule.error?.message}
      onSubmit={(name, done) => {
        createRule.mutate({ name, conditions: emptyConditionTree() }, {
          onSuccess: (rule) => { onCreated?.(rule); done(); },
        });
      }}
    />
  );
}
```

- [ ] Create `AddAutofillRuleModal.tsx` as above.
- [ ] Update `AutofillRulesToolbar.tsx`: remove the `usePanelControls` / `openAutofill` /
  `NEW_SENTINEL` imports; add an `onNew: () => void` prop and call it from the button's `onClick`.
- [ ] Update `AutofillRulesList.tsx`: add `useState`/`useNavigate`; pass
  `onNew={() => setModalOpen(true)}` to `<AutofillRulesToolbar>`; render `<AddAutofillRuleModal>`
  with `onCreated` navigating to `/autofill/$ruleSlug/edit/general`.

The panel-based create path stays intact for other surfaces that still open rules in the panel.

## Verify

For each entity after implementing:

1. Navigate to the entity listing page; confirm a "New X" button in the header (no inline form
   above the list).
2. Click it — the modal opens. Submit — the modal closes and the browser navigates to
   `…/$entitySlug/edit/general`. Navigate back; the new entity is in the listing.
3. Tags: the parent-tag selector still appears in the modal.
4. Websites: both Domain and Site Name fields appear; Site Name is optional.
5. Custom Properties: the type selector shows all four types; the created property opens on its
   edit page.
6. Autofill Rules: the "New Autofill Rule" button no longer opens the right-hand panel.

```
pnpm typecheck
pnpm lint:fix   # always from repo root
```
