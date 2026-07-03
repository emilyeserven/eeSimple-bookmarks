import type { Person, SocialLink } from "@eesimple/types";

import { Sparkles, UserCircle } from "lucide-react";

import { EntityImageField } from "./EntityImageField";
import { PersonAvatarActions } from "./PersonAvatarActions";
import { SocialLinksField } from "./SocialLinksField";
import { usePersonGeneralForm } from "./usePersonGeneralForm";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface Props {
  person: Person;
}

/** Edit an person's name, URLs, and avatar. Fields auto-save on blur (no Save button). */
export function PersonGeneralForm({
  person,
}: Props) {
  const {
    form, avatarBusy, uploadAvatar, autoAvatar, deleteAvatar, adoptChannel, adoptWebsite,
    detectLinks, connectedChannelsWithImage, connectedWebsitesWithImage,
    saveField, saveName, detectSocialLinks, saveSocialLinks,
  } = usePersonGeneralForm(person);

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

      <form.AppField name="personWebsiteUrl">
        {field => (
          <field.TextField
            label="Person website URL"
            type="url"
            placeholder="https://example.com"
            onBlur={() => saveField(
              "personWebsiteUrl",
              field.state.value.trim() || null,
            )}
          />
        )}
      </form.AppField>

      <form.AppField name="biographyUrl">
        {field => (
          <field.TextField
            label="Biography URL"
            type="url"
            placeholder="https://example.com/bio"
            onBlur={() => saveField(
              "biographyUrl",
              field.state.value.trim() || null,
            )}
          />
        )}
      </form.AppField>

      <EntityImageField
        label="Avatar"
        imageUrl={person.imageUrl}
        shape="circle"
        fallback={<UserCircle className="size-5" />}
        busy={avatarBusy}
        onUpload={file => uploadAvatar.mutate({
          id: person.id,
          file,
        })}
        onRemove={() => deleteAvatar.mutate(person.id)}
      />

      <PersonAvatarActions
        person={person}
        avatarBusy={avatarBusy}
        autoAvatar={autoAvatar}
        adoptChannel={adoptChannel}
        adoptWebsite={adoptWebsite}
        connectedChannelsWithImage={connectedChannelsWithImage}
        connectedWebsitesWithImage={connectedWebsitesWithImage}
      />

      <Separator />

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={detectLinks.isPending || !person.personWebsiteUrl}
          onClick={detectSocialLinks}
        >
          <Sparkles className="size-4" />
          Detect social links from website
        </Button>
      </div>

      <SocialLinksField
        socialLinks={person.socialLinks}
        onChange={(links: SocialLink[]) => saveSocialLinks(links)}
      />
    </div>
  );
}
