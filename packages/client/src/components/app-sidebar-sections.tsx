import type { LinkProps } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

import * as React from "react";

import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";

import { useResizeHandle } from "../hooks/useResizeHandle";
import { useUiStore } from "../stores/uiStore";

export { useViewPanelClick } from "./panel/useEditPanelClick";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

/** Collapsible sidebar group; collapses to a plain labelled group in icon mode. */
export function CollapsibleSection({
  sectionKey,
  label,
  children,
}: {
  sectionKey: string;
  label: string;
  children: React.ReactNode;
}) {
  const {
    state,
  } = useSidebar();
  const collapsedSidebarSections = useUiStore(s => s.collapsedSidebarSections);
  const toggleSidebarSection = useUiStore(s => s.toggleSidebarSection);
  const isCollapsed = collapsedSidebarSections.includes(sectionKey);

  if (state === "collapsed") {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>{label}</SidebarGroupLabel>
        <SidebarGroupContent>{children}</SidebarGroupContent>
      </SidebarGroup>
    );
  }
  return (
    <Collapsible
      open={!isCollapsed}
      onOpenChange={() => toggleSidebarSection(sectionKey)}
    >
      <SidebarGroup>
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger
            className="flex w-full items-center justify-between"
          >
            {label}
            <ChevronDown
              className={`
                size-3.5 shrink-0 transition-transform duration-200
                ${isCollapsed ? "-rotate-90" : ""}
              `}
            />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>{children}</SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

interface SidebarNavSectionItem {
  key: string;
  title: string;
  to: NonNullable<LinkProps["to"]>;
  icon: LucideIcon;
}

/** A collapsible group of static nav links, active when the path is under each link. */
export function SidebarNavSection({
  sectionKey,
  label,
  items,
}: {
  sectionKey: string;
  label: string;
  items: readonly SidebarNavSectionItem[];
}) {
  const pathname = useRouterState({
    select: state => state.location.pathname,
  });

  return (
    <CollapsibleSection
      sectionKey={sectionKey}
      label={label}
    >
      <SidebarMenu>
        {items.map((item) => {
          const isActive = pathname.startsWith(item.to);
          return (
            <SidebarMenuItem key={item.key}>
              <SidebarMenuButton
                asChild
                isActive={isActive}
                tooltip={item.title}
              >
                <Link to={item.to}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </CollapsibleSection>
  );
}

export function SidebarResizeHandle() {
  const {
    state,
  } = useSidebar();
  const sidebarWidth = useUiStore(s => s.sidebarWidth);
  const setSidebarWidth = useUiStore(s => s.setSidebarWidth);
  const {
    onPointerDown,
  } = useResizeHandle({
    direction: "right",
    currentWidth: sidebarWidth,
    onChange: setSidebarWidth,
    min: 10,
    max: 28,
  });

  if (state === "collapsed") return null;

  return (
    <div
      className="
        absolute inset-y-0 -right-0.5 z-30 w-1 cursor-col-resize
        transition-colors
        hover:bg-sidebar-border/60
      "
      onPointerDown={onPointerDown}
    />
  );
}
