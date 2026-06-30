import type { Publisher, SocialLink } from "@eesimple/types";

import { AddWebsiteModal } from "./AddWebsiteModal";
import { SocialLinksField } from "./SocialLinksField";
import { usePublisherGeneralForm } from "./usePublisherGeneralForm";

import { Separator } from "@/components/ui/separator";

interface Props {
  publisher: Publisher;
}

/** Edit a publisher's name and associated website. Fields auto-save individually (no Save button). */
export function PublisherGeneralForm({
  publisher,
}: Props) {
  const {
    form, saveField, saveName, websiteOptions, addWebsiteOpen, setAddWebsiteOpen,
  } = usePublisherGeneralForm(publisher);

  return (
    <div className="space-y-4">
      <form.AppField name="name">
        {field => (
          <field.TextField
            label="Name"
            onBlur={() => saveName(field.state.value, field.state.meta.errors.length === 0)}
          />
        )}
      </form.AppField>

      <form.AppField name="romanizedName">
        {field => (
          <field.TextField
            label="Romanized name"
            placeholder="Optional romanized form"
            onBlur={() => saveField("romanizedName", field.state.value.trim())}
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
            onValueChange={value => saveField("websiteId", value || null)}
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
        onChange={(links: SocialLink[]) => saveField("socialLinks", links)}
      />
    </div>
  );
}
