import { useState } from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { AddGroupTypeModal } from "../components/AddGroupTypeModal";
import { GroupTypesListing } from "../components/GroupTypeManager";
import { useGroupTypes } from "../hooks/useGroupTypes";
import { useSetListingPage } from "../hooks/useListingPage";

import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/taxonomies/group-types/")({
  component: GroupTypesPage,
});

/** Browse view for Group Types: every group type with search filtering. */
function GroupTypesPage() {
  const {
    t,
  } = useTranslation();
  const {
    data: allGroupTypes,
  } = useGroupTypes();
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  useSetListingPage("group-types-listing", {
    createAction: () => setModalOpen(true),
    addBookmark: {},
    createLabel: t("New group type"),
  });

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{t("Group Types")}</h1>
          {allGroupTypes
            ? (
              <Badge variant="secondary">
                {allGroupTypes.length}
              </Badge>
            )
            : null}
        </div>
        <p className="text-sm text-muted-foreground">
          {t("Classify groups by kind (e.g. Company, Podcast, Doujin Circle). Click one to view or edit it.")}
        </p>
      </div>

      <GroupTypesListing />

      <AddGroupTypeModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(groupType) => {
          void navigate({
            to: "/taxonomies/group-types/$groupTypeSlug/edit/general",
            params: {
              groupTypeSlug: groupType.slug,
            },
          });
        }}
      />
    </section>
  );
}
