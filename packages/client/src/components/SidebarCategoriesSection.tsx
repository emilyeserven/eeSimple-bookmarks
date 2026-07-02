import type { useAppSidebarData } from "./useAppSidebarData";
import type { SidebarOpenModifier } from "@eesimple/types";
import type { MouseEvent } from "react";

import { ChevronDown, ChevronUp } from "lucide-react";

import { CollapsibleSection } from "./app-sidebar-sections";
import { SidebarCategoryMenuItem } from "./SidebarCategoryMenuItem";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type SidebarData = ReturnType<typeof useAppSidebarData>;

/** The collapsible "Categories" sidebar section with its See More/Less fold. */
export function SidebarCategoriesSection({
  visibleCategories,
  seeMoreCategories,
  expanded,
  setExpanded,
  pathname,
  modifier,
  sidebarState,
  onViewClick,
}: {
  visibleCategories: SidebarData["visibleCategories"];
  seeMoreCategories: SidebarData["seeMoreCategories"];
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  pathname: string;
  modifier: SidebarOpenModifier;
  sidebarState: string;
  onViewClick: (event: MouseEvent, id: string) => void;
}) {
  return (
    <CollapsibleSection
      sectionKey="categories"
      label="Categories"
    >
      <SidebarMenu>
        {visibleCategories.map(category => (
          <SidebarCategoryMenuItem
            key={category.id}
            category={category}
            pathname={pathname}
            modifier={modifier}
            sidebarState={sidebarState}
            onViewClick={onViewClick}
          />
        ))}
        {seeMoreCategories.length > 0 && !expanded && sidebarState !== "collapsed"
          ? (
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Show more categories"
                onClick={() => setExpanded(true)}
                className="text-xs text-muted-foreground"
              >
                <ChevronDown className="size-4" />
                <span>See More</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
          : null}
        {expanded
          ? seeMoreCategories.map(category => (
            <SidebarCategoryMenuItem
              key={category.id}
              category={category}
              pathname={pathname}
              modifier={modifier}
              sidebarState={sidebarState}
              onViewClick={onViewClick}
            />
          ))
          : null}
        {seeMoreCategories.length > 0 && expanded && sidebarState !== "collapsed"
          ? (
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Show fewer categories"
                onClick={() => setExpanded(false)}
                className="text-xs text-muted-foreground"
              >
                <ChevronUp className="size-4" />
                <span>See Less</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
          : null}
      </SidebarMenu>
    </CollapsibleSection>
  );
}
