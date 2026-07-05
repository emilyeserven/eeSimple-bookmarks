import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { LocalizedNameLabel } from "../components/LocalizedNameLabel";
import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useTagBySlug } from "../hooks/useTags";
import i18n from "../i18n";

export const Route = createFileRoute("/tags/$tagSlug/_view")({
  component: TagViewLayout,
});

const viewNav = [
  {
    to: "/tags/$tagSlug/general",
    label: i18n.t("General"),
  },
  {
    to: "/tags/$tagSlug/categories",
    label: i18n.t("Categories"),
  },
  {
    to: "/tags/$tagSlug/hierarchy",
    label: i18n.t("Hierarchy"),
  },
  {
    type: "group",
    label: i18n.t("Rules"),
    items: [
      {
        to: "/tags/$tagSlug/autofill",
        label: i18n.t("Autofill Rules"),
      },
      {
        to: "/tags/$tagSlug/display-rules",
        label: i18n.t("Display Rules"),
      },
    ],
  },
] as const;

function TagViewLayout() {
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
        <h1 className="text-2xl font-bold">
          {isLoading
            ? t("Tag")
            : tag
              ? (
                <LocalizedNameLabel
                  names={tag.names ?? []}
                  base={tag.name}
                />
              )
              : t("Tag not found")}
        </h1>
      )}
      nav={viewNav}
      params={{
        tagSlug,
      }}
      navAriaLabel={t("Tag sections")}
    />
  );
}
