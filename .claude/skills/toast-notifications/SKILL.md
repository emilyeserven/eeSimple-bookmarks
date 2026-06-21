---
name: toast-notifications
description: >-
  Wire a page in eeSimple Bookmarks with standardized success/error toasts that are also recorded in
  the right-panel Notifications log, and convert a Save-button page to debounced auto-save. Use when
  asked to "fire a toast when X is saved", "wire a page with success notifications", "drop the Save
  button in favor of auto-save", "record toasts / add a notifications history", or "use the standard
  toast helper". Mirrors how Settings > Homepage was wired.
---

# Standardized toast / notification wiring

Toasts in this app go through two thin pieces, not raw `toast.*`:

- **`notifySuccess(msg)` / `notifyError(msg)`** (`packages/client/src/lib/notifications.ts`) — fire a
  sonner toast **and** append a record to the persistent Notifications log. Use these for any
  user-meaningful save/create/delete. They're safe to call outside React (e.g. inside a mutation's
  `onSuccess`/`onError`) because they write via `useNotificationStore.getState()`.
- **The Notifications log** (`packages/client/src/stores/notificationStore.ts`, a persisted Zustand
  store) — surfaced in the right panel via `NotificationsPanel`
  (`packages/client/src/components/panel/NotificationsPanel.tsx`), reachable from the panel's
  "Notifications" tile. Records carry `{ type, message, timestamp }` and show newest-first with a
  formatted date/time. Capped at 100; "Clear all" empties it.

The `<Toaster />` is already mounted once in `routes/-rootLayout.tsx` — don't add another.

## Wire a page's saves

1. **Swap the toast calls.** In the page's data hooks (`packages/client/src/hooks/use*.ts`) replace
   `toast.success(...)` / `toast.error(...)` with `notifySuccess(...)` / `notifyError(...)`, importing
   from `../lib/notifications` and dropping the `import { toast } from "sonner"` line. Reference:
   `useHomepageSections.ts`.
2. **Reference the saved thing in the message.** Prefer "Section saved", "Homepage content saved",
   "<name> deleted" over a bare "Saved", so the log entry is self-explanatory.

## Convert Save buttons to debounced auto-save

Reference implementation: `packages/client/src/components/HomepageContentSettings.tsx`.

For a plain-`useState` settings form, replace the explicit Save button with a debounced auto-save:

```tsx
const AUTOSAVE_DELAY_MS = 800;

const [form, setForm] = useState(DEFAULTS);
const formRef = useRef(form);                 // always mirrors current form state
const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

// Seed by writing the ref DIRECTLY (not via setField) so loading data never schedules a save.
useEffect(() => { if (data) { formRef.current = data; setForm(data); } }, [data]);
useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

function scheduleAutoSave() {
  if (saveTimer.current) clearTimeout(saveTimer.current);
  saveTimer.current = setTimeout(() => {
    update.mutate(formRef.current, {
      onSuccess: () => notifySuccess("Homepage content saved"),
      onError: error => notifyError(error.message),
    });
  }, AUTOSAVE_DELAY_MS);
}

function setField<K extends keyof T>(key: K, value: T[K]) {
  const next = { ...formRef.current, [key]: value };
  formRef.current = next;        // ref for the debounced save
  setForm(next);                 // state for the render
  scheduleAutoSave();
}
```

Then route every field handler through `setField("field", value)` and **delete the Save `<Button>`s**
and the old `save()` function. Keep the `formRef` so the debounced callback reads the latest values
without being re-created on every keystroke.

Gotchas:
- **Seed via the ref, not `setField`** — otherwise the initial server load schedules a spurious save.
- Debounce is per-form (one shared timer), so rapid edits coalesce into one save.
- Mutations that drive `onSuccess`/`onError` toasts still go through `notify*`, not raw `toast`.

## Per-field auto-save (the edit-tab standard)

Slug-routed entity **edit tabs** do not use a Save button or the whole-form debounce above. Each
**field** persists on its own and fires a toast that **names the field**. The shared implementation
is two files — don't hand-roll the wording or the dirty-check:

- **`packages/client/src/lib/autoSave.ts`** — `notifyFieldSaved(label)` (→ `notifySuccess("Updated
  <label>")`) and `notifyFieldSaveError(label, cause?)` (→ `notifyError("Couldn't save <label>: …")`).
  Both still write to the Notifications log.
- **`packages/client/src/hooks/useFieldAutoSave.ts`** —
  `useFieldAutoSave<TInput, TEntity>({ id, update, labels, initial })` returns `{ saveField }`.
  `saveField(key, value, opts?)` fires a **single-field PATCH** `update.mutate({ id, input: { [key]:
  value } })`, **skips no-ops** (deep-equal vs the last saved value, so arrays/objects work) and
  **skips invalid** values (`opts.valid === false`), then toasts the named field; it advances its
  saved-snapshot only on success (a failed save retries on the next blur/change). `opts.onSuccess`
  receives the updated entity (use it to follow a slug rename).

Reference implementation: **`packages/client/src/components/CategoryGeneralForm.tsx`** (+ its test).
The recipe for an edit form:

```tsx
const autoSave = useFieldAutoSave<UpdateCategoryInput, Category>({
  id: category.id,
  update: useUpdateCategory(),
  labels: { name: "Name", description: "Description", icon: "Icon" },
  initial: { name: category.name, description: category.description ?? null, icon: category.icon },
});

// text/textarea → save on BLUR, gated by the field's own validity:
<field.TextField label="Name" onBlur={() => autoSave.saveField(
  "name", field.state.value.trim(),
  { valid: field.state.meta.errors.length === 0,
    onSuccess: u => { if (u.slug !== category.slug) navigate(/* to the new slug */); } },
)} />

// select / combobox / checkbox / icon-picker → save on CHANGE:
<field.SelectField label="Parent" options={…}
  onValueChange={v => autoSave.saveField("parentId", v === ROOT ? null : v)} />
```

Rules (decided once, applied everywhere):
- **Trigger:** text/textarea on **blur**; toggles/selects/checkboxes/comboboxes on **change**.
- **Validation:** keep `useAppForm` + the zod schema for field state/errors, but **delete** the
  `<form onSubmit>` wrapper and `<form.SubmitButton>` / `requireDirty` / manual `JSON.stringify`
  dirty checks. Pass `valid: field.state.meta.errors.length === 0` so invalid values don't save.
- **On failure/invalid:** keep the user's input (never revert); the error toast + the field's inline
  error are the feedback.
- **Multi-key sections** (e.g. `categoryIds` + `allCategories` toggle together): call
  `update.mutate({ id, input: { … both … } }, { onSuccess: () => notifyFieldSaved("Categories"), … })`
  directly so the user sees **one** section toast (see `PropertyCategoriesSection`).
- **Association/toggle tabs** that already mutate-on-toggle (e.g. `CategoryTieredTags`) just add the
  `notifyFieldSaved`/`notifyFieldSaveError` callbacks to their existing mutation.
- The `lib/form.tsx` field primitives already expose `onBlur` (text/number) and `onValueChange`
  (select/combobox) hooks — wire these, don't fork the primitives.

**Exceptions (keep a Save button):** create flows — create pages, the right-panel create form, and
inline-create modals — submit explicitly. **Local-only Zustand prefs** (Display/Sidebar/Automations
settings) stay instant with **no toast** (nothing persists server-side).

## Add a new entry point to the Notifications panel (rarely needed)

The panel content type `"notifications"` is already registered: it lives in the `DrawerContentType`
union + `DRAWER_CONTENT_TYPES` (`packages/client/src/lib/drawerSearch.ts`), is special-cased in
`PanelContent.tsx` and `PanelBreadcrumbs.tsx` (it has no per-item view/edit, so it isn't in the
`PANEL_CONTENT_TYPES` registry), and has its own tile in `PanelTypeTiles.tsx`. To open it
imperatively from elsewhere, call `usePanelControls().openType("notifications")`.
