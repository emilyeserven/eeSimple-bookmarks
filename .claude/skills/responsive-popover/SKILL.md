---
name: responsive-popover
description: >-
  Add or change an app-header / toolbar popover control in eeSimple Bookmarks so it becomes a modal
  on small screens, backed by the shared `ResponsivePopover` primitive with extracted shared content,
  and register it in the header More menu. Use when asked to "add a header control/popover", "add a
  toolbar button to the app header", "make a popover work on mobile", "add a control to the More
  menu", or "turn a popover into a modal on small screens". Mirrors
  DisplayOptionsPopover / BookmarkDetailLayoutPopover / HeaderPinButton.
---

# Responsive popover (popover → modal on small screens)

The top app header is responsive (issue: header-responsive-design). On wide screens it shows the
inline breadcrumb trail + a row of toolbar icons; on small screens (`<md`, 768px — `useIsMobile()`)
the breadcrumbs stack and **every collapsible toolbar action folds into one
"More" menu** with icon + label rows. Any header popover control must therefore work as a **popover
on desktop and a modal `Dialog` on mobile**, sharing one body — never two copies that drift.

The pieces (all under `packages/client/src/`):

- **`components/ui/responsive-popover.tsx`** — `ResponsivePopover`: a Popover on `>=md`, a `Dialog` on
  `<md`. Props: `trigger?` (omit for a controlled, trigger-less surface), `title` (heading on
  desktop, required `DialogTitle` on mobile), `description?`, `open?`/`onOpenChange?` (controlled),
  `align?`, `contentClassName?`.
- **`components/header/toolbarActions.tsx`** — `buildToolbarActions(ctx)` returns the canonical,
  ordered `ToolbarAction[]`. The array order **is** the button order, applied to both the desktop row
  and the More menu. `ToolbarAction = { key; desktop; mobile }` where `mobile` is a discriminated
  union: `menuItem` (a self-contained `DropdownMenuItem`), `modal` (`{ icon, label, disabled?,
  renderModal }`), or `standalone` (never collapses into the More menu).
- **`components/header/HeaderToolbar.tsx`** — `HeaderToolbar` (desktop row vs mobile More menu) and
  the internal `HeaderMoreMenu`, which renders each `modal` control as a **sibling of the dropdown**
  keyed off `activeModal` so the modal survives the dropdown closing.
- **`components/header/headerMenuItems.tsx`** — small all-component menu-item helpers
  (`SearchControls`, `FavoriteMenuItem`, `PinMenuItem`). Stateful toggles live here so their hooks
  stay out of the builder.

## Add / convert a popover control

1. **Extract the body into a `*Controls.tsx` content component** (the single source of truth) — e.g.
   `ListingDisplayControls`, `BookmarkDetailLayoutControls`. It owns its own settings/mutation hooks.
   Don't inline body markup into a popover that also needs a mobile modal.
2. **Wrap it with `ResponsivePopover`** in the desktop control component, passing `trigger` (the icon
   `Button`), `title`, and the `*Controls` as children. Add optional `open`/`onOpenChange`
   passthrough. Reference: `DisplayOptionsPopover.tsx`. **Never** hand-roll a `useIsMobile()` +
   Popover/Dialog branch — reuse the primitive.
3. **Register it in `buildToolbarActions`** (`toolbarActions.tsx`) in the right ordinal position:
   - `desktop:` the popover/button node.
   - `mobile:` `{ kind: "modal", icon, label, renderModal: (open, onOpenChange) => (`
     `<ResponsivePopover title=… open={open} onOpenChange={onOpenChange}>` `<XControls/>` `</ResponsivePopover>) }`
     — note **no `trigger`** here (the More menu row is the trigger).
   - For a non-popover action (a link / one-shot button) use `mobile: { kind: "menuItem", node:
     <DropdownMenuItem …/> }` instead. For a stateful toggle, add a small component to
     `headerMenuItems.tsx` and reference it as the `node`.
   - A control that must never fold into the More menu uses `{ kind: "standalone" }`.
4. **Resolve any new context** the builder needs in `AppHeader` (`routes/-appHeader.tsx`) and pass it
   through the `ToolbarContext` object — keep the resolving hooks in `AppHeader`, not the builder.
5. **Add a `.stories.tsx`** for the new `*Controls` (and rely on `responsive-popover.stories.tsx` for
   the primitive). Add/extend tests like `HeaderToolbar.test.tsx` (modal survives the dropdown close).

## Rules

- One body, two presentations: the `*Controls` content renders in both the desktop popover and the
  mobile modal. If you find yourself duplicating the body, stop and extract.
- A `modal` control's open state is owned by `HeaderMoreMenu` (`activeModal`) and the modal is a
  **sibling** of the dropdown — do not nest a Popover/Dialog inside `DropdownMenuContent`.
- Stateful menu-item toggles (favorite/pin) reuse a shared hook (`useSettingsFavorite`,
  `usePinToggle`) so the desktop button and the menu item stay in sync — don't re-implement the
  toggle.
- Keep `ResponsivePopover` and each `*Controls` to one component per file's export rule
  (`react-refresh/only-export-components`): hooks and non-component helpers go in their own file
  (`hooks/use*.ts`), not alongside an exported component.

## When NOT to use it

- A full create page/route → `add-entity`. A name-only inline create dialog → `inline-create-modal`.
- Any control that must never collapse into the More menu → `{ kind: "standalone" }`.
