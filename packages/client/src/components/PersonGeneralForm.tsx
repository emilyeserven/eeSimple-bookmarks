import type { Person, SocialLink } from "@eesimple/types";

import { Sparkles, UserCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { CreatorMediaSection } from "./CreatorMediaSection";
import { EntityImageField } from "./EntityImageField";
import { EntityNamesTabEditor } from "./entityNames/EntityNamesTab";
import { PrimaryLanguageField } from "./entityNames/PrimaryLanguageField";
import { GenreMoodAssignmentSection } from "./GenreMoodAssignmentSection";
import { LabeledWebsitesField } from "./LabeledWebsitesField";
import { PersonAvatarActions } from "./PersonAvatarActions";
import { SocialLinksField } from "./SocialLinksField";
import { usePersonGeneralForm } from "./usePersonGeneralForm";
import { useImageTaxonomySyncRegistration } from "../hooks/useImageTaxonomySyncRegistration";
import { useUpdatePerson } from "../hooks/usePeople";
import { usePrimaryLanguageField } from "../hooks/usePrimaryLanguageField";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { notifyFieldSaved } from "@/lib/autoSave";

interface Props {
  person: Person;
}

/** Edit an person's name, URLs, avatar, and creator/media fields. Fields auto-save (no Save button). */
export function PersonGeneralForm({
  person,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    form, avatarBusy, uploadAvatar, autoAvatar, deleteAvatar, adoptChannel, adoptWebsite,
    detectLinks, connectedChannelsWithImage, connectedWebsitesWithImage,
    saveField, saveName, detectSocialLinks, saveSocialLinks, saveLabeledWebsites,
  } = usePersonGeneralForm(person);
  const updatePerson = useUpdatePerson();
  const primaryLanguage = usePrimaryLanguageField("person", person.id);

  // Register the header "Sync from source" button (preview + re-fetch the avatar from the person's
  // labeled-website og:image). Only offered when the list carries a source URL — the middleware
  // picks the "Website" row, else the first listed URL (see `sourceUrlFromLabeled`).
  const avatarSource = person.labeledWebsites.some(w => w.url.trim().length > 0) ? "website" : null;
  useImageTaxonomySyncRegistration({
    entityId: person.id,
    entityLabel: person.name,
    sourceLabel: t("Website"),
    previewKind: "person",
    currentImageUrl: person.imageUrl ?? null,
    personSource: avatarSource ?? undefined,
    applyImage: avatarSource
      ? () => autoAvatar.mutate({
        id: person.id,
        source: avatarSource,
      })
      : null,
  });

  return (
    <div className="space-y-4">
      <form.AppField name="name">
        {field => (
          <field.TextField
            label={t("Name")}
            onBlur={() => {
              saveName(field.state.value, field.state.meta.errors.length === 0);
              primaryLanguage.syncPrimaryValue(field.state.value.trim());
            }}
          />
        )}
      </form.AppField>

      <form.AppField name="description">
        {field => (
          <field.TextareaField
            label={t("Description")}
            onBlur={() => saveField(
              "description",
              field.state.value.trim() || null,
              {
                valid: field.state.meta.errors.length === 0,
              },
            )}
          />
        )}
      </form.AppField>

      <PrimaryLanguageField
        value={primaryLanguage.primaryLanguageId}
        onValueChange={v => primaryLanguage.setPrimaryLanguage(v, form.state.values.name)}
      />

      <div className="space-y-1">
        <Label>{t("Names")}</Label>
        <EntityNamesTabEditor
          ownerType="person"
          ownerId={person.id}
        />
      </div>

      <LabeledWebsitesField
        labeledWebsites={person.labeledWebsites}
        onChange={saveLabeledWebsites}
      />

      <EntityImageField
        label={t("Avatar")}
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
          disabled={detectLinks.isPending || avatarSource === null}
          onClick={detectSocialLinks}
        >
          <Sparkles className="size-4" />
          {t("Detect social links from website")}
        </Button>
      </div>

      <SocialLinksField
        socialLinks={person.socialLinks}
        onChange={(links: SocialLink[]) => saveSocialLinks(links)}
      />

      <Separator />

      <CreatorMediaSection
        year={person.year}
        plexRatingKey={person.plexRatingKey}
        plexItemTitle={person.plexItemTitle}
        albumIds={person.albumIds}
        save={(input, label) => updatePerson.mutate(
          {
            id: person.id,
            input,
          },
          {
            onSuccess: () => notifyFieldSaved(label),
          },
        )}
      />

      <Separator />

      <GenreMoodAssignmentSection
        ownerType="person"
        ownerId={person.id}
      />
    </div>
  );
}
