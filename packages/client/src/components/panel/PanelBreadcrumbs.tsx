import { useTranslation } from "react-i18next";

import { getContentType } from "./contentTypes";
import { usePanelItemLabel } from "./panelBreadcrumbData";
import { PanelBreadcrumbSwitcher } from "./PanelBreadcrumbSwitcher";
import { usePanelControls } from "./usePanelControls";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { NEW_SENTINEL } from "@/lib/drawerSearch";

/** Breadcrumb navigation bar shown below the chrome when a content type is selected. */
export function PanelBreadcrumbs() {
  const {
    dCT, dCId, open, openType,
  } = usePanelControls();
  const {
    t,
  } = useTranslation();

  const specificName = usePanelItemLabel(dCT ?? null, dCId ?? null);

  if (!dCT) return null;

  // Notifications, Filters, and AI Summarization have no registry entry; render a simple two-level trail.
  if (dCT === "notifications" || dCT === "filters" || dCT === "ai-summarization") {
    const label = dCT === "notifications"
      ? t("Notifications")
      : dCT === "filters"
        ? t("Filters")
        : t("AI Summarization");
    return (
      <div className="flex items-center gap-1 px-4 pb-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                className="cursor-pointer"
                onClick={open}
              >
                {t("Browse")}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{label}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    );
  }

  const def = getContentType(dCT);

  const itemLabel = dCId
    ? (dCId === NEW_SENTINEL
      ? t("New {{name}}", {
        name: def.singular,
      })
      : (specificName ?? def.singular))
    : null;

  const showSwitcher = Boolean(dCId && dCId !== NEW_SENTINEL);

  return (
    <div className="flex items-center gap-1 px-4 pb-2">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              className="cursor-pointer"
              onClick={open}
            >
              {t("Browse")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            {itemLabel
              ? (
                <BreadcrumbLink
                  className="cursor-pointer"
                  onClick={() => openType(dCT)}
                >
                  {def.label}
                </BreadcrumbLink>
              )
              : <BreadcrumbPage>{def.label}</BreadcrumbPage>}
          </BreadcrumbItem>
          {itemLabel
            ? (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem className={showSwitcher ? "group/crumb" : undefined}>
                  <BreadcrumbPage>{itemLabel}</BreadcrumbPage>
                  {showSwitcher && dCId && (
                    <PanelBreadcrumbSwitcher
                      dCT={dCT}
                      dCId={dCId}
                    />
                  )}
                </BreadcrumbItem>
              </>
            )
            : null}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
