import type { Category, CustomProperty } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useMemo } from "react";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useTranslation } from "react-i18next";

import { CategoryDefaultsSection } from "./CategoryDefaultsSection";
import { buildCategoryPropertyColumns } from "./categoryPropertyColumns";
import {
  useCustomProperties,
  useUpdateCustomProperty,
} from "../hooks/useCustomProperties";

import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CategoryCustomPropertiesProps {
  category: Category;
}

export function CategoryCustomProperties({
  category,
}: CategoryCustomPropertiesProps) {
  const {
    t,
  } = useTranslation();
  const {
    data: properties, isLoading,
  } = useCustomProperties();
  const updateProperty = useUpdateCustomProperty();

  const enabledProperties = useMemo(
    () => (properties ?? []).filter(p => p.enabled),
    [properties],
  );

  const columns = useMemo<ColumnDef<CustomProperty>[]>(
    () => buildCategoryPropertyColumns(category.id, updateProperty),
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
        <Label>{t("Assigned properties")}</Label>
        <p className="text-xs text-muted-foreground">
          {t("Custom properties checked here are available on bookmarks in this category.")}
        </p>
        {isLoading
          ? <p className="text-sm text-muted-foreground">{t("Loading properties…")}</p>
          : null}
        {!isLoading && enabledProperties.length === 0
          ? (
            <p className="text-sm text-muted-foreground">
              {t("No custom properties yet. Create some on the Custom Properties settings page.")}
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
