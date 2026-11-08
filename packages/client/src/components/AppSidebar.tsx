import type { LucideIcon } from "lucide-react";

import { Link } from "@tanstack/react-router";
import { Home, List } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

/** Sidebar navigation entries — add a page here when you add a top-level route. */
const NAV_ITEMS: NavItem[] = [
  {
    to: "/",
    label: "Home",
    icon: Home,
  },
  {
    to: "/items",
    label: "Items",
    icon: List,
  },
];

export function AppSidebar() {
  const {
    t,
  } = useTranslation();
  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-3 text-lg font-semibold">{t("App")}</SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {NAV_ITEMS.map(item => (
              <SidebarMenuItem key={item.to}>
                <SidebarMenuButton asChild>
                  <Link
                    to={item.to}
                    activeOptions={{
                      exact: item.to === "/",
                    }}
                    activeProps={{
                      "data-active": true,
                    }}
                  >
                    <item.icon />
                    <span>{t(item.label)}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <ThemeToggle />
      </SidebarFooter>
    </Sidebar>
  );
}
