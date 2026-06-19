import type { Category } from "@eesimple/types";

import { NO_CATEGORY } from "./AutofillRuleForm";
import { usePanelControls } from "./panel/usePanelControls";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NEW_SENTINEL } from "@/lib/drawerSearch";

/** Select sentinel for "show rules for every category". */
export const ALL_CATEGORIES = "all";

interface AutofillRulesToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  /** When true, the category filter is hidden (the list is scoped to a single entity). */
  scoped: boolean;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  categories: Category[];
}

/** Search box + category filter + "New Autofill Rule" button above the rules list. */
export function AutofillRulesToolbar({
  search, onSearchChange, scoped, categoryFilter, onCategoryFilterChange, categories,
}: AutofillRulesToolbarProps) {
  const {
    openAutofill,
  } = usePanelControls();

  return (
    <div
      className="
        flex flex-col gap-3
        sm:flex-row sm:items-center sm:justify-between
      "
    >
      <div className="flex flex-1 flex-wrap items-center gap-3">
        <Input
          type="search"
          placeholder="Search rules…"
          value={search}
          onChange={event => onSearchChange(event.target.value)}
          className="max-w-xs"
        />
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

      <Button
        type="button"
        onClick={() => openAutofill(NEW_SENTINEL)}
      >
        New Autofill Rule
      </Button>
    </div>
  );
}
