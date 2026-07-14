import type { Person } from "@eesimple/types";

import { useUpdatePerson } from "../../hooks/usePeople";
import { notifyFieldSaved } from "../../lib/autoSave";
import { CreatorMediaSection } from "../CreatorMediaSection";

interface Props {
  person: Person;
}

/**
 * The person's creator/media fields (the `creatorMedia` field): the shared `CreatorMediaSection`
 * (year + Plex link + album credits) kept whole. Saves via `useUpdatePerson` directly.
 */
export function PersonCreatorMediaEdit({
  person,
}: Props) {
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
