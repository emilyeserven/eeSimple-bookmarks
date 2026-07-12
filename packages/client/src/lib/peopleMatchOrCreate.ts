/** Minimal shape of the create-person mutation this helper needs (matches `useCreatePerson`). */
export interface CreatePersonMutation {
  mutateAsync: (input: { name: string }) => Promise<{ id: string }>;
}

/** A parsed author name paired with whether it already exists as a Person. */
export interface ClassifiedPersonName {
  name: string;
  /** Matches an existing Person (case-insensitive) → reused, not created. */
  existing: boolean;
}

/**
 * Classify author name strings as reused (matching an existing Person) vs new (would be created),
 * mirroring {@link resolvePeopleIds}'s case-insensitive match rule. Pure — used by the Sections
 * paste-to-parse preview to show, per name, whether Parse will reuse or create a Person.
 */
export function classifyPeopleNames(
  names: string[],
  existingPeople: readonly { id: string;
    name: string; }[],
): ClassifiedPersonName[] {
  return names.map(name => ({
    name,
    existing: existingPeople.some(person => person.name.toLowerCase() === name.toLowerCase()),
  }));
}

/**
 * Resolve author name strings to Person ids: existing people are matched case-insensitively against
 * the provided cache; unknown names are created via `createPerson`. Names that can't be created
 * (e.g. a duplicate race) are skipped. Shared by the scan flow's `applyPeopleFromNames` and the
 * Sections paste-to-parse "add authors to People" action.
 */
export async function resolvePeopleIds(
  names: string[],
  existingPeople: readonly { id: string;
    name: string; }[],
  createPerson: CreatePersonMutation | undefined,
): Promise<string[]> {
  const ids: string[] = [];
  for (const name of names) {
    const normalName = name.toLowerCase();
    const match = existingPeople.find(person => person.name.toLowerCase() === normalName);
    if (match) {
      ids.push(match.id);
    }
    else if (createPerson) {
      try {
        const created = await createPerson.mutateAsync({
          name,
        });
        ids.push(created.id);
      }
      catch {
        // Skip people that can't be created (e.g. duplicate race).
      }
    }
  }
  return ids;
}
