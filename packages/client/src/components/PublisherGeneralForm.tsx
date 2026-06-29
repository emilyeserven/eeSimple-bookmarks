import type { Publisher, SocialLink, UpdatePublisherInput } from "@eesimple/types";

import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";
import { Globe } from "lucide-react";
import { z } from "zod";

import { AddWebsiteModal } from "./AddWebsiteModal";
import { SocialLinksField } from "./SocialLinksField";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useUpdatePublisher } from "../hooks/usePublishers";
import { useWebsites } from "../hooks/useWebsites";
import { useAppForm } from "../lib/form";
import { socialLinkSchema } from "../lib/socialLinks";

import { Separator } from "@/components/ui/separator";

const publisherGeneralSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  romanizedName: z.string(),
  websiteId: z.string().nullable(),
  socialLinks: z.array(socialLinkSchema),
});

const LABELS: Partial<Record<keyof UpdatePublisherInput, string>> = {
  name: "Name",
  romanizedName: "Romanized name",
  websiteId: "Website",
  socialLinks: "Social media links",
};

interface Props {
  publisher: Publisher;
}

/** Edit a publisher's name and associated website. Fields auto-save individually (no Save button). */
export function PublisherGeneralForm({
  publisher,
}: Props) {
  const navigate = useNavigate();
  const update = useUpdatePublisher();
  const [addWebsiteOpen, setAddWebsiteOpen] = useState(false);
  const {
    data: websites,
  } = useWebsites();

  const autoSave = useFieldAutoSave<UpdatePublisherInput, Publisher>({
    id: publisher.id,
    update,
    labels: LABELS,
    initial: {
      name: publisher.name,
      romanizedName: publisher.romanizedName ?? "",
      websiteId: publisher.websiteId ?? null,
      socialLinks: publisher.socialLinks,
    },
  });

  const websiteOptions = (websites ?? []).map(website => ({
    value: website.id,
    label: website.siteName,
    icon: (
      <Globe className="size-4 shrink-0 text-muted-foreground" />
    ),
  }));

  const form = useAppForm({
    defaultValues: {
      name: publisher.name,
      romanizedName: publisher.romanizedName ?? "",
      websiteId: publisher.websiteId ?? null,
    },
    validators: {
      onChange: publisherGeneralSchema,
    },
  });

  return (
    <div className="space-y-4">
      <form.AppField name="name">
        {field => (
          <field.TextField
            label="Name"
            onBlur={() => autoSave.saveField(
              "name",
              field.state.value.trim(),
              {
                valid: field.state.meta.errors.length === 0,
                // Renaming changes the slug; follow it so the edit page keeps resolving.
                onSuccess: (updated) => {
                  if (updated.slug !== publisher.slug) {
                    void navigate({
                      to: "/taxonomies/publishers/$publisherSlug/edit/general",
                      params: {
                        publisherSlug: updated.slug,
                      },
                    });
                  }
                },
              },
            )}
          />
        )}
      </form.AppField>

      <form.AppField name="romanizedName">
        {field => (
          <field.TextField
            label="Romanized name"
            placeholder="Optional romanized form"
            onBlur={() => autoSave.saveField("romanizedName", field.state.value.trim())}
          />
        )}
      </form.AppField>

      <form.AppField name="websiteId">
        {field => (
          <field.ComboboxField
            label="Website"
            placeholder="No website"
            searchPlaceholder="Search websites…"
            emptyText="No websites found."
            options={websiteOptions}
            createOption={{
              label: "Add website",
              onSelect: () => setAddWebsiteOpen(true),
            }}
            onValueChange={value => autoSave.saveField("websiteId", value || null)}
          />
        )}
      </form.AppField>
      <AddWebsiteModal
        open={addWebsiteOpen}
        onOpenChange={setAddWebsiteOpen}
        onCreated={website => form.setFieldValue("websiteId", website.id)}
      />

      <Separator />

      <SocialLinksField
        socialLinks={publisher.socialLinks}
        onChange={(links: SocialLink[]) => autoSave.saveField("socialLinks", links)}
      />
    </div>
  );
}
