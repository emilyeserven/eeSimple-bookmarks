import type { Person, SocialLink, UpdatePersonInput } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { Sparkles, UserCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { CreatorMediaSection } from "./CreatorMediaSection";
import { EntityImageField } from "./EntityImageField";
import { EntityNamesTabEditor } from "./entityNames/EntityNamesTab";
import { PrimaryLanguageField } from "./entityNames/PrimaryLanguageField";
import { GenreMoodAssignmentSection } from "./GenreMoodAssignmentSection";
import { LabeledWebsitesField } from "./LabeledWebsitesField";
import { PersonAvatarActions } from "./PersonAvatarActions";
import { SocialLinksField } from "./SocialLinksField";
import { usePersonAvatarField } from "./usePersonAvatarField";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useImageTaxonomySyncRegistration } from "../hooks/useImageTaxonomySyncRegistration";
import { useDetectPersonSocialLinks, useUpdatePerson } from "../hooks/usePeople";
import { usePrimaryLanguageField } from "../hooks/usePrimaryLanguageField";
import { notifyFieldSaved } from "../lib/autoSave";
import { useAppForm } from "../lib/form";
import { labeledWebsiteSchema } from "../lib/labeledWebsites";
import { notifySuccess } from "../lib/notifications";
import { SOCIAL_MEDIA_PLATFORM_LABELS, socialLinkSchema } from "../lib/socialLinks";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

/**
 * The person General form, now split into per-field placeable edit sub-components (#1194 composite
 * extraction). Each sub-component is **independently backed** — its own `useFieldAutoSave` / react-query
 * hook, no shared form controller — following the Category "independently-backed" shape (name→primary-
 * language sync coordinates through react-query, not one `useAppForm`). `PersonGeneralForm` at the bottom
 * recomposes them so the standalone form (its Storybook story) renders unchanged.
 */

interface PersonFieldProps {
  person: Person;
}

const detailsSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string(),
});

const DETAILS_LABELS: Partial<Record<keyof UpdatePersonInput, string>> = {
  name: "Name",
  description: "Description",
};

const LABELED_WEBSITES_LABELS: Partial<Record<keyof UpdatePersonInput, string>> = {
  labeledWebsites: "Websites",
};

const SOCIAL_LINKS_LABELS: Partial<Record<keyof UpdatePersonInput, string>> = {
  socialLinks: "Social media links",
};

const labeledWebsitesFieldSchema = z.array(labeledWebsiteSchema);
const socialLinksFieldSchema = z.array(socialLinkSchema);

/**
 * Name + Description core (the `details` field). The two share one `useAppForm`, so they stay one
 * placeable unit (mirrors `CategoryDetailsFields`). Name auto-saves on blur — following the new slug —
 * and re-syncs the primary-language name value via the react-query-backed `usePrimaryLanguageField`
 * (coordinating with the standalone `PersonPrimaryLanguageEdit` field through the shared cache).
 */
export function PersonDetailsFields({
  person,
}: PersonFieldProps) {
  const {
    t,
  } = useTranslation();
  const navigate = useNavigate();
  const update = useUpdatePerson();
  const primaryLanguage = usePrimaryLanguageField("person", person.id);
  const autoSave = useFieldAutoSave<UpdatePersonInput, Person>({
    id: person.id,
    update,
    labels: DETAILS_LABELS,
    initial: {
      name: person.name,
      description: person.description ?? null,
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: person.name,
      description: person.description ?? "",
    },
    validators: {
      onChange: detailsSchema,
    },
  });

  return (
    <div className="space-y-4">
      <form.AppField name="name">
        {field => (
          <field.TextField
            label={t("Name")}
            onBlur={() => {
              const trimmed = field.state.value.trim();
              autoSave.saveField("name", trimmed, {
                valid: field.state.meta.errors.length === 0,
                // Renaming changes the slug; follow it so the edit page keeps resolving.
                onSuccess: (updated) => {
                  if (updated.slug !== person.slug) {
                    void navigate({
                      to: "/taxonomies/people/$personSlug/edit",
                      params: {
                        personSlug: updated.slug,
                      },
                    });
                  }
                },
              });
              primaryLanguage.syncPrimaryValue(trimmed);
            }}
          />
        )}
      </form.AppField>
      <form.AppField name="description">
        {field => (
          <field.TextareaField
            label={t("Description")}
            onBlur={() => autoSave.saveField(
              "description",
              field.state.value.trim() || null,
              {
                valid: field.state.meta.errors.length === 0,
              },
            )}
          />
        )}
      </form.AppField>
    </div>
  );
}

/**
 * The person's primary-language picker (the `primaryLanguage` field). Mounts its own react-query-backed
 * `usePrimaryLanguageField`, so it coordinates with the name field's sync via the shared cache.
 */
export function PersonPrimaryLanguageEdit({
  person,
}: PersonFieldProps) {
  const primaryLanguage = usePrimaryLanguageField("person", person.id);
  return (
    <PrimaryLanguageField
      value={primaryLanguage.primaryLanguageId}
      onValueChange={v => primaryLanguage.setPrimaryLanguage(v, person.name)}
    />
  );
}

/** The person's additional-names editor (the `names` field). Self-saving via `EntityNamesTabEditor`. */
export function PersonNamesEdit({
  person,
}: PersonFieldProps) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-1">
      <Label>{t("Names")}</Label>
      <EntityNamesTabEditor
        ownerType="person"
        ownerId={person.id}
      />
    </div>
  );
}

/** The person's labeled-website rows (the `labeledWebsites` field). Auto-saves the whole array on change. */
export function PersonLabeledWebsitesEdit({
  person,
}: PersonFieldProps) {
  const update = useUpdatePerson();
  const autoSave = useFieldAutoSave<UpdatePersonInput, Person>({
    id: person.id,
    update,
    labels: LABELED_WEBSITES_LABELS,
    initial: {
      labeledWebsites: person.labeledWebsites,
    },
  });
  return (
    <LabeledWebsitesField
      labeledWebsites={person.labeledWebsites}
      onChange={links => autoSave.saveField(
        "labeledWebsites",
        links,
        {
          valid: labeledWebsitesFieldSchema.safeParse(links).success,
        },
      )}
    />
  );
}

/**
 * The person's avatar (the `avatar` field): the image control + the "fetch from a connected source"
 * actions, plus the header "Sync from source" registration (preview + re-fetch the avatar from the
 * person's labeled-website og:image). Independently backed via `usePersonAvatarField`.
 */
export function PersonAvatarEdit({
  person,
}: PersonFieldProps) {
  const {
    t,
  } = useTranslation();
  const avatar = usePersonAvatarField(person);

  // Only offered when the list carries a source URL — the middleware picks the "Website" row, else the
  // first listed URL (see `sourceUrlFromLabeled`).
  const avatarSource = person.labeledWebsites.some(w => w.url.trim().length > 0) ? "website" : null;
  useImageTaxonomySyncRegistration({
    entityId: person.id,
    entityLabel: person.name,
    sourceLabel: t("Website"),
    previewKind: "person",
    currentImageUrl: person.imageUrl ?? null,
    personSource: avatarSource ?? undefined,
    applyImage: avatarSource
      ? () => avatar.autoAvatar.mutate({
        id: person.id,
        source: avatarSource,
      })
      : null,
  });

  return (
    <div className="space-y-2">
      <EntityImageField
        label={t("Avatar")}
        imageUrl={person.imageUrl}
        shape="circle"
        fallback={<UserCircle className="size-5" />}
        busy={avatar.avatarBusy}
        onUpload={file => avatar.uploadAvatar.mutate({
          id: person.id,
          file,
        })}
        onRemove={() => avatar.deleteAvatar.mutate(person.id)}
      />
      <PersonAvatarActions
        person={person}
        avatarBusy={avatar.avatarBusy}
        autoAvatar={avatar.autoAvatar}
        adoptChannel={avatar.adoptChannel}
        adoptWebsite={avatar.adoptWebsite}
        connectedChannelsWithImage={avatar.connectedChannelsWithImage}
        connectedWebsitesWithImage={avatar.connectedWebsitesWithImage}
      />
    </div>
  );
}

/**
 * The person's social links (the `socialLinks` field): a "Detect from website" button + the per-platform
 * URL rows. Auto-saves the whole array on change; detection merges new platforms and saves.
 */
export function PersonSocialLinksEdit({
  person,
}: PersonFieldProps) {
  const {
    t,
  } = useTranslation();
  const update = useUpdatePerson();
  const detectLinks = useDetectPersonSocialLinks();
  const autoSave = useFieldAutoSave<UpdatePersonInput, Person>({
    id: person.id,
    update,
    labels: SOCIAL_LINKS_LABELS,
    initial: {
      socialLinks: person.socialLinks,
    },
  });
  const hasSource = person.labeledWebsites.some(w => w.url.trim().length > 0);

  function saveSocialLinks(links: SocialLink[]): void {
    autoSave.saveField("socialLinks", links, {
      valid: socialLinksFieldSchema.safeParse(links).success,
    });
  }

  function detectSocialLinks(): void {
    detectLinks.mutate(person.id, {
      onSuccess: ({
        detected,
      }) => {
        if (detected.length === 0) {
          notifySuccess(t("No new social links found on the person's website"));
          return;
        }
        const existingPlatforms = new Set(person.socialLinks.map(l => l.platform));
        const toAdd = detected.filter(l => !existingPlatforms.has(l.platform));
        if (toAdd.length === 0) {
          notifySuccess(t("Social links already up to date"));
          return;
        }
        const merged = [...person.socialLinks, ...toAdd];
        saveSocialLinks(merged);
        const names = toAdd.map(l => SOCIAL_MEDIA_PLATFORM_LABELS[l.platform]).join(", ");
        notifySuccess(`Found ${toAdd.length === 1 ? "a link" : "links"}: ${names}`);
      },
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={detectLinks.isPending || !hasSource}
        onClick={detectSocialLinks}
      >
        <Sparkles className="size-4" />
        {t("Detect social links from website")}
      </Button>
      <SocialLinksField
        socialLinks={person.socialLinks}
        onChange={saveSocialLinks}
      />
    </div>
  );
}

/**
 * The person's creator/media fields (the `creatorMedia` field): the shared `CreatorMediaSection`
 * (year + Plex link + album credits) kept whole. Saves via `useUpdatePerson` directly.
 */
export function PersonCreatorMediaEdit({
  person,
}: PersonFieldProps) {
  const update = useUpdatePerson();
  return (
    <CreatorMediaSection
      year={person.year}
      plexRatingKey={person.plexRatingKey}
      plexItemTitle={person.plexItemTitle}
      save={(input, label) => update.mutate(
        {
          id: person.id,
          input,
        },
        {
          onSuccess: () => notifyFieldSaved(label),
        },
      )}
    />
  );
}

/** The person's genres & moods (the edit-only `genreMoods` field). */
export function PersonGenreMoodsEdit({
  person,
}: PersonFieldProps) {
  return (
    <GenreMoodAssignmentSection
      ownerType="person"
      ownerId={person.id}
    />
  );
}

interface Props {
  person: Person;
}

/**
 * Edit a person's name, URLs, avatar, social links, and creator/media fields. Each field auto-saves (no
 * Save button). Recomposed from the same placeable sub-fields the person workbench registry uses, so this
 * whole-form shell (its Storybook story) stays in lockstep with the layout-driven General tab.
 */
export function PersonGeneralForm({
  person,
}: Props) {
  return (
    <div className="space-y-4">
      <PersonDetailsFields person={person} />
      <PersonPrimaryLanguageEdit person={person} />
      <PersonNamesEdit person={person} />
      <PersonLabeledWebsitesEdit person={person} />
      <PersonAvatarEdit person={person} />
      <Separator />
      <PersonSocialLinksEdit person={person} />
      <Separator />
      <PersonCreatorMediaEdit person={person} />
      <Separator />
      <PersonGenreMoodsEdit person={person} />
    </div>
  );
}
