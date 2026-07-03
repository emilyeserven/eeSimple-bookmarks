import type { CreatePersonInput, Person } from "@eesimple/types";

/** The subset of `useCreatePerson()` the name-resolver needs (async find-or-create). */
interface CreatePersonMutation {
  mutateAsync: (input: CreatePersonInput) => Promise<Person>;
}

/** Split a semicolon-delimited credit string into trimmed, non-empty names. */
export function splitCreditNames(value: string): string[] {
  return value
    .split(";")
    .map(part => part.trim())
    .filter(part => part.length > 0);
}

/**
 * Resolve a list of credit names to Person ids: existing people match case-insensitively; unknown
 * names are created. Mirrors `applyPeopleFromNames` (a duplicate-race create just skips that name).
 * Returns the resolved ids with duplicates removed. Group artists can be re-credited to Publishers by
 * hand afterward — this find-or-creates individuals only.
 */
export async function resolvePersonNames(
  names: string[],
  existing: readonly Person[],
  createPerson: CreatePersonMutation,
): Promise<string[]> {
  const ids: string[] = [];
  for (const name of names) {
    const normal = name.toLowerCase();
    const match = existing.find(person => person.name.toLowerCase() === normal);
    if (match) {
      ids.push(match.id);
      continue;
    }
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
  return [...new Set(ids)];
}
