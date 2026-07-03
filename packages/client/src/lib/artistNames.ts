import type { Artist, CreateArtistInput } from "@eesimple/types";

/** The subset of `useCreateArtist()` the name-resolver needs (async find-or-create). */
interface CreateArtistMutation {
  mutateAsync: (input: CreateArtistInput) => Promise<Artist>;
}

/** Split a semicolon-delimited artist string into trimmed, non-empty names. */
export function splitArtistNames(value: string): string[] {
  return value
    .split(";")
    .map(part => part.trim())
    .filter(part => part.length > 0);
}

/**
 * Resolve a list of artist names to ids: existing artists match case-insensitively; unknown names
 * are created. Mirrors `applyPeopleFromNames` (a duplicate-race create just skips that name).
 * Returns the resolved ids with duplicates removed.
 */
export async function resolveArtistNames(
  names: string[],
  existing: readonly Artist[],
  createArtist: CreateArtistMutation,
): Promise<string[]> {
  const ids: string[] = [];
  for (const name of names) {
    const normal = name.toLowerCase();
    const match = existing.find(artist => artist.name.toLowerCase() === normal);
    if (match) {
      ids.push(match.id);
      continue;
    }
    try {
      const created = await createArtist.mutateAsync({
        name,
      });
      ids.push(created.id);
    }
    catch {
      // Skip artists that can't be created (e.g. duplicate race).
    }
  }
  return [...new Set(ids)];
}
