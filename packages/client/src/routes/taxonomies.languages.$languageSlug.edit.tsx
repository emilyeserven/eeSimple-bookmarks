import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useLanguageBySlug } from "../hooks/useLanguages";

export const Route = createFileRoute("/taxonomies/languages/$languageSlug/edit")({
  component: LanguageEditLayout,
});

const editNav = [
  {
    to: "/taxonomies/languages/$languageSlug/edit/general",
    label: "General",
  },
] as const;

function LanguageEditLayout() {
  const {
    languageSlug,
  } = Route.useParams();
  const {
    language, isLoading,
  } = useLanguageBySlug(languageSlug);

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/languages/$languageSlug"
            params={{
              languageSlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to {isLoading
              ? "language"
              : (language?.name ?? "language")}
          </Link>
          <h1 className="text-2xl font-bold">Edit language</h1>
        </div>
      )}
      nav={editNav}
      params={{
        languageSlug,
      }}
      navAriaLabel="Language edit sections"
    />
  );
}
