import type { Category } from "@eesimple/types";
import type { MouseEvent } from "react";

import { Plus } from "lucide-react";

import { NO_CATEGORY } from "./AutofillRuleForm";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Select sentinel for "show rules for every category". */
export const ALL_CATEGORIES = "all";

interface AutofillRulesToolbarProps {
  /** When true, the category filter is hidden (the list is scoped to a single entity). */
  scoped: boolean;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  categories: Category[];
  /** When provided and the list is scoped, a "New autofill rule" button is rendered. */
  onCreateClick?: (event: MouseEvent) => void;
}

/** Category filter + optional create button above the rules list. */
export function AutofillRulesToolbar({
  scoped, categoryFilter, onCategoryFilterChange, categories, onCreateClick,
}: AutofillRulesToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {scoped && onCreateClick
        ? (
          <Button
            type="button"
            size="sm"
            onClick={event => onCreateClick(event)}
          >
            <Plus className="size-4" />
            New autofill rule
          </Button>
        )
        : null}
      {scoped
        ? null
        : (
          <Select
            value={categoryFilter}
            onValueChange={onCategoryFilterChange}
          >
            <SelectTrigger
              aria-label="Filter by category"
              className="w-56"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
              <SelectItem value={NO_CATEGORY}>No category</SelectItem>
              {categories.map(category => (
                <SelectItem
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
    </div>
  );
}
