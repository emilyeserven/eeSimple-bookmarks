import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useDeleteLanguage, useLanguageBySlug } from "../hooks/useLanguages";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/taxonomies/languages/$languageSlug/_view")({
  component: LanguageViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/languages/$languageSlug/general",
    label: "General",
  },
] as const;

function LanguageViewLayout() {
  const {
    languageSlug,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const {
    language, isLoading,
  } = useLanguageBySlug(languageSlug);
  const deleteLanguage = useDeleteLanguage();

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/languages"
            className="
              inline-block text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to languages
          </Link>
          <div className="flex items-start justify-between gap-4">
            <h1
              className="
                flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
              "
            >
              {isLoading
                ? "Language"
                : (language?.name ?? "Language not found")}
            </h1>
            {language
              ? (
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                  >
                    <Link
                      to="/taxonomies/languages/$languageSlug/edit/general"
                      params={{
                        languageSlug,
                      }}
                    >
                      Edit
                    </Link>
                  </Button>
                  {language.builtIn
                    ? null
                    : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="
                          text-destructive
                          hover:text-destructive
                        "
                        disabled={deleteLanguage.isPending}
                        onClick={() => deleteLanguage.mutate(language.id, {
                          onSuccess: () => navigate({
                            to: "/taxonomies/languages",
                          }),
                        })}
                      >
                        {deleteLanguage.isPending ? "Deleting…" : "Delete"}
                      </Button>
                    )}
                </div>
              )
              : null}
          </div>
        </div>
      )}
      nav={viewNav}
      params={{
        languageSlug,
      }}
      navAriaLabel="Language sections"
    />
  );
}
