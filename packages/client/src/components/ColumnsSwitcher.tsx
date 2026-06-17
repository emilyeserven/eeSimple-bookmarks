import { COLUMN_OPTIONS, useBookmarkColumns } from "../lib/bookmarkColumns";
import { useUiStore } from "../stores/uiStore";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ColumnsSwitcherProps {
  /** Stable key identifying the page, so each listing remembers its own column count. */
  pageKey: string;
}

/** On-page control to choose how many columns (1–4) a listing's bookmark grid uses. */
export function ColumnsSwitcher({
  pageKey,
}: ColumnsSwitcherProps) {
  const columns = useBookmarkColumns(pageKey);
  const setBookmarkColumns = useUiStore(state => state.setBookmarkColumns);
  const selectId = `columns-${pageKey}`;

  return (
    <div className="flex items-center gap-2">
      <Label
        htmlFor={selectId}
        className="text-xs text-muted-foreground"
      >
        Columns
      </Label>
      <Select
        value={String(columns)}
        onValueChange={value => setBookmarkColumns(pageKey, Number(value))}
      >
        <SelectTrigger
          id={selectId}
          size="sm"
          className="w-16"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {COLUMN_OPTIONS.map(option => (
            <SelectItem
              key={option}
              value={String(option)}
            >
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
