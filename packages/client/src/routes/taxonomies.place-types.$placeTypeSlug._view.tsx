import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { usePlaceTypeBySlug } from "../hooks/usePlaceTypes";

import i18n from "@/i18n";

export const Route = createFileRoute("/taxonomies/place-types/$placeTypeSlug/_view")({
  component: PlaceTypeViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/place-types/$placeTypeSlug/general",
    label: i18n.t("General"),
  },
] as const;

function PlaceTypeViewLayout() {
  const {
    t,
  } = useTranslation();
  const {
    placeTypeSlug,
  } = Route.useParams();
  const {
    placeType, isLoading,
  } = usePlaceTypeBySlug(placeTypeSlug);

  return (
    <TabbedEntityLayout
      header={(
        <h1
          className="
            flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
          "
        >
          {isLoading ? t("Place type") : (placeType?.name ?? t("Place type not found"))}
        </h1>
      )}
      nav={viewNav}
      params={{
        placeTypeSlug,
      }}
      navAriaLabel={t("Place type sections")}
    />
  );
}
