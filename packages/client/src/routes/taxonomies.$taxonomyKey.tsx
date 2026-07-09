import { createFileRoute, Link } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useTaxonomyBySlug, useTaxonomyTermTree } from "../hooks/useTaxonomies";
import { flattenTree } from "../lib/tagTree";

import { Button } from "@/components/ui/button";

/**
 * Generic listing page for a user-configurable taxonomy (`/taxonomies/<slug>`), resolved from data by
 * its slug param. TanStack's static-beats-dynamic routing keeps the built-in `/taxonomies/*` segments
 * (websites, media-types, …) matching their own routes; this dynamic route serves user taxonomies.
 * A minimal v1 landing: the taxonomy's term tree with bookmark counts + a link to manage it.
 */
export const Route = createFileRoute("/taxonomies/$taxonomyKey")({
  component: TaxonomyListingPage,
});

function TaxonomyListingPage() {
  const {
    t,
  } = useTranslation();
  const {
    taxonomyKey,
  } = Route.useParams();
  const {
    taxonomy, isLoading,
  } = useTaxonomyBySlug(taxonomyKey);
  const {
    data: tree = [],
  } = useTaxonomyTermTree(taxonomy?.id);

  if (!taxonomy) {
    return (
      <section className="p-6">
        <p className="text-sm text-muted-foreground">
          {isLoading ? t("Loading…") : t("Taxonomy not found.")}
        </p>
      </section>
    );
  }

  const flat = flattenTree(tree);

  return (
    <section className="space-y-4 p-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">{taxonomy.name}</h1>
          {taxonomy.description && (
            <p className="text-sm text-muted-foreground">{taxonomy.description}</p>
          )}
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

      {flat.length === 0
        ? <p className="text-sm text-muted-foreground">{t("No terms yet. Add some from the manage page.")}</p>
        : (
          <ul className="divide-y rounded-lg border">
            {flat.map(({
              node, depth,
            }) => (
              <li
                key={node.id}
                className="flex items-center justify-between px-4 py-2 text-sm"
                style={{
                  paddingLeft: 16 + depth * 16,
                }}
              >
                <span>{node.name}</span>
                <span className="text-xs text-muted-foreground">
                  {t("{{count}} bookmarks", {
                    count: node.bookmarkCount ?? 0,
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
    </section>
  );
}
