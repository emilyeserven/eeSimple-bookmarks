import type { Website } from "@eesimple/types";

import { useState } from "react";

import { Globe } from "lucide-react";
import { z } from "zod";

import { DefaultTagsField } from "./DefaultTagsField";
import { EntityImageField } from "./EntityImageField";

import { Separator } from "@/components/ui/separator";
import { useCategories } from "@/hooks/useCategories";
import { useMediaTypes } from "@/hooks/useMediaTypes";
import { useTagTree } from "@/hooks/useTags";
import {
  useAutoWebsiteFavicon,
  useDeleteWebsiteFavicon,
  useUpdateWebsite,
  useUploadWebsiteFavicon,
} from "@/hooks/useWebsites";
import { useAppForm } from "@/lib/form";
import { CategoryIcon } from "@/lib/icons";

const websiteGeneralSchema = z.object({
  siteName: z.string().trim().min(1, "Site name is required"),
  domain: z.string().trim().min(1, "Domain is required"),
  categoryId: z.string().nullable(),
  mediaTypeId: z.string().nullable(),
});

interface Props {
  website: Website;
}

/** Edit a website's site name, domain, category, and default tags. */
export function WebsiteGeneralForm({
  website,
}: Props) {
  const updateWebsite = useUpdateWebsite();
  const uploadFavicon = useUploadWebsiteFavicon();
  const autoFavicon = useAutoWebsiteFavicon();
  const deleteFavicon = useDeleteWebsiteFavicon();
  const faviconBusy = uploadFavicon.isPending || autoFavicon.isPending || deleteFavicon.isPending;
  const [tagIds, setTagIds] = useState<string[]>(website.tagIds ?? []);
  const {
    data: categories,
  } = useCategories();
  const {
    data: mediaTypes,
  } = useMediaTypes();
  const {
    data: tagTree,
  } = useTagTree();

  const form = useAppForm({
    defaultValues: {
      siteName: website.siteName,
      domain: website.domain,
      categoryId: website.category?.id ?? null,
      mediaTypeId: website.mediaTypeId ?? null,
    },
    validators: {
      onChange: websiteGeneralSchema,
    },
    onSubmit: ({
      value,
    }) => {
      if (website.builtIn) return;
      updateWebsite.mutate({
        id: website.id,
        input: {
          siteName: value.siteName.trim(),
          domain: value.domain.trim(),
          categoryId: value.categoryId || null,
          mediaTypeId: value.mediaTypeId || null,
          tagIds,
        },
      });
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      {website.builtIn
        ? (
          <p className="text-sm text-muted-foreground">
            Built-in site — its name and domain are fixed.
          </p>
        )
        : null}

      <div
        className="
          grid gap-3
          sm:grid-cols-2
        "
      >
        <form.AppField name="siteName">
          {field => (
            <field.TextField
              label="Site name"
              disabled={website.builtIn}
            />
          )}
        </form.AppField>
        <form.AppField name="domain">
          {field => (
            <field.TextField
              label="Domain"
              disabled={website.builtIn}
            />
          )}
        </form.AppField>
      </div>

      <EntityImageField
        label="Favicon"
        imageUrl={website.imageUrl}
        shape="square"
        fallback={<Globe className="size-5" />}
        busy={faviconBusy}
        onUpload={file => uploadFavicon.mutate({
          id: website.id,
          file,
        })}
        onAuto={() => autoFavicon.mutate({
          id: website.id,
          sourceUrl: `https://${website.domain}`,
        })}
        autoLabel="Fetch favicon"
        autoError={website.faviconAutoGrabError ?? null}
        onRemove={() => deleteFavicon.mutate(website.id)}
      />

      <form.AppField name="categoryId">
        {field => (
          <field.ComboboxField
            label="Category"
            placeholder="No category"
            searchPlaceholder="Search categories…"
            emptyText="No categories found."
            options={(categories ?? []).map(category => ({
              value: category.id,
              label: category.name,
              icon: (
                <CategoryIcon
                  name={category.icon}
                  className="size-4 shrink-0"
                />
              ),
            }))}
          />
        )}
      </form.AppField>

      <form.AppField name="mediaTypeId">
        {field => (
          <field.ComboboxField
            label="Media type"
            placeholder="No media type"
            searchPlaceholder="Search media types…"
            emptyText="No media types found."
            options={(mediaTypes ?? []).map(mediaType => ({
              value: mediaType.id,
              label: mediaType.name,
              icon: (
                <CategoryIcon
                  name={mediaType.icon}
                  className="size-4 shrink-0"
                />
              ),
            }))}
          />
        )}
      </form.AppField>
      <p className="text-sm text-muted-foreground">
        Media type applied automatically to bookmarks saved from this site.
      </p>

      <Separator />

      <DefaultTagsField
        tree={tagTree ?? []}
        selectedIds={tagIds}
        onToggle={id => setTagIds(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])}
        description="Tags applied automatically to bookmarks saved from this site."
      />

      {!website.builtIn
        ? (
          <form.AppForm>
            <form.Subscribe selector={state => state.values}>
              {(values) => {
                const siteNameDirty = values.siteName.trim() !== website.siteName;
                const domainDirty = values.domain.trim() !== website.domain;
                const categoryIdDirty = (values.categoryId || null) !== (website.category?.id ?? null);
                const mediaTypeIdDirty = (values.mediaTypeId || null) !== (website.mediaTypeId ?? null);
                const tagIdsDirty = JSON.stringify([...tagIds].sort()) !== JSON.stringify([...(website.tagIds ?? [])].sort());
                return (
                  <form.SubmitButton
                    label="Save changes"
                    size="sm"
                    disabledWhen={!siteNameDirty && !domainDirty && !categoryIdDirty && !mediaTypeIdDirty && !tagIdsDirty}
                  />
                );
              }}
            </form.Subscribe>
          </form.AppForm>
        )
        : null}
    </form>
  );
}
