import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export interface SidebarToggleItem {
  key: string;
  label: string;
}

type SidebarItemMode = "visible" | "see-more" | "hidden";

interface SidebarItemsMatrixProps {
  /** The selectable items shown as rows in the matrix. */
  items: readonly SidebarToggleItem[];
  /** Keys currently hidden — determines the current mode per item. */
  hiddenItems: string[];
  /**
   * When provided, a third "See More" option is shown between Default and Listing only.
   * Keys in this list appear under a "See More" expansion in the sidebar.
   */
  seeMoreItems?: string[];
  /** Set an item's display mode. */
  onSetMode: (key: string, mode: SidebarItemMode) => void;
}

/**
 * The bare radio toggle matrix for sidebar item visibility (no Card chrome). Used directly inside
 * the consolidated Sidebar settings card and wrapped by {@link SidebarItemsCard}.
 */
export function SidebarItemsMatrix({
  items, hiddenItems, seeMoreItems, onSetMode,
}: SidebarItemsMatrixProps) {
  const hasThreeStates = seeMoreItems !== undefined;

  function modeFor(key: string): SidebarItemMode {
    if (hiddenItems.includes(key)) return "hidden";
    if (hasThreeStates && seeMoreItems?.includes(key)) return "see-more";
    return "visible";
  }

  return (
    <div className="space-y-2">
      {items.map(item => (
        <div
          key={item.key}
          className="flex items-center justify-between gap-2"
        >
          <span className="truncate text-sm">{item.label}</span>
          <ToggleGroup
            type="single"
            size="sm"
            value={modeFor(item.key)}
            onValueChange={value => value && onSetMode(item.key, value as SidebarItemMode)}
          >
            <ToggleGroupItem value="visible">Default</ToggleGroupItem>
            {hasThreeStates && (
              <ToggleGroupItem value="see-more">See More</ToggleGroupItem>
            )}
            <ToggleGroupItem value="hidden">Listing only</ToggleGroupItem>
          </ToggleGroup>
        </div>
      ))}
    </div>
  );
}

interface SidebarItemsCardProps {
  title: string;
  description: string;
  /** The selectable items shown as rows in the matrix. */
  items: readonly SidebarToggleItem[];
  /** Keys currently hidden — determines the current mode per item. */
  hiddenItems: string[];
  /**
   * When provided, a third "See More" option is shown between Default and Listing only.
   * Keys in this list appear under a "See More" expansion in the sidebar.
   */
  seeMoreItems?: string[];
  /** Set an item's display mode. */
  onSetMode: (key: string, mode: SidebarItemMode) => void;
}

/**
 * A titled settings card with a radio toggle matrix for sidebar item visibility. Backs the
 * Taxonomies / Customization / Management cards in `DisplaySidebarSettings`. When `seeMoreItems` is
 * provided the matrix shows three options (Default / See More / Listing only); otherwise two
 * (Default / Listing only).
 */
export function SidebarItemsCard({
  title, description, items, hiddenItems, seeMoreItems, onSetMode,
}: SidebarItemsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <SidebarItemsMatrix
          items={items}
          hiddenItems={hiddenItems}
          seeMoreItems={seeMoreItems}
          onSetMode={onSetMode}
        />
      </CardContent>
    </Card>
  );
}
