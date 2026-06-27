import type { SidebarAdvanced } from "./useAppSidebarData";

import * as React from "react";

import { BookOpen, ChevronDown, Database, GitBranch, Palette, Server } from "lucide-react";

import { useResizeHandle } from "../hooks/useResizeHandle";
import { useUiStore } from "../stores/uiStore";

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

/** External-link "Advanced" group (Coolify / Docs / Storybook), each independently gated. */
export function SidebarAdvancedSection({
  advanced,
}: {
  advanced: SidebarAdvanced;
}) {
  const {
    coolifyLinkEnabled, coolifyUrl, docsLinkEnabled, storybookLinkEnabled,
    drizzleGatewayLinkEnabled, drizzleGatewayUrl, githubLinkEnabled,
  } = advanced;
  const showCoolify = coolifyLinkEnabled && coolifyUrl.trim() !== "";
  const showDrizzleGateway = drizzleGatewayLinkEnabled && drizzleGatewayUrl.trim() !== "";
  if (!showCoolify && !docsLinkEnabled && !storybookLinkEnabled && !showDrizzleGateway && !githubLinkEnabled) return null;

  return (
    <CollapsibleSection
      sectionKey="advanced"
      label="Advanced"
    >
      <SidebarMenu>
        {showCoolify
          ? (
            <SidebarExternalLink
              href={coolifyUrl}
              label="Coolify"
              icon={<Server />}
            />
          )
          : null}
        {docsLinkEnabled
          ? (
            <SidebarExternalLink
              href="/docs"
              label="Docs"
              icon={<BookOpen />}
            />
          )
          : null}
        {storybookLinkEnabled
          ? (
            <SidebarExternalLink
              href="/storybook"
              label="Storybook"
              icon={<Palette />}
            />
          )
          : null}
        {showDrizzleGateway
          ? (
            <SidebarExternalLink
              href={drizzleGatewayUrl}
              label="Drizzle Gateway"
              icon={<Database />}
            />
          )
          : null}
        {githubLinkEnabled
          ? (
            <SidebarExternalLink
              href="https://github.com/emilyeserven/eesimple-bookmarks"
              label="GitHub"
              icon={<GitBranch />}
            />
          )
          : null}
      </SidebarMenu>
    </CollapsibleSection>
  );
}

/** A single external (`target="_blank"`) link row in a sidebar menu. */
function SidebarExternalLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        tooltip={label}
      >
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
        >
          {icon}
          <span>{label}</span>
        </a>
      </SidebarMenuButton>
    </SidebarMenuItem>
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
