import type { Author, SocialLink } from "@eesimple/types";

import { Sparkles, UserCircle } from "lucide-react";

import { AuthorAvatarActions } from "./AuthorAvatarActions";
import { EntityImageField } from "./EntityImageField";
import { SocialLinksField } from "./SocialLinksField";
import { useAuthorGeneralForm } from "./useAuthorGeneralForm";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface Props {
  author: Author;
}

/** Edit an author's name, URLs, and avatar. Fields auto-save on blur (no Save button). */
export function AuthorGeneralForm({
  author,
}: Props) {
  const {
    form, avatarBusy, uploadAvatar, autoAvatar, deleteAvatar, adoptChannel, adoptWebsite,
    detectLinks, connectedChannelsWithImage, connectedWebsitesWithImage,
    saveField, saveName, detectSocialLinks, saveSocialLinks,
  } = useAuthorGeneralForm(author);

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

      <form.AppField name="authorWebsiteUrl">
        {field => (
          <field.TextField
            label="Author website URL"
            type="url"
            placeholder="https://example.com"
            onBlur={() => saveField(
              "authorWebsiteUrl",
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
        imageUrl={author.imageUrl}
        shape="circle"
        fallback={<UserCircle className="size-5" />}
        busy={avatarBusy}
        onUpload={file => uploadAvatar.mutate({
          id: author.id,
          file,
        })}
        onRemove={() => deleteAvatar.mutate(author.id)}
      />

      <AuthorAvatarActions
        author={author}
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
          disabled={detectLinks.isPending || !author.authorWebsiteUrl}
          onClick={detectSocialLinks}
        >
          <Sparkles className="size-4" />
          Detect social links from website
        </Button>
      </div>

      <SocialLinksField
        socialLinks={author.socialLinks}
        onChange={(links: SocialLink[]) => saveSocialLinks(links)}
      />
    </div>
  );
}
