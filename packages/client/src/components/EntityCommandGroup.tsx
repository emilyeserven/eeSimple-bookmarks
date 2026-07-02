import type {
  EntityChoiceOptions,
  MatchedEntityContext,
} from "./useEntityCommandContext";
import type { PinContext } from "@/components/HeaderPinButton";
import type { EntityChoiceField } from "@/lib/entityPaletteRegistry";
import type { PinnedSidebarEntityType } from "@eesimple/types";

import {
  ArrowLeftIcon,
  CheckIcon,
  EyeIcon,
  PencilIcon,
  PinIcon,
  PinOffIcon,
  PlusIcon,
} from "lucide-react";

import { CommandGroup, CommandItem } from "@/components/ui/command";
import { usePinToggle } from "@/hooks/usePinToggle";

/** The `EntityRouteKind`s that map 1:1 onto a pinnable sidebar entity type. */
const PINNABLE_KINDS: ReadonlySet<string> = new Set([
  "category",
  "tag",
  "website",
  "media-type",
  "youtube-channel",
  "saved-filter",
  "location",
] satisfies PinnedSidebarEntityType[]);

/** Pin/unpin the matched entity — the palette twin of the header pin button (`pinAction`). */
function PinCommandItem({
  context,
  onDone,
}: {
  context: PinContext;
  onDone: () => void;
}) {
  const {
    isPinned, name, toggle,
  } = usePinToggle(context);
  const label = isPinned ? `Unpin ${name}` : `Pin ${name}`;
  return (
    <CommandItem
      value={label}
      onSelect={() => {
        toggle();
        onDone();
      }}
    >
      {isPinned ? <PinOffIcon /> : <PinIcon />}
      {label}
    </CommandItem>
  );
}

/**
 * The "Current <Entity>" quick-action group for whatever slug-routed entity page the palette opened
 * on — registry-driven (see `useEntityCommandContext`): boolean fields toggle directly, choice
 * fields enter the entity-choice sub-palette, and every entity gets View/Edit navigation plus
 * Pin/Unpin and New sub-tag/sub-type where applicable.
 */
export function EntityCommandGroup({
  matched,
  onNavigate,
  onEnterChoiceField,
  onAddChild,
  onClose,
}: {
  matched: MatchedEntityContext;
  onNavigate: (path: string) => void;
  onEnterChoiceField: (field: EntityChoiceField) => void;
  onAddChild: (kind: "tag" | "mediaType", parentId: string) => void;
  onClose: () => void;
}) {
  const {
    route, entity, name, fields, viewPath, editPath, config, saveField,
  } = matched;

  const pinContext: PinContext | null = entity && PINNABLE_KINDS.has(route.kind)
    ? {
      entityType: route.kind as PinnedSidebarEntityType,
      entityId: entity.id,
      label: name,
    }
    : null;

  const addChildKind = route.kind === "tag"
    ? "tag" as const
    : route.kind === "media-type" ? "mediaType" as const : null;

  return (
    <CommandGroup heading={`Current ${route.singular}`}>
      {fields.map((field) => {
        if (field.type === "boolean") {
          const value = entity ? field.getValue(entity) : false;
          return (
            <CommandItem
              key={field.key}
              value={field.label}
              disabled={!entity}
              onSelect={() => {
                saveField(field.label, {
                  [field.key]: !value,
                });
                onClose();
              }}
            >
              {value && <CheckIcon className="text-primary" />}
              {field.label}
            </CommandItem>
          );
        }
        return (
          <CommandItem
            key={field.key}
            value={field.label}
            disabled={!entity}
            onSelect={() => onEnterChoiceField(field)}
          >
            <ArrowLeftIcon className="rotate-180" />
            {field.label}
            …
          </CommandItem>
        );
      })}

      {addChildKind && entity && (
        <CommandItem
          value={addChildKind === "tag" ? "New sub-tag" : "New sub-type"}
          onSelect={() => onAddChild(addChildKind, entity.id)}
        >
          <PlusIcon />
          {addChildKind === "tag" ? "New sub-tag" : "New sub-type"}
        </CommandItem>
      )}

      {pinContext && (
        <PinCommandItem
          context={pinContext}
          onDone={onClose}
        />
      )}

      <CommandItem
        value={`View ${name}`}
        onSelect={() => onNavigate(viewPath)}
      >
        <EyeIcon />
        View
        {" "}
        {name}
      </CommandItem>
      <CommandItem
        value={`Edit ${name}`}
        onSelect={() => onNavigate(editPath)}
      >
        <PencilIcon />
        Edit
        {" "}
        {name}
      </CommandItem>
      {(config.extraEditTabs ?? []).map(tab => (
        <CommandItem
          key={tab.tab}
          value={tab.label}
          onSelect={() => onNavigate(`${route.prefix}/${matched.slug}/edit/${tab.tab}`)}
        >
          <PencilIcon />
          {tab.label}
        </CommandItem>
      ))}
    </CommandGroup>
  );
}

/**
 * Single-select sub-palette for an entity's choice field (e.g. a website's Category / Default
 * Media Type), with a None option to clear. Options come from the matched field's flat list.
 */
export function EntityChoiceSubPalette({
  matched,
  field,
  choiceOptions,
  onBack,
  onSelect,
}: {
  matched: MatchedEntityContext;
  field: EntityChoiceField;
  choiceOptions: EntityChoiceOptions;
  onBack: () => void;
  onSelect: (id: string | null) => void;
}) {
  const options = field.options === "categories"
    ? choiceOptions.categories
    : choiceOptions.mediaTypes;
  const current = matched.entity ? field.getValue(matched.entity) : null;

  return (
    <CommandGroup heading={`${matched.name}: ${field.label}`}>
      <CommandItem
        value="back"
        onSelect={onBack}
      >
        <ArrowLeftIcon />
        Back
      </CommandItem>
      <CommandItem
        value="none"
        onSelect={() => onSelect(null)}
      >
        {current === null && <CheckIcon className="text-primary" />}
        None
      </CommandItem>
      {options.map(option => (
        <CommandItem
          key={option.id}
          value={option.name}
          onSelect={() => onSelect(option.id)}
        >
          {current === option.id && <CheckIcon className="text-primary" />}
          {option.name}
        </CommandItem>
      ))}
    </CommandGroup>
  );
}
