import { useMemo, useState } from "react";

import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

import { AddTaxonomyTermModal } from "../components/AddTaxonomyTermModal";
import { TreeListingScaffold } from "../components/TreeListingScaffold";
import { buildTaxonomyTermTreeListingConfig } from "../entities/taxonomyTerm";
import { useSetListingPage } from "../hooks/useListingPage";
import { useTaxonomyBySlug } from "../hooks/useTaxonomies";
import { useTreeListingScaffold } from "../hooks/useTreeListingScaffold";
import { EMPTY_TAXONOMY } from "../lib/emptyTaxonomy";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/taxonomies/$taxonomyKey/")({
  component: TaxonomyListingPage,
});

/** Listing page for a user-configurable taxonomy: its term tree, in the same look every other
 * taxonomy listing (esp. Tags / Genres & Moods) uses. */
function TaxonomyListingPage() {
  const {
    t,
  } = useTranslation();
  const {
    taxonomyKey,
  } = Route.useParams();
  const {
    taxonomy,
  } = useTaxonomyBySlug(taxonomyKey);
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  const effective = taxonomy ?? EMPTY_TAXONOMY;
  const config = useMemo(
    () => buildTaxonomyTermTreeListingConfig(effective, {
      onNew: () => setModalOpen(true),
    }),
    [effective],
  );
  const state = useTreeListingScaffold(config);

  useSetListingPage(config.pageKey, {
    createAction: taxonomy ? () => setModalOpen(true) : undefined,
    addBookmark: {},
    createLabel: t("New term"),
  });

  if (!taxonomy) return null;

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{taxonomy.name}</h1>
            <Badge variant="secondary">{state.totalCount}</Badge>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
          >
            <Link to="/settings/taxonomies">
              <Pencil className="size-4" />
              {t("Manage")}
            </Link>
          </Button>
        </div>
        {taxonomy.description && (
          <p className="text-sm text-muted-foreground">{taxonomy.description}</p>
        )}
      </div>

      <TreeListingScaffold
        config={config}
        state={state}
      />

      <AddTaxonomyTermModal
        taxonomyId={taxonomy.id}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(term) => {
          void navigate({
            to: "/taxonomies/$taxonomyKey/$termSlug/edit",
            params: {
              taxonomyKey: taxonomy.slug,
              termSlug: term.slug,
            },
          });
        }}
      />
    </section>
  );
}
