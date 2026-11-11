---
name: toast-notifications
description: >-
  Fire standardized success/error toasts in this repo that are also recorded in the persistent
  Notifications log (`notificationStore`), and follow the per-field auto-save convention for edit
  surfaces. Use when asked to "fire a toast when X is saved", "show an error toast", "wire a
  mutation with notifications", "drop the Save button in favor of auto-save", "toast which field
  was saved", "record toasts / show a notifications history", or "use the standard toast helper".
  Covers `notifySuccess`/`notifyError` (`lib/notifications.ts`), `notifyFieldSaved`/
  `notifyFieldSaveError` (`lib/autoSave.ts`), `describeError`, the wording standards, and testing
  through `test-utils/toastSpies.ts`. Reference: `ItemsManager`'s on-blur description save.
---

# Standardized toast / notification wiring

Toasts never go through raw `toast.*` from `sonner`. Three thin layers, top to bottom:

| Layer | File | Use it for |
|---|---|---|
| **Field auto-save wording** | `packages/client/src/lib/autoSave.ts` | `notifyFieldSaved(label)` → "Updated <label>"; `notifyFieldSaveError(label, cause?)` → "Couldn't save <label>: <cause>". The label is translated as its own key. |
| **Toast + record** | `packages/client/src/lib/notifications.ts` | `notifySuccess(msg, opts?)` / `notifyError(msg, opts?)` — fire a sonner toast **and** append a record to the Notifications log. Any user-meaningful create/save/delete. |
| **The log** | `packages/client/src/stores/notificationStore.ts` | A persisted zustand store (`app-notifications` in localStorage), newest first, capped at 100, with `unreadCount` / `markAllSeen` / `clearNotifications`. Each record carries `{ type, message, timestamp, link?, page? }`. |

Facts worth knowing:

- `notifySuccess`/`notifyError` are **safe outside React** (mutation `onSuccess`/`onError`): they
  write via `useNotificationStore.getState()`.
- Each record is stamped with the page it came from via `lib/notificationPage.ts`
  (`getCurrentNotificationPage()`, fed by the root layout on navigation; falls back to a
  title-cased pathname label).
- `NotifyOptions.link` (`{ label, href }`) becomes the toast's action button **and** survives into
  the persisted log. Prefer it over a raw sonner `action` when the action just opens a URL — an
  `action.onClick` doesn't serialize.
- The `<Toaster />` is mounted once in `routes/-rootLayout.tsx`. Don't add another.
- The starter ships the store but **no log viewer UI**. If you add one (e.g. a header bell popover),
  read `notifications` / `unreadCount` from the store and call `markAllSeen()` when it opens.

## Wording standards

- **Name the thing.** `Created "<name>"`, `Deleted item`, `Updated Description` — never a bare
  "Saved". The log entry must make sense on its own, hours later.
- **Errors carry the real reason.** Pass the caught error through `describeError(err)`
  (`lib/apiError.ts`), which returns the server's `message` (the middleware writes it for humans) or a
  fallback. Never toast a
  generic "Something went wrong" when a cause is available. See the `api-errors` skill.
- **Field toasts go through `lib/autoSave.ts`** — pass a plain field label to `notifyFieldSaved`;
  don't hand-write `notifySuccess(\`Updated …\`)` at a call site.
- **One toast per save.** Never toast in both the hook and the call site.

## Wire a mutation's toasts

**Prefer toasting inside the mutation hook**, so a bare `.mutate()` can never be silent. Reference:
`packages/client/src/hooks/useItems.ts`:

```ts
export function useCreateItem() {
  const invalidate = useItemsInvalidation();
  return useMutation({
    mutationFn: (input: CreateItemInput) => itemsApi.create(input),
    onSuccess: (item) => {
      void invalidate();
      notifySuccess(`Created "${item.name}"`);
    },
    onError: err => notifyError(describeError(err)),
  });
}
```

The exception is a **generic update** hook (`useUpdateItem`) that several fields share: it stays
toast-free and each call site passes field-named callbacks (next section), because only the call
site knows which field changed. See the `client-data-hooks` skill for the hook conventions.

## Per-field auto-save (the edit-surface convention)

Edit surfaces have **no Save button**. Each field persists on its own trigger and fires a toast that
**names the field**. Reference: `ItemRow` in `packages/client/src/routes/items/-components/ItemsManager.tsx`:

```tsx
const saveDescription = (value: string) => {
  const description = value.trim() || null;
  if (description === item.description) return; // no-op skip
  update.mutate({ id: item.id, input: { description } }, {
    onSuccess: () => notifyFieldSaved("Description"),
    onError: err => notifyFieldSaveError("Description", describeError(err)),
  });
};

<Textarea defaultValue={item.description ?? ""} onBlur={e => saveDescription(e.target.value)} />
```

Rules (decide once, apply everywhere):

- **Trigger:** text/textarea save **on blur**; toggles, selects, checkboxes, comboboxes save **on
  change**.
- **Single-field PATCH:** send only the changed key (`input: { description }`).
- **Skip no-ops:** compare against the last saved value (deep-equal for arrays/objects) and don't
  fire a request — or a toast — when nothing changed.
- **Skip invalid values:** keep TanStack Form + the zod schema for field state/errors, but drop the
  `<form onSubmit>` wrapper and submit button; only call save when the field has no errors.
- **On failure/invalid, keep the user's input** — never revert. The field-named error toast plus the
  inline field error are the feedback; the next blur/change retries.
- **Multi-key sections** that must change together: one `mutate` carrying both keys and **one**
  `notifyFieldSaved("<Section>")` toast.
- **A name/slug field** that changes the URL: navigate to the new slug in the save's `onSuccess`
  (the on-blur trigger keeps that from firing mid-typing).
- When several fields repeat this shape, collapse it into one parametrized `saveField(key, value,
  label)` helper or hook rather than N copies (see the `decompose-over-cap` skill).

**Exceptions that keep an explicit submit:** create flows (the `CreateItemForm` in `ItemsManager`,
create pages, inline-create dialogs) and any multi-part change that can't be expressed as one field.
**Device-local view prefs** in `stores/uiStore.ts` (theme, collapsed panels, sizes) apply instantly
with **no toast** — nothing persisted server-side. A setting that must sync across devices belongs
server-side, and once it's server-persisted it **does** toast on save like any other write.
Misclassifying a should-persist setting as a local pref is how a settings page ships toast-less and
non-syncing.

## Testing toasts

- Mock the toast stack **only** through `packages/client/src/test-utils/toastSpies.ts`, at the
  `lib/notifications` layer:
  ```ts
  import { notifyError, notifySuccess } from "../test-utils/toastSpies";

  vi.mock("../lib/notifications", async () => await import("../test-utils/toastSpies"));
  // …
  expect(notifySuccess).toHaveBeenCalledWith("Updated Description");
  ```
  This keeps `lib/autoSave`'s real wording under test. Never `vi.mock` `lib/autoSave` or `sonner`
  directly (only tests *of* the toast layer itself mock sonner — see `lib/notifications.test.ts`).
  Reset with `resetToastSpies()` in `beforeEach`.
- When a test only needs "a toast fired and was recorded", assert on the real
  `useNotificationStore.getState().notifications` instead — a mock-free file runs in the faster
  non-isolated Vitest project. The store is reset between files by `test-utils/resetStores.ts`.
- See the `test-structure` skill for the full harness.
