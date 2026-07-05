import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useTagBySlug } from "../hooks/useTags";

import i18n from "@/i18n";

export const Route = createFileRoute("/tags/$tagSlug/edit")({
  component: TagEditLayout,
});

const editNav = [
  {
    to: "/tags/$tagSlug/edit/general",
    label: i18n.t("General"),
  },
  {
    to: "/tags/$tagSlug/edit/categories",
    label: i18n.t("Categories"),
  },
  {
    type: "group",
    label: i18n.t("Rules"),
    items: [
      {
        to: "/tags/$tagSlug/edit/autofill",
        label: i18n.t("Autofill Rules"),
      },
      {
        to: "/tags/$tagSlug/edit/display-rules",
        label: i18n.t("Display Rules"),
      },
    ],
  },
] as const;

function TagEditLayout() {
  const {
    t,
  } = useTranslation();
  const {
    tagSlug,
  } = Route.useParams();
  const {
    tag, isLoading,
  } = useTagBySlug(tagSlug);

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/tags/$tagSlug"
            params={{
              tagSlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            {t("← Back to {{name}}", {
              name: isLoading ? t("tag") : (tag?.name ?? t("tag")),
            })}
          </Link>
          <h1 className="text-2xl font-bold">{t("Edit tag")}</h1>
        </div>
      )}
      nav={editNav}
      params={{
        tagSlug,
      }}
      navAriaLabel={t("Tag edit sections")}
    />
  );
}
