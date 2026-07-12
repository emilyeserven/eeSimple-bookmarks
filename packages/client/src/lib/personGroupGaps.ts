import type { Person } from "@eesimple/types";

/** A credited person who is missing membership in one or more of the bookmark's groups. */
export interface PersonGroupGap {
  person: Person;
  /** The bookmark's group ids this person is not yet a member of. */
  missingGroupIds: string[];
}

/**
 * For each person credited on the bookmark, the bookmark's group ids they are not already a member
 * of. Only people with at least one missing group are returned; people not found in `people` (e.g.
 * still loading) are skipped. Pure — unit-tested directly. Feeds the "add these people to the
 * bookmark's groups" hint on the bookmark edit General tab.
 */
export function computePersonGroupGaps(
  people: Person[],
  personIds: string[],
  groupIds: string[],
): PersonGroupGap[] {
  if (personIds.length === 0 || groupIds.length === 0) return [];
  const gaps: PersonGroupGap[] = [];
  for (const personId of personIds) {
    const person = people.find(p => p.id === personId);
    if (!person) continue;
    const missingGroupIds = groupIds.filter(groupId => !person.groupIds.includes(groupId));
    if (missingGroupIds.length > 0) gaps.push({
      person,
      missingGroupIds,
    });
  }
  return gaps;
}
