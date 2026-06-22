import type { DrawerContentType } from "@/lib/drawerSearch";

import { getContentType } from "./contentTypes";
import { usePanelControls } from "./usePanelControls";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useCategories } from "@/hooks/useCategories";
import { useTagTree } from "@/hooks/useTags";
import { NEW_SENTINEL } from "@/lib/drawerSearch";
import { flattenTree } from "@/lib/tagTree";

function usePanelItemLabel(dCT: DrawerContentType | null, dCId: string | null): string | null {
  const {
    data: tagTree,
  } = useTagTree();
  const {
    data: categories,
  } = useCategories();

  if (!dCId || dCId === NEW_SENTINEL || !dCT) return null;

  if (dCT === "tag") {
    return flattenTree(tagTree ?? []).find(({
      node,
    }) => node.id === dCId)?.node.name ?? null;
  }
  if (dCT === "category") {
    return categories?.find(c => c.id === dCId)?.name ?? null;
  }
  return null;
}

/** Breadcrumb navigation bar shown below the chrome when a content type is selected. */
export function PanelBreadcrumbs() {
  const {
    dCT, dCId, open, openType,
  } = usePanelControls();

  const specificName = usePanelItemLabel(dCT ?? null, dCId ?? null);

  if (!dCT) return null;

  // Notifications and Filters have no registry entry; render a simple two-level trail.
  if (dCT === "notifications" || dCT === "filters") {
    const label = dCT === "notifications" ? "Notifications" : "Filters";
    return (
      <div className="flex items-center gap-1 px-4 pb-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                className="cursor-pointer"
                onClick={open}
              >
                Browse
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
    ? (dCId === NEW_SENTINEL ? `New ${def.singular}` : (specificName ?? def.singular))
    : null;

  return (
    <div className="flex items-center gap-1 px-4 pb-2">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              className="cursor-pointer"
              onClick={open}
            >
              Browse
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
                <BreadcrumbItem>
                  <BreadcrumbPage>{itemLabel}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )
            : null}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
