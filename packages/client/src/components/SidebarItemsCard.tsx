import type React from "react";

import { useTranslation } from "react-i18next";

import { SegmentedToggleRow } from "@/components/SegmentedToggleRow";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface SidebarToggleItem {
  key: string;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: React.ComponentType<any>;
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
  /** Label for the "hidden" option (default "Listing only"; e.g. "Hide" for connector links). */
  hiddenLabel?: string;
}

/**
 * The bare radio toggle matrix for sidebar item visibility (no Card chrome). Used directly inside
 * the consolidated Sidebar settings card and wrapped by {@link SidebarItemsCard}.
 */
export function SidebarItemsMatrix({
  items, hiddenItems, seeMoreItems, onSetMode, hiddenLabel,
}: SidebarItemsMatrixProps) {
  const {
    t,
  } = useTranslation();
  const hasThreeStates = seeMoreItems !== undefined;
  const resolvedHiddenLabel = t(hiddenLabel ?? "Listing only");

  function modeFor(key: string): SidebarItemMode {
    if (hiddenItems.includes(key)) return "hidden";
    if (hasThreeStates && seeMoreItems?.includes(key)) return "see-more";
    return "visible";
  }

  const options: { value: SidebarItemMode;
    label: string; }[] = hasThreeStates
    ? [
      {
        value: "visible",
        label: t("Default"),
      },
      {
        value: "see-more",
        label: t("See More"),
      },
      {
        value: "hidden",
        label: resolvedHiddenLabel,
      },
    ]
    : [
      {
        value: "visible",
        label: t("Default"),
      },
      {
        value: "hidden",
        label: resolvedHiddenLabel,
      },
    ];

  return (
    <div className="space-y-2">
      {items.map(item => (
        <SegmentedToggleRow
          key={item.key}
          label={item.label}
          icon={item.icon
            ? (
              <item.icon
                className="size-3.5 shrink-0 text-muted-foreground"
              />
            )
            : undefined}
          options={options}
          value={modeFor(item.key)}
          onChange={mode => onSetMode(item.key, mode)}
        />
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
  /** Label for the "hidden" option (default "Listing only"; e.g. "Hide" for connector links). */
  hiddenLabel?: string;
}

/**
 * A titled settings card with a radio toggle matrix for sidebar item visibility. Backs the
 * Taxonomies / Customization / Management cards in `DisplaySidebarSettings`. When `seeMoreItems` is
 * provided the matrix shows three options (Default / See More / Listing only); otherwise two
 * (Default / Listing only).
 */
export function SidebarItemsCard({
  title, description, items, hiddenItems, seeMoreItems, onSetMode, hiddenLabel,
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
          hiddenLabel={hiddenLabel}
        />
      </CardContent>
    </Card>
  );
}
