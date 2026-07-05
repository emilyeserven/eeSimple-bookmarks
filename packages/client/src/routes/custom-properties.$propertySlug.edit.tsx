import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { usePropertyBySlug } from "../hooks/useCustomProperties";
import { hasPropertyOptions } from "../lib/propertyForm";

export const Route = createFileRoute("/custom-properties/$propertySlug/edit")({
  component: CustomPropertyEditLayout,
});

function CustomPropertyEditLayout() {
  const {
    t,
  } = useTranslation();
  const {
    propertySlug,
  } = Route.useParams();
  const {
    property, isLoading,
  } = usePropertyBySlug(propertySlug);

  // The "Options" tab only exists when the property has options (number / calculate / datetime).
  const editNav = [
    {
      to: "/custom-properties/$propertySlug/edit/general",
      label: t("General"),
    },
    ...(property && hasPropertyOptions(property)
      ? [{
        to: "/custom-properties/$propertySlug/edit/options",
        label: t("Options"),
      }] as const
      : []),
    {
      to: "/custom-properties/$propertySlug/edit/categories",
      label: t("Categories"),
    },
    {
      to: "/custom-properties/$propertySlug/edit/media-types",
      label: t("Media Types"),
    },
    {
      to: "/custom-properties/$propertySlug/edit/display",
      label: t("Display"),
    },
    {
      type: "group",
      label: t("Rules"),
      items: [
        {
          to: "/custom-properties/$propertySlug/edit/autofill",
          label: t("Autofill Rules"),
        },
        {
          to: "/custom-properties/$propertySlug/edit/display-rules",
          label: t("Display Rules"),
        },
      ],
    },
  ] as const;

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/custom-properties/$propertySlug"
            params={{
              propertySlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            {t("← Back to custom property")}
          </Link>
          <h1 className="text-2xl font-bold">
            {isLoading ? t("Edit custom property") : (property?.name ?? t("Custom property not found"))}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("Edit the general details, options, categories, display, and autofill rules for this property.")}
          </p>
        </div>
      )}
      nav={editNav}
      params={{
        propertySlug,
      }}
      navAriaLabel={t("Custom property settings sections")}
    />
  );
}
