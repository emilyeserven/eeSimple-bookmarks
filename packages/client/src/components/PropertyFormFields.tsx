import type {
  Category,
  CustomProperty,
  MediaType,
} from "@eesimple/types";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CategoryIcon } from "@/lib/icons";

interface CategoryCheckboxListProps {
  categories: Category[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  idPrefix: string;
  /** When set, render a leading "Select all" checkbox that selects every / no category. */
  onToggleAll?: (selectAll: boolean) => void;
  /** When true, the property applies to all (incl. future) categories; "Select all" stays checked. */
  allCategories?: boolean;
}

/** A checkbox list for assigning a property to zero, one, or many categories. */
export function CategoryCheckboxList({
  categories,
  selectedIds,
  onToggle,
  idPrefix,
  onToggleAll,
  allCategories = false,
}: CategoryCheckboxListProps) {
  if (categories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No categories yet. Create some on the Categories page.
      </p>
    );
  }
  const allSelected = allCategories || categories.every(category => selectedIds.includes(category.id));
  return (
    <div className="space-y-2">
      {onToggleAll
        ? (
          <div className="flex items-center gap-2">
            <Checkbox
              id={`${idPrefix}-select-all`}
              checked={allSelected}
              onCheckedChange={() => onToggleAll(!allSelected)}
            />
            <Label
              htmlFor={`${idPrefix}-select-all`}
              className="text-xs text-muted-foreground"
            >
              Select all
            </Label>
          </div>
        )
        : null}
      <div
        className="
          grid gap-2
          sm:grid-cols-2
        "
      >
        {categories.map((category) => {
          const inputId = `${idPrefix}-${category.id}`;
          return (
            <div
              key={category.id}
              className="flex items-center gap-2"
            >
              <Checkbox
                id={inputId}
                checked={allCategories || selectedIds.includes(category.id)}
                onCheckedChange={() => onToggle(category.id)}
              />
              <Label
                htmlFor={inputId}
                className="flex items-center gap-1.5"
              >
                <CategoryIcon
                  name={category.icon}
                  className="size-3.5"
                />
                {category.name}
              </Label>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface MediaTypeCheckboxListProps {
  mediaTypes: MediaType[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  idPrefix: string;
  /** When set, render a leading "Select all" checkbox that selects every / no media type. */
  onToggleAll?: (selectAll: boolean) => void;
  /** When true, the property applies to all (incl. future) media types; "Select all" stays checked. */
  allMediaTypes?: boolean;
}

/** A checkbox list for assigning a property to zero, one, or many media types (children indented). */
export function MediaTypeCheckboxList({
  mediaTypes,
  selectedIds,
  onToggle,
  idPrefix,
  onToggleAll,
  allMediaTypes = false,
}: MediaTypeCheckboxListProps) {
  if (mediaTypes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No media types yet. Create some on the Media Types page.
      </p>
    );
  }

  const childrenByParent = new Map<string, MediaType[]>();
  const roots: MediaType[] = [];
  for (const mt of mediaTypes) {
    if (mt.parentId) {
      const siblings = childrenByParent.get(mt.parentId) ?? [];
      siblings.push(mt);
      childrenByParent.set(mt.parentId, siblings);
    }
    else {
      roots.push(mt);
    }
  }
  const rootIds = new Set(roots.map(r => r.id));
  const orphans = mediaTypes.filter(mt => mt.parentId && !rootIds.has(mt.parentId));

  const allSelected = allMediaTypes || mediaTypes.every(mt => selectedIds.includes(mt.id));

  const renderRow = (mt: MediaType, indent: boolean) => {
    const inputId = `${idPrefix}-${mt.id}`;
    return (
      <div
        key={mt.id}
        className={indent ? "flex items-center gap-2 pl-6" : "flex items-center gap-2"}
      >
        <Checkbox
          id={inputId}
          checked={allMediaTypes || selectedIds.includes(mt.id)}
          onCheckedChange={() => onToggle(mt.id)}
        />
        <Label htmlFor={inputId}>{mt.name}</Label>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {onToggleAll
        ? (
          <div className="flex items-center gap-2">
            <Checkbox
              id={`${idPrefix}-select-all`}
              checked={allSelected}
              onCheckedChange={() => onToggleAll(!allSelected)}
            />
            <Label
              htmlFor={`${idPrefix}-select-all`}
              className="text-xs text-muted-foreground"
            >
              Select all
            </Label>
          </div>
        )
        : null}
      <div className="space-y-1">
        {roots.map(root => (
          <div key={root.id}>
            {renderRow(root, false)}
            {(childrenByParent.get(root.id) ?? []).map(child => renderRow(child, true))}
          </div>
        ))}
        {orphans.map(mt => renderRow(mt, false))}
      </div>
    </div>
  );
}

interface OperandCheckboxListProps {
  numberProperties: CustomProperty[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

/** A checkbox list for choosing the Number properties a Calculate property sums. */
export function OperandCheckboxList({
  numberProperties, selectedIds, onToggle,
}: OperandCheckboxListProps) {
  if (numberProperties.length < 2) {
    return (
      <p className="text-sm text-muted-foreground">
        Create at least two Number properties first; a Calculate property sums them.
      </p>
    );
  }
  return (
    <div
      className="
        grid gap-2
        sm:grid-cols-2
      "
    >
      {numberProperties.map((property) => {
        const inputId = `operand-${property.id}`;
        return (
          <div
            key={property.id}
            className="flex items-center gap-2"
          >
            <Checkbox
              id={inputId}
              checked={selectedIds.includes(property.id)}
              onCheckedChange={() => onToggle(property.id)}
            />
            <Label htmlFor={inputId}>{property.name}</Label>
          </div>
        );
      })}
    </div>
  );
}
