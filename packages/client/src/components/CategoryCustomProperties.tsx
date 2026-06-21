import type { Category, CustomProperty, CustomPropertyType } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import { propertyAppliesToCategory } from "@eesimple/types";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { CategoryDefaultsSection } from "./CategoryDefaultsSection";
import {
  useCustomProperties,
  useUpdateCustomProperty,
} from "../hooks/useCustomProperties";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";
import { toggleId } from "../lib/tag-utils";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const TYPE_LABELS: Record<CustomPropertyType, string> = {
  number: "Number",
  boolean: "Boolean",
  calculate: "Calculate (Sum)",
  datetime: "Date / Time",
  ratingScale: "Rating Scale",
  image: "Image",
  file: "File",
};

interface CategoryCustomPropertiesProps {
  category: Category;
}

export function CategoryCustomProperties({
  category,
}: CategoryCustomPropertiesProps) {
  const {
    data: properties, isLoading,
  } = useCustomProperties();
  const updateProperty = useUpdateCustomProperty();

  const enabledProperties = useMemo(
    () => (properties ?? []).filter(p => p.enabled),
    [properties],
  );

  const columns = useMemo<ColumnDef<CustomProperty>[]>(
    () => [
      {
        id: "assigned",
        header: "Assigned",
        cell: ({
          row,
        }) => {
          const property = row.original;
          return (
            <Checkbox
              aria-label={`Assign ${property.name}`}
              checked={propertyAppliesToCategory(property, category.id)}
              onCheckedChange={() =>
                updateProperty.mutate({
                  id: property.id,
                  // Unchecking a property that applies to "all categories" drops that flag and
                  // falls back to its explicit list (minus this category).
                  input: {
                    allCategories: false,
                    categoryIds: toggleId(property.categoryIds, category.id),
                  },
                }, {
                  onSuccess: () => notifyFieldSaved("Assigned properties"),
                  onError: error => notifyFieldSaveError("Assigned properties", error.message),
                })}
            />
          );
        },
      },
      {
        accessorKey: "name",
        header: "Name",
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({
          row,
        }) => (
          <Badge variant="secondary">{TYPE_LABELS[row.original.type]}</Badge>
        ),
      },
    ],
    [category.id, updateProperty],
  );

  const table = useReactTable({
    data: enabledProperties,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Assigned properties</Label>
        <p className="text-xs text-muted-foreground">
          Custom properties checked here are available on bookmarks in this category.
        </p>
        {isLoading
          ? <p className="text-sm text-muted-foreground">Loading properties…</p>
          : null}
        {!isLoading && enabledProperties.length === 0
          ? (
            <p className="text-sm text-muted-foreground">
              No custom properties yet. Create some on the Custom Properties settings page.
            </p>
          )
          : null}
        {!isLoading && enabledProperties.length > 0
          ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map(headerGroup => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map(row => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map(cell => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )
          : null}
      </div>

      <CategoryDefaultsSection category={category} />
    </div>
  );
}
