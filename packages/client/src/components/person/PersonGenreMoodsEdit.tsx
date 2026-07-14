import type { Person } from "@eesimple/types";

import { GenreMoodAssignmentSection } from "../GenreMoodAssignmentSection";

interface Props {
  person: Person;
}

/** The person's genres & moods (the edit-only `genreMoods` field). */
export function PersonGenreMoodsEdit({
  person,
}: Props) {
  return (
    <GenreMoodAssignmentSection
      ownerType="person"
      ownerId={person.id}
    />
  );
}
