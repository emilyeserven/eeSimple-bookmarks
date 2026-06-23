import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export interface SidebarToggleItem {
  key: string;
  label: string;
}

interface SidebarItemsCardProps {
  title: string;
  description: string;
  /** The selectable items shown as checkboxes. */
  items: readonly SidebarToggleItem[];
  /** Keys currently hidden — a checkbox is checked when its key is NOT in this list. */
  hiddenItems: string[];
  /** Toggle one item's visibility by key. */
  onToggle: (key: string) => void;
  /** Distinguishes checkbox ids across cards, e.g. `taxonomy` → `show-taxonomy-<key>`. */
  idPrefix: string;
}

/**
 * A titled settings card listing visibility checkboxes for a fixed set of sidebar items. Backs the
 * Taxonomies / Customization / Management cards in `DisplaySettings`, which differ only in their
 * title, copy, and item list.
 */
export function SidebarItemsCard({
  title, description, items, hiddenItems, onToggle, idPrefix,
}: SidebarItemsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.map(item => (
            <div
              key={item.key}
              className="flex items-center gap-2"
            >
              <Checkbox
                id={`show-${idPrefix}-${item.key}`}
                checked={!hiddenItems.includes(item.key)}
                onCheckedChange={() => onToggle(item.key)}
              />
              <Label htmlFor={`show-${idPrefix}-${item.key}`}>{item.label}</Label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
