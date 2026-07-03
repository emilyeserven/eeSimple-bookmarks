import { createFileRoute } from "@tanstack/react-router";

import { LanguagesListing } from "../components/LanguageManager";
import { useLanguages } from "../hooks/useLanguages";

import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/taxonomies/languages/")({
  component: LanguagesPage,
});

/** Manage the "Languages" taxonomy used by bookmark content classification. */
function LanguagesPage() {
  const {
    data: languages,
  } = useLanguages();

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Languages</h1>
          {languages
            ? (
              <Badge variant="secondary">
                {languages.length}
              </Badge>
            )
            : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Classify what language a bookmark&apos;s content is in. Auto-detected from a scanned page,
          ISBN lookup, or YouTube video when possible.
        </p>
      </div>

      <LanguagesListing />
    </section>
  );
}
