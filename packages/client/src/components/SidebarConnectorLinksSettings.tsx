import type { SidebarToggleItem } from "./SidebarItemsCard";

import { useTranslation } from "react-i18next";

import { SidebarItemsCard } from "./SidebarItemsCard";
import { useConnectors } from "../hooks/useConnectors";
import { useSidebarSettings } from "../hooks/useSidebarSettings";
import { CONNECTOR_LINKS } from "../lib/connectorLinks";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Settings card controlling the sidebar's Connectors section link-outs. Lists only the connectors
 * that are configured on Settings → Connectors (their endpoint is set), each with a
 * Default / See More / Hide toggle. Sits above the "Advanced Links" card on the Sidebar settings page.
 */
export function SidebarConnectorLinksSettings() {
  const {
    data: connectors,
  } = useConnectors();
  const {
    sidebar,
    setConnectorLinkMode,
  } = useSidebarSettings();
  const {
    t,
  } = useTranslation();

  const items: SidebarToggleItem[] = connectors
    ? CONNECTOR_LINKS.filter(link => link.isConfigured(connectors)).map(link => ({
      key: link.key,
      label: link.label(connectors),
      icon: link.icon,
    }))
    : [];

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("Connector Links")}</CardTitle>
          <CardDescription>
            {t("Link out to your connected services from the sidebar.")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t("No connectors are configured yet. Add an endpoint on Settings → Connectors to show it here.")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <SidebarItemsCard
      title={t("Connector Links")}
      description={t("Choose how each connector link appears in the left sidebar's Connectors section.")}
      items={items}
      hiddenItems={sidebar.hiddenConnectorLinks}
      seeMoreItems={sidebar.seeMoreConnectorLinks}
      onSetMode={setConnectorLinkMode}
      hiddenLabel={t("Hide")}
    />
  );
}
