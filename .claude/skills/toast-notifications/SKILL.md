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

## Add a new entry point to the Notifications panel (rarely needed)

The panel content type `"notifications"` is already registered: it lives in the `DrawerContentType`
union + `DRAWER_CONTENT_TYPES` (`packages/client/src/lib/drawerSearch.ts`), is special-cased in
`PanelContent.tsx` and `PanelBreadcrumbs.tsx` (it has no per-item view/edit, so it isn't in the
`PANEL_CONTENT_TYPES` registry), and has its own tile in `PanelTypeTiles.tsx`. To open it
imperatively from elsewhere, call `usePanelControls().openType("notifications")`.
