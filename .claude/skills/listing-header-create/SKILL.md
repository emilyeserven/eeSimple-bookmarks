---
name: listing-header-create
description: >-
  Add or update the "New X" create button for a listing page in eeSimple Bookmarks. The button
  lives in the AppHeader toolbar (to the left of the Right Drawer Toggle / PanelRight button),
  rendered as a Plus icon. Use when asked to "add a create button to a listing page", "wire up the
  + button for X", "move the New X button to the header", "implement create for X", or "add a
  New X button". Covers any slug-routed or taxonomy entity listing page.
---

# Listing-page create button — AppHeader convention

Every entity listing page that supports creation follows a single pattern:

1. The listing page registers a **`createAction`** callback via `useSetListingPage` (5th argument).
2. The AppHeader renders a **Plus icon button** (`key: "create"`) left of the PanelRight toggle
   whenever `listingPage.createAction` is set — no per-page header changes needed.
3. Clicking the Plus opens a **minimal modal** — name-only for most entities; extra required fields
   for Websites (domain) and Custom Properties (type); URL + name for YouTube Channels.
4. On success the modal closes and the app **navigates to the created entity's `edit/general` tab**
   (autofill rules go to `edit/conditions`).

## Where the state lives

| Situation | Register `createAction` in… | Modal state lives in… |
|---|---|---|
| Route owns the button (Categories, Tags, Media Types, Property Groups, Autofill) | The route component, passing `() => setModalOpen(true)` | The route component |
| Component calls `useSetListingPage` itself (Websites, Custom Properties, YouTube Channels) | The manager/listing component, passing `() => setModalOpen(true)` | The manager/listing component |

## `useSetListingPage` signature

```ts
// packages/client/src/hooks/useListingPage.ts
useSetListingPage(
  key: string,         // stable page key (see pageKey table below)
  showsImages?: boolean,
  hasFilters?: boolean,
  showsCards?: boolean,
  createAction?: () => void,  // ← new 5th argument
)
```

The hook uses a **ref pattern** internally so callers can pass an inline arrow function safely
(no `useCallback` required, no re-registration on every render).

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

## Shape B — two text fields (Websites: domain + optional name; YouTube Channels: URL + name)

`InlineCreateModal` is name-only; these entities need two fields. Build a small custom `Dialog`
with `useAppForm`. See `AddWebsiteModal` and `AddYouTubeChannelModal` for working examples.

```tsx
// packages/client/src/components/AddWidgetModal.tsx
import type { Widget } from "@eesimple/types";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCreateWidget } from "../hooks/useWidgets";
import { useAppForm } from "../lib/form";

const schema = z.object({
  url: z.string().trim().min(1, "URL is required"),
  name: z.string().trim().min(1, "Name is required"),
});

export function AddWidgetModal({ open, onOpenChange, onCreated }) {
  const createWidget = useCreateWidget();
  const form = useAppForm({
    defaultValues: { url: "", name: "" },
    validators: { onChange: schema },
    onSubmit: ({ value }) => {
      createWidget.mutate({ url: value.url, name: value.name }, {
        onSuccess: (widget) => { onCreated?.(widget); onOpenChange(false); form.reset(); },
      });
    },
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New widget</DialogTitle>
          <DialogDescription>Description here.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); void form.handleSubmit(); }}>
          <form.AppField name="url">{field => <field.TextField label="URL" placeholder="https://…" />}</form.AppField>
          <form.AppField name="name">{field => <field.TextField label="Name" placeholder="e.g. My Widget" />}</form.AppField>
          {createWidget.isError ? <p className="text-sm text-destructive">{createWidget.error.message}</p> : null}
          <DialogFooter>
            <form.AppForm><form.SubmitButton label="Add widget" pendingLabel="Adding…" /></form.AppForm>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

## Shape C — name + type select (Custom Properties)

`CreateCustomPropertyInput` requires both `name` and `type: CustomPropertyType`. Reuse
`TYPE_OPTIONS` from `packages/client/src/lib/propertyForm.ts`. See `AddCustomPropertyModal` for
the working implementation.

## Wiring the create button (route-owned modal state)

```tsx
// In the route component (e.g. categories.index.tsx, tags.index.tsx)
const [modalOpen, setModalOpen] = useState(false);
const navigate = useNavigate();
useSetListingPage("widgets-listing", false, false, false, () => setModalOpen(true));

return (
  <section className="space-y-6">
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold">Widgets</h1>
        {widgets ? <Badge variant="secondary">{widgets.length}</Badge> : null}
      </div>
      <p className="text-sm text-muted-foreground">Description…</p>
    </div>

    <WidgetListing />

    <AddWidgetModal
      open={modalOpen}
      onOpenChange={setModalOpen}
      onCreated={(widget) => {
        void navigate({ to: "/widgets/$widgetSlug/edit/general", params: { widgetSlug: widget.slug } });
      }}
    />
  </section>
);
```

Note: **no inline Button in the section header** — the Plus button lives entirely in AppHeader.

## Wiring the create button (component-owned modal state)

When the manager/listing component already calls `useSetListingPage` (Websites, Custom Properties,
YouTube Channels), add the `createAction` there:

```tsx
export function WidgetsListing() {
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  useSetListingPage("widgets-listing", false, false, false, () => setModalOpen(true));
  // ...

  return (
    <div className="space-y-4">
      {/* listing content — no button here */}
      <AddWidgetModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(widget) => {
          void navigate({ to: "/widgets/$widgetSlug/edit/general", params: { widgetSlug: widget.slug } });
        }}
      />
    </div>
  );
}
```

## Stable `pageKey` values

| Page | `pageKey` |
|---|---|
| Categories | `"categories-listing"` |
| Websites | `"websites-listing"` |
| Media Types | `"media-types-listing"` |
| YouTube Channels | `"youtube-channels-listing"` |
| Tags | `"tags-listing"` |
| Custom Properties | `"custom-properties-listing"` |
| Property Groups | `"property-groups-listing"` |
| Autofill Rules | `"autofill-rules-listing"` |

## Autofill special case

Autofill rules use `useNewAutofillRule()` which has hybrid behavior (modifier key → open panel
instead of modal). Pass `newRule.openModal` (not `newRule.onClick`) as the `createAction`:

```ts
const newRule = useNewAutofillRule();
useSetListingPage("autofill-rules-listing", false, false, false, newRule.openModal);
```

Then render `{newRule.modal}` in the route's JSX. The panel-based create path still works for
scoped views (category/website/etc. detail tabs use `newRule.onClick` directly).

## Sibling pattern: "New child" button on hierarchy *detail* pages

The same Plus-left-of-the-PanelRight-toggle slot is also used on the **detail** pages of
parent/child-tree taxonomies (currently **Tags** and **Media Types** — the ones with a Hierarchy
tab) to quick-create a **child of the current entity**, with the parent **fixed** to it. This is a
separate mechanism from the listing `createAction` above — it does **not** go through
`useSetListingPage`. Instead, `-appHeader.tsx` derives the current detail entity from the path (it
already resolves `tagAncestors` and `mediaType`) and renders `components/AddChildButton.tsx`
directly, just before the `open-panel` toolbar action. Detail pages aren't listing pages, so the
two Plus buttons are mutually exclusive.

- `AddChildButton` (`{ kind: "tag" | "mediaType"; parentId: string | undefined }`) owns its own
  modal state, disables the button until `parentId` resolves, and on success navigates to the new
  child's `edit/general`.
- It reuses the existing modals in name-only mode with a fixed parent: `AddTagModal` with
  `showParent={false}` + `defaultParentId`, and `AddMediaTypeModal` with `defaultParentId`. Both
  `CreateTagInput` / `CreateMediaTypeInput` already accept `parentId`. `TagForm` honors
  `defaultParentId` when `showParent` is false.
- **To extend to another hierarchy taxonomy:** give its create modal a `defaultParentId` pass-through,
  add a `kind` to `AddChildButton`, and add a detail-page branch in `-appHeader.tsx` that supplies
  the resolved current-entity id as `parentId`.

## Verify

For each entity after implementing:

1. Navigate to the entity listing page — a Plus icon button appears in the AppHeader, left of the
   PanelRight toggle. No "New X" button in the page body.
2. Click `+` — the modal opens.
3. Submit — modal closes, browser navigates to `…/$entitySlug/edit/general`.
4. Navigate back — new entity is in the listing.
5. Tags: parent-tag selector still appears.
6. Websites: Domain and Site Name fields both appear; Site Name is optional.
7. Custom Properties: type selector shows all four types.
8. YouTube Channels: Channel URL and Name fields both appear.
9. Autofill Rules: navigates to `edit/conditions` (not `edit/general`).
10. Tags / Media Types detail pages (e.g. `/tags/<slug>/general`): a Plus button appears left of the
    PanelRight toggle, opens a name-only modal, and the created entity is a child of the current one
    (not duplicated on the listing pages, absent on non-hierarchy detail pages).

```
pnpm typecheck
pnpm lint:fix   # always from repo root
```
