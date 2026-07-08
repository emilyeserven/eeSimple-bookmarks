import type { CustomProperty } from "@eesimple/types";

import { useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { PropertyForm } from "../components/PropertyForm";
import { useCategories } from "../hooks/useCategories";
import { useCreateCustomProperty, useCustomProperties } from "../hooks/useCustomProperties";
import { useMediaTypes } from "../hooks/useMediaTypes";

export const Route = createFileRoute("/custom-properties/new")({
  component: NewCustomPropertyPage,
});

function NewCustomPropertyPage() {
  const {
    t,
  } = useTranslation();
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();
  const {
    data: properties,
  } = useCustomProperties();
  const {
    data: categories,
  } = useCategories();
  const {
    data: mediaTypes,
  } = useMediaTypes();
  const createProperty = useCreateCustomProperty();

  const numberProperties = (properties ?? []).filter(property => property.type === "number");

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <Link
          to="/custom-properties"
          className="
            inline-block text-sm text-muted-foreground
            hover:text-foreground
          "
        >
          {t("← Back to custom properties")}
        </Link>
        <h1 className="text-2xl font-bold">{t("New custom property")}</h1>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <PropertyForm
          mode="create"
          categories={categories ?? []}
          mediaTypes={mediaTypes ?? []}
          numberProperties={numberProperties}
          onSubmit={payload => createProperty.mutate(payload, {
            onSuccess: (created) => {
              // Seed the list cache so the destination view finds the property before the refetch.
              queryClient.setQueryData<CustomProperty[]>(
                ["custom-properties"],
                prev => (prev ? [...prev, created] : [created]),
              );
              void navigate({
                to: "/custom-properties/$propertySlug",
                params: {
                  propertySlug: created.slug,
                },
              });
            },
          })}
          submitLabel={t("Add property")}
          pendingLabel={t("Adding…")}
          errorMessage={createProperty.isError ? createProperty.error.message : undefined}
          idPrefix="new-property-category"
        />
      </div>
    </section>
  );
}
