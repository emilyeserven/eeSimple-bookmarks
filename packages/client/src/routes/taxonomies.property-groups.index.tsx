import { useState } from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { AddPropertyGroupModal } from "../components/AddPropertyGroupModal";
import { PropertyGroupsListing } from "../components/PropertyGroupManager";
import { useSetListingPage } from "../hooks/useListingPage";
import { usePropertyGroups } from "../hooks/usePropertyGroups";

import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/taxonomies/property-groups/")({
  component: PropertyGroupsPage,
});

/** Browse view for Property Groups: every group with search filtering. */
function PropertyGroupsPage() {
  const {
    t,
  } = useTranslation();
  const {
    data: allGroups,
  } = usePropertyGroups();
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  useSetListingPage("property-groups-listing", {
    createAction: () => setModalOpen(true),
    addBookmark: {},
    createLabel: t("New property group"),
  });

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{t("Property Groups")}</h1>
          {allGroups
            ? (
              <Badge variant="secondary">
                {allGroups.length}
              </Badge>
            )
            : null}
        </div>
        <p className="text-sm text-muted-foreground">
          {t("Organize custom properties into groups. Grouped properties render together on bookmark detail pages and in the listings filters. Click a group to view or edit it.")}
        </p>
      </div>

      <PropertyGroupsListing />

      <AddPropertyGroupModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(group) => {
          void navigate({
            to: "/taxonomies/property-groups/$propertyGroupSlug/edit",
            params: {
              propertyGroupSlug: group.slug,
            },
          });
        }}
      />
    </section>
  );
}
