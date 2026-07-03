import { createFileRoute } from "@tanstack/react-router";

import { RomanizedLabel } from "../components/RomanizedLabel";
import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useTagBySlug } from "../hooks/useTags";

export const Route = createFileRoute("/tags/$tagSlug/_view")({
  component: TagViewLayout,
});

const viewNav = [
  {
    to: "/tags/$tagSlug/general",
    label: "General",
  },
  {
    to: "/tags/$tagSlug/categories",
    label: "Categories",
  },
  {
    to: "/tags/$tagSlug/hierarchy",
    label: "Hierarchy",
  },
  {
    type: "group",
    label: "Rules",
    items: [
      {
        to: "/tags/$tagSlug/autofill",
        label: "Autofill Rules",
      },
      {
        to: "/tags/$tagSlug/display-rules",
        label: "Display Rules",
      },
    ],
  },
] as const;

function TagViewLayout() {
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
            ? "Tag"
            : tag
              ? (
                <RomanizedLabel
                  name={tag.name}
                  romanized={tag.romanizedName}
                />
              )
              : "Tag not found"}
        </h1>
      )}
      nav={viewNav}
      params={{
        tagSlug,
      }}
      navAriaLabel="Tag sections"
    />
  );
}
