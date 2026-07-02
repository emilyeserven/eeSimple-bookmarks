---
name: combobox-new-entity-creation
description: >-
  Wire inline entity creation into every <Combobox>, <MultiCombobox>, or <TreeMultiCombobox> that
  picks a user-creatable entity in eeSimple Bookmarks. Use when asked to "add createOption to a
  combobox", "let users create X inline from a picker", "wire Add*Modal to a combobox", when adding
  a new entity-picking field to a form, or when checking whether a combobox needs createOption.
  Authoritative checklist of which pickers must have createOption and which are exempt.
---

# Combobox inline entity creation

## The rule

**Every combobox that picks a user-creatable taxonomy/entity value MUST allow creation.** Every
`<Combobox>`, `<MultiCombobox>`, or `<TreeMultiCombobox>` that lets the user pick one of Category,
Media Type, Website, YouTube Channel, Tag, Author, Publisher, Newsletter, Property Group, Location,
Custom Property, or Place Type MUST pass a `createOption` prop wired through
`useEntityCreateOption` (below). There is no exception for "simple" or "small" forms, and no
picker is exempt except the closed list under **Explicit exemptions** — anything not on that list
is a defect: either add `createOption`, or if the entity kind isn't in `CREATABLE_ENTITY_PICKERS`
yet, register it there first (one entry — see **Wiring pattern**).

```tsx
const categoryCreate = useEntityCreateOption("category", category => setValue(category.id));

<Combobox
  options={categoryOptions}
  value={value}
  onValueChange={setValue}
  createOption={categoryCreate.createOption}
/>
{categoryCreate.modal}
```

---

## Entity → modal map

| Entity | Modal | Notes |
|--------|-------|-------|
| Category | `AddCategoryModal` | Uses `InlineCreateModal`; name only |
| Media Type | `AddMediaTypeModal` | Uses `InlineCreateModal`; name only; optional `defaultParentId` |
| Tag | `AddTagModal` / `TagPickerWithCreate` | Full `TagForm` (supports parent); use `TagPickerWithCreate` wrapper in most contexts |
| Location | `AddLocationModal` / `LocationPickerWithCreate` | Full `LocationForm` (supports ancestor chain); use `LocationPickerWithCreate` wrapper in most contexts |
| Author | `AddAuthorModal` | Uses `InlineCreateModal`; name only |
| Publisher | `AddPublisherModal` | Uses `InlineCreateModal`; name only |
| Property Group | `AddPropertyGroupModal` | Uses `InlineCreateModal`; name only |
| Place Type | `AddPlaceTypeModal` | Uses `InlineCreateModal`; name only |
| Website | `AddWebsiteModal` | Custom dialog — takes domain + optional name (NOT `InlineCreateModal`) |
| YouTube Channel | `AddYouTubeChannelModal` | Custom dialog — takes channelUrl + name (NOT `InlineCreateModal`) |
| Newsletter | `AddNewsletterModal` | Uses `InlineCreateModal`; name only |

---

## Wiring pattern

**`useEntityCreateOption`** (`components/useEntityCreateOption.tsx`) is the *only* sanctioned way to
wire inline create — the registry-backed hook owns the modal state and label, so a picker wired
through it cannot lack inline create or drift from the entity's modal:

```tsx
const tagCreate = useEntityCreateOption("tag", tag => onToggle(tag.id));

<TreeMultiCombobox
  options={tagOptions}
  values={tagIds}
  onValuesChange={setTagIds}
  createOption={tagCreate.createOption}
/>
{tagCreate.modal}
```

`CREATABLE_ENTITY_PICKERS` registers all twelve user-creatable entity kinds (`tag`, `author`,
`place-type`, `category`, `media-type`, `website`, `youtube-channel`, `publisher`, `newsletter`,
`property-group`, `location`, `custom-property`) — growing it further is one entry (all Add-modals
share the `open`/`onOpenChange`/`onCreated` contract). Call `useEntityCreateOption` **in the
component that owns the combobox and its `onCreated` selection logic**, not lifted into a parent
just to centralize modal state — see `BookmarkAdvancedCategoryField.tsx` /
`BookmarkAdvancedMediaTypeField.tsx` / `BookmarkAdvancedPublisherField.tsx` for the pattern (each
calls the hook itself using the `form` prop it already has, no state threaded from the parent).

**Never hand-roll `useState(false)` + `<Add*Modal>` JSX for an entity already in the registry** —
that's exactly the boilerplate the hook exists to remove. A hand-rolled picker for a registered
entity kind is a regression, not a stylistic choice.

**Multiple modals in one component that must stay manual** (an entity kind genuinely not yet in
the registry): group the `useState` flags into a sub-hook if adding them would push the component
past fallow's complexity cap — see `useBookmarkInlineCreateModals.ts` for the bookmark form's
Tag/Author example (the only entities still wired this way; every other kind goes through the hook).

---

## Where it is already wired (do not duplicate)

All of the following go through `useEntityCreateOption`; components/hooks not named here for a
given entity don't need their own inline-create — reuse the shared wrapper where one exists
(`TagPickerWithCreate`, `LocationPickerWithCreate`).

- **Bookmark Advanced section** — category, media type, publisher, author
  (`BookmarkAdvancedCategoryField`, `BookmarkAdvancedMediaTypeField`,
  `BookmarkAdvancedPublisherField`, `BookmarkAdvancedSection` for author)
- **Bookmark General (edit) form** — category (`BookmarkCategoryField`), media type + location
  (`BookmarkGeneralRelationsSection`), publisher (`useBookmarkGeneralForm` +
  `BookmarkAdvancedPublisherField`); tag/author stay manual via `useBookmarkInlineCreateModals`
- **Import item advanced edit** — category, media type, publisher, location
  (`useImportItemAdvancedEdit`, consumed by `ImportItemAdvancedEditFields`/`Modals`); tag/author
  stay manual
- **Import form** — category, newsletter (`ImportForm`, inline `createOption` on the comboboxes)
- **Condition editors** — category (`CategoryConditionEditor`), media type
  (`MediaTypeConditionEditor`), YouTube channel (`YouTubeChannelConditionEditor`) all select the
  newly created entity into the condition's id array; location
  (`LocationConditionEditor`) inherits create-and-select for free via `LocationPickerWithCreate`;
  website (`WebsiteConditionEditor`) matches the created website's `domain` into the condition's
  `domains` array — the one condition editor that selects by domain string rather than id.
- **Source default fields** — category, media type (`SourceDefaultFields`) — inline-create updates
  the picker's local display state only, intentionally not persisting (matches the field's
  "display state, persist on real selection" contract)
- **Tag pickers** — `TagPickerWithCreate`, `DefaultTagsField`, `RuleTagsField`
- **Location pickers** — `LocationPickerWithCreate` (used by `BookmarkGeneralRelationsSection`,
  `AutofillRulePrefillPickers`, `LocationConditionEditor`, `ImportItemAdvancedEdit`)
- **Publisher general form** — website (`usePublisherGeneralForm` + `PublisherGeneralForm`)
- **Property display section** — property group (`PropertyDisplaySection`)
- **Autofill prefill pickers** — category, media type (`AutofillRulePrefillPickers`)
- **Inbox pre-fill box** — category, media type, publisher (`InboxPreFillBox`); author stays manual
  via the remaining `AddAuthorModal` in `InboxPreFillModals`
- **Channel websites field** — website (`ChannelWebsitesField`)
- **Website channels field** — YouTube channel (`WebsiteYouTubeChannelsField`)

---

## Explicit exemptions (do NOT add createOption) — closed list

Only these are exempt. Anything else missing `createOption` is a defect, not a judgment call:

- `MarkAsShortenerDialog` website picker — a *reassign-to-existing* flow ("which existing site
  owns this shortener domain"), not an entity-minting context.
- `LevelGroupEditRow` place-types picker — options are the *discovered* place-type keys present on
  locations, not the Place Type CRUD entity; minting a row there would not add a discovered key.
- **Choices property value pickers** (`InboxPreFillBox.InboxPropertyField`, `BookmarkCustomFields`) —
  select from a fixed `choices` list defined on the property; users can't add new choice values from
  here.
- **Filter facet comboboxes** (`FilterSidebarSections`, `FilterFacetControls`,
  `CustomPropertyFilters`) — read-only filtering, never entity creation.
- **`BookmarkRelationshipsEditor`** — the bookmark and relationship-type comboboxes select from
  existing records; creating a bookmark from the relationships editor is out of scope.
- **`PinManager`** — pins existing entities to the sidebar; doesn't create.
- **`CardDisplayRuleInspector`** — debug/inspect selector for bookmarks; read-only.
- **CMD+K quick-create** (`commandPaletteModals.tsx`, `useCommandPaletteState`) — a separate
  quick-create mechanism, not a combobox `createOption` site.
- **Listing-page "New X" header buttons** — the page-level create action, not an inline picker
  affordance; see the `listing-header-create` skill instead.

---

## Adding a new entity: what to update

When you add a new slug-routed entity (see the `add-entity` skill), check every combobox that picks
that entity type and add `createOption`. Also check the condition editors if the entity is a
condition leaf — see the `add-condition-type` skill.

## See also

- **`inline-create-modal`** — how to build a new `Add*Modal` wrapper (when one doesn't exist yet)
- **`add-entity`** — full end-to-end checklist for adding a new entity type
- **`add-condition-type`** — wiring inline create in condition editor multi-selects
