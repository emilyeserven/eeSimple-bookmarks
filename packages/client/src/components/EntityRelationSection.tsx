import type { CreatableEntityKind } from "./useEntityCreateOption";
import type { EntityName } from "@eesimple/types";
import type { ReactNode } from "react";

import { MultiCombobox } from "./MultiCombobox";
import { useEntityCreateOption } from "./useEntityCreateOption";

interface RelationItem {
  id: string;
  name: string;
  names?: EntityName[];
}

interface EntityRelationFormProps<T extends RelationItem> {
  items: T[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  createEntity: CreatableEntityKind;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
}

/**
 * Auto-saving multi-select for an owner ↔ target-entity relation (people, websites, YouTube
 * channels, …), with inline "create new" wired via {@link useEntityCreateOption}. Callers own the
 * mutation: `onChange` receives the next full id list and is responsible for persisting it (and
 * firing the field-named toast) — this component only renders the picker. Shared by the
 * `*PeopleForm` / `*WebsitesForm` / `*YouTubeChannelsForm` association tabs.
 */
export function EntityRelationForm<T extends RelationItem>({
  items,
  selectedIds,
  onChange,
  createEntity,
  placeholder,
  searchPlaceholder,
  emptyText,
}: EntityRelationFormProps<T>) {
  const create = useEntityCreateOption(createEntity, created => onChange([...selectedIds, created.id]));

  return (
    <>
      <MultiCombobox
        options={items.map(item => ({
          value: item.id,
          label: item.name,
          names: item.names,
        }))}
        values={selectedIds}
        onValuesChange={onChange}
        placeholder={placeholder}
        searchPlaceholder={searchPlaceholder}
        emptyText={emptyText}
        createOption={create.createOption}
      />
      {create.modal}
    </>
  );
}

interface EntityRelationViewProps<T extends RelationItem> {
  items: T[];
  selectedIds: string[];
  emptyText: string;
  /** Optional per-item override (e.g. linking to the item's own page). Defaults to plain text. */
  renderItem?: (item: T) => ReactNode;
}

/** Read-only list of the items in `items` whose id is in `selectedIds`. */
export function EntityRelationView<T extends RelationItem>({
  items,
  selectedIds,
  emptyText,
  renderItem,
}: EntityRelationViewProps<T>) {
  const connected = items.filter(item => selectedIds.includes(item.id));

  if (connected.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }

  return (
    <ul className="space-y-2">
      {connected.map(item => (
        <li
          key={item.id}
          className="text-sm"
        >
          {renderItem ? renderItem(item) : item.name}
        </li>
      ))}
    </ul>
  );
}
