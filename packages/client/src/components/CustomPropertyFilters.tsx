import type { ComboboxOption } from "./Combobox";
import type { CustomProperty } from "@eesimple/types";

import { useState } from "react";

import { Combobox } from "./Combobox";
import { RangeSlider } from "./RangeSlider";
import { usePropertyTagTree } from "../hooks/useCustomProperties";
import { flattenTree, subtreeIds } from "../lib/tagTree";

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface CustomPropertyFiltersProps {
  properties: CustomProperty[];
  /** Report a number filter (or `undefined` to clear it when back at full range). */
  onNumberFilterChange: (propertyId: string, range: [number, number] | undefined) => void;
  /** Report a tag filter's allowed ids (or `undefined` to clear it). */
  onTagFilterChange: (propertyId: string, allowedTagIds: string[] | undefined) => void;
}

/** Renders one dynamic filter control per custom property under the bookmarks list. */
export function CustomPropertyFilters({
  properties, onNumberFilterChange, onTagFilterChange,
}: CustomPropertyFiltersProps) {
  if (properties.length === 0) return null;

  return (
    <Card>
      <CardContent
        className="
          grid gap-4
          sm:grid-cols-2
        "
      >
        {properties.map(property => (
          <div
            key={property.id}
            className="space-y-1"
          >
            <Label className="text-xs text-muted-foreground">{property.name}</Label>
            {property.type === "number"
              ? (
                <NumberFilterControl
                  property={property}
                  onChange={onNumberFilterChange}
                />
              )
              : (
                <TagFilterControl
                  property={property}
                  onChange={onTagFilterChange}
                />
              )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

interface NumberControlProps {
  property: CustomProperty;
  onChange: (propertyId: string, range: [number, number] | undefined) => void;
}

function NumberFilterControl({
  property, onChange,
}: NumberControlProps) {
  const min = property.numberMin ?? 0;
  const max = property.numberMax ?? 100;
  const [range, setRange] = useState<[number, number]>([min, max]);

  return (
    <RangeSlider
      min={min}
      max={max}
      value={range}
      label={property.name}
      onValueChange={(next) => {
        setRange(next);
        // Only an actually-narrowed range counts as an active filter.
        const active = next[0] > min || next[1] < max;
        onChange(property.id, active ? next : undefined);
      }}
    />
  );
}

interface TagControlProps {
  property: CustomProperty;
  onChange: (propertyId: string, allowedTagIds: string[] | undefined) => void;
}

function TagFilterControl({
  property, onChange,
}: TagControlProps) {
  const {
    data: tree,
  } = usePropertyTagTree(property.id);
  const [selected, setSelected] = useState<string | undefined>(undefined);

  const flat = tree ? flattenTree(tree) : [];
  const options: ComboboxOption[] = flat.map(({
    node, depth,
  }) => ({
    value: node.id,
    label: node.name,
    depth,
  }));

  return (
    <Combobox
      options={options}
      value={selected}
      placeholder={`Filter by ${property.name}…`}
      aria-label={`Filter by ${property.name}`}
      onValueChange={(id) => {
        setSelected(id);
        if (!id) {
          onChange(property.id, undefined);
          return;
        }
        const node = flat.find(item => item.node.id === id)?.node;
        onChange(property.id, node ? subtreeIds(node) : [id]);
      }}
    />
  );
}
