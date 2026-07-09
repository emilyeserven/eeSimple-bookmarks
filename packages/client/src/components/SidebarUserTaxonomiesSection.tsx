import { Link } from "@tanstack/react-router";
import { Tags } from "lucide-react";
import { useTranslation } from "react-i18next";

import { CollapsibleSection } from "./app-sidebar-sections";
import { SidebarCountBadge } from "./SidebarCountBadge";
import { useTaxonomies } from "../hooks/useTaxonomies";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

/**
 * The collapsible "My Taxonomies" sidebar section — one link per user-configurable taxonomy that is
 * visible (`showInSidebar && !hidden`), driven by DB data (unlike the static built-in `taxonomyItems`
 * above it). Renders nothing when there are no visible taxonomies.
 */
export function SidebarUserTaxonomiesSection({
  sidebarState,
  pathname,
}: {
  sidebarState: string;
  pathname: string;
}) {
  const {
    t,
  } = useTranslation();
  const {
    data: taxonomies = [],
  } = useTaxonomies();
  const visible = taxonomies.filter(taxonomy => taxonomy.showInSidebar && !taxonomy.hidden);
  if (visible.length === 0) return null;

  return (
    <CollapsibleSection
      sectionKey="user-taxonomies"
      label={t("My Taxonomies")}
    >
      <SidebarMenu>
        {visible.map((taxonomy) => {
          const to = `/taxonomies/${taxonomy.slug}`;
          return (
            <SidebarMenuItem key={taxonomy.id}>
              <SidebarMenuButton
                asChild
                isActive={pathname === to}
                tooltip={taxonomy.name}
              >
                <Link
                  to="/taxonomies/$taxonomyKey"
                  params={{
                    taxonomyKey: taxonomy.slug,
                  }}
                >
                  <Tags />
                  <span>{taxonomy.name}</span>
                </Link>
              </SidebarMenuButton>
              <SidebarCountBadge
                count={taxonomy.bookmarkCount ?? 0}
                sidebarState={sidebarState}
              />
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </CollapsibleSection>
  );
}
