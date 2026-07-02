import { Badge } from "@/components/ui/badge";
import { SidebarMenuBadge } from "@/components/ui/sidebar";

/** Renders a sidebar count badge when count is non-null and the sidebar is not icon-collapsed. */
export function SidebarCountBadge({
  count,
  sidebarState,
  minCount = 0,
}: {
  count: number | null | undefined;
  sidebarState: string;
  minCount?: number;
}) {
  if (count == null || sidebarState === "collapsed" || count < minCount) return null;
  return (
    <SidebarMenuBadge>
      <Badge variant="secondary">{count}</Badge>
    </SidebarMenuBadge>
  );
}
