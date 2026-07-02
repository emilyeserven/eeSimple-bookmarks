import type { useAppSidebarData } from "./useAppSidebarData";

import { Link } from "@tanstack/react-router";

import { CollapsibleSection } from "./app-sidebar-sections";
import { SidebarCountBadge } from "./SidebarCountBadge";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type SidebarData = ReturnType<typeof useAppSidebarData>;

/** The collapsible "Saved Filters" sidebar section: one `/bookmarks` deep link per viewable filter. */
export function SidebarSavedFiltersSection({
  viewableFilters,
  sidebarState,
}: {
  viewableFilters: SidebarData["viewableFilters"];
  sidebarState: string;
}) {
  return (
    <CollapsibleSection
      sectionKey="saved-filters"
      label="Saved Filters"
    >
      <SidebarMenu>
        {viewableFilters.map(filter => (
          <SidebarMenuItem key={filter.id}>
            <SidebarMenuButton
              asChild
              isActive={filter.isActive}
              tooltip={filter.label}
            >
              <Link
                to="/bookmarks"
                search={filter.link.kind === "filter" ? filter.link.search : undefined}
              >
                {filter.icon}
                <span>{filter.label}</span>
              </Link>
            </SidebarMenuButton>
            <SidebarCountBadge
              count={filter.bookmarkCount}
              sidebarState={sidebarState}
            />
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </CollapsibleSection>
  );
}
