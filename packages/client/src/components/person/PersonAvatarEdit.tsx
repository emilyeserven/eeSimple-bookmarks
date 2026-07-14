import type { Person } from "@eesimple/types";

import { UserCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useImageTaxonomySyncRegistration } from "../../hooks/useImageTaxonomySyncRegistration";
import { EntityImageField } from "../EntityImageField";
import { PersonAvatarActions } from "../PersonAvatarActions";
import { usePersonAvatarField } from "../usePersonAvatarField";

interface Props {
  person: Person;
}

/**
 * The person's avatar (the `avatar` field): the image control + the "fetch from a connected source"
 * actions, plus the header "Sync from source" registration (preview + re-fetch the avatar from the
 * person's labeled-website og:image). Independently backed via `usePersonAvatarField`.
 */
export function PersonAvatarEdit({
  person,
}: Props) {
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
