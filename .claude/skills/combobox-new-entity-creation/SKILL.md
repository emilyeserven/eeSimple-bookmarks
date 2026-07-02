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

Every `<Combobox>`, `<MultiCombobox>`, or `<TreeMultiCombobox>` that lets the user pick a
**user-creatable entity** MUST pass a `createOption` prop. There is no exception for "simple" or
"small" forms — the pattern is uniform across the app.

```tsx
createOption={{
  label: "Create category",
  onSelect: () => setAddCategoryOpen(true),
}}
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

**Preferred: `useEntityCreateOption`** (`components/useEntityCreateOption.tsx`) — the registry-backed
hook owns the modal state and label, so a picker wired through it cannot lack inline create or drift
from the entity's modal:

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

Growing the registry is one entry in `CREATABLE_ENTITY_PICKERS` (all Add-modals share the
`open`/`onOpenChange`/`onCreated` contract). Entities not yet in the registry use the manual
pattern below — migrate them into the registry as you touch them (tracked in the picker-migration
issue).

**Manual pattern** — the opener holds modal-open state and passes `onCreated` to select the new
entity:

```tsx
// 1. State (in the component that owns the combobox)
const [addCategoryOpen, setAddCategoryOpen] = useState(false);

// 2. On the combobox
<Combobox
  options={categoryOptions}
  value={value}
  onValueChange={setValue}
  createOption={{
    label: "Create category",
    onSelect: () => setAddCategoryOpen(true),
  }}
/>

// 3. Modal sibling (outside the combobox, inside the same fragment/parent)
<AddCategoryModal
  open={addCategoryOpen}
  onOpenChange={setAddCategoryOpen}
  onCreated={category => setValue(category.id)}   // single-select
  // onCreated={category => setValues(v => [...v, category.id])} // multi-select
/>
```

For `form.AppField` / `ComboboxField`, pass `createOption` directly and manage modal state in the
surrounding component or controller hook. See `BookmarkCategoryField.tsx` (receives
`addCategoryOpen`/`setAddCategoryOpen` from `useBookmarkInlineCreateModals`) and
`SourceDefaultFields.tsx` (manages its own state internally).

**Multiple modals in one component:** group the `useState` flags into a sub-hook if adding them
would push the component past fallow's complexity cap. See `useBookmarkInlineCreateModals.ts` for
the bookmark form's five-flag example.

---

## Where it is already wired (do not duplicate)

- **Bookmark General/Advanced form** — category, media type, tags, authors, publisher
  (`BookmarkCategoryField`, `BookmarkAdvancedMediaTypeField`, `BookmarkAdvancedCategoryField`,
  `BookmarkAdvancedDescriptionTagsField`, `BookmarkAdvancedPublisherField`, `BookmarkGeneralForm`)
- **Import item form** — category, media type, tags, authors, publisher (`ImportItemAdvancedEdit`)
- **Import form** — category, newsletter (`ImportForm`)
- **Condition editors** — category (`CategoryConditionEditor`), media type
  (`MediaTypeConditionEditor`), YouTube channel (`YouTubeChannelConditionEditor`), website
  (`WebsiteConditionEditor`)
- **Source default fields** — category, media type (`SourceDefaultFields`)
- **Tag pickers** — `TagPickerWithCreate`, `DefaultTagsField`, `RuleTagsField`
- **Publisher general form** — website (`PublisherGeneralForm`)
- **Property display section** — property group (`PropertyDisplaySection`)
- **Autofill prefill pickers** — category, media type (`AutofillRulePrefillPickers`)
- **Inbox pre-fill box** — category, media type, publisher, authors (`InboxPreFillBox`)
- **Channel websites field** — website (`ChannelWebsitesField`)
- **Website channels field** — YouTube channel (`WebsiteYouTubeChannelsField`)

---

## Explicit exemptions (do NOT add createOption)

- `MarkAsShortenerDialog` website picker — a *reassign-to-existing* flow ("which existing site
  owns this shortener domain"), not an entity-minting context.
- `LevelGroupEditRow` place-types picker — options are the *discovered* place-type keys present on
  locations, not the Place Type CRUD entity; minting a row there would not add a discovered key.

These comboboxes correctly omit `createOption` because they pick non-entity or non-creatable values:

- **Choices property value pickers** (`InboxPreFillBox.InboxPropertyField`, `BookmarkCustomFields`) —
  select from a fixed `choices` list defined on the property; users can't add new choice values from
  here.
- **Filter facet comboboxes** (`FilterSidebarSections`, `FilterFacetControls`,
  `CustomPropertyFilters`) — read-only filtering, never entity creation.
- **`BookmarkRelationshipsEditor`** — the bookmark and relationship-type comboboxes select from
  existing records; creating a bookmark from the relationships editor is out of scope.
- **`PinManager`** — pins existing entities to the sidebar; doesn't create.
- **`CardDisplayRuleInspector`** — debug/inspect selector for bookmarks; read-only.

---

## Adding a new entity: what to update

When you add a new slug-routed entity (see the `add-entity` skill), check every combobox that picks
that entity type and add `createOption`. Also check the condition editors if the entity is a
condition leaf — see the `add-condition-type` skill.

## See also

- **`inline-create-modal`** — how to build a new `Add*Modal` wrapper (when one doesn't exist yet)
- **`add-entity`** — full end-to-end checklist for adding a new entity type
- **`add-condition-type`** — wiring inline create in condition editor multi-selects
