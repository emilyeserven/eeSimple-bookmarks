import { Link } from "@tanstack/react-router";

import { GroupMembersEditor } from "./GroupMembersEditor";
import { MultiCombobox } from "./MultiCombobox";
import { useGroups } from "../hooks/useGroups";
import { usePeople } from "../hooks/usePeople";

import { Label } from "@/components/ui/label";

/** A "Create X" action pinned to the bottom of a picker's dropdown. */
interface CreateOption {
  label: string;
  onSelect: () => void;
}

interface Props {
  personIds: string[];
  groupIds: string[];
  onPersonIdsChange: (ids: string[]) => void;
  onGroupIdsChange: (ids: string[]) => void;
  /** Inline-create action for the People picker (parent-supplied so the create form stays registry-free). */
  personCreateOption?: CreateOption;
  /** Inline-create action for the Groups picker. */
  groupCreateOption?: CreateOption;
}

/**
 * Authors editor for a podcast — People (individuals) and Groups (organizations/networks), each a
 * multi-select over its taxonomy with inline create. For every selected Group, a nested
 * {@link GroupMembersEditor} lets you add People to that group in place. Mirrors `AlbumCreditsSection`.
 * The parent owns persistence + supplies the pickers' `createOption`s.
 */
export function PodcastAuthorsFields({
  personIds,
  groupIds,
  onPersonIdsChange,
  onGroupIdsChange,
  personCreateOption,
  groupCreateOption,
}: Props) {
  const {
    data: people,
  } = usePeople();
  const {
    data: groups,
  } = useGroups();

  const selectedGroups = (groups ?? []).filter(group => groupIds.includes(group.id));

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>People</Label>
        <MultiCombobox
          options={(people ?? []).map(person => ({
            value: person.id,
            label: person.name,
          }))}
          values={personIds}
          onValuesChange={onPersonIdsChange}
          placeholder="Select people…"
          searchPlaceholder="Search people…"
          emptyText="No people found."
          createOption={personCreateOption}
        />
      </div>
      <div className="space-y-1">
        <Label>Groups</Label>
        <MultiCombobox
          options={(groups ?? []).map(group => ({
            value: group.id,
            label: group.name,
          }))}
          values={groupIds}
          onValuesChange={onGroupIdsChange}
          placeholder="Select groups…"
          searchPlaceholder="Search groups…"
          emptyText="No groups found."
          createOption={groupCreateOption}
        />
        {selectedGroups.length > 0
          ? (
            <div className="space-y-3 border-l pt-2 pl-3">
              {selectedGroups.map(group => (
                <GroupMembersEditor
                  key={group.id}
                  groupId={group.id}
                  groupName={group.name}
                />
              ))}
            </div>
          )
          : null}
      </div>
    </div>
  );
}

/** Read-only People + Group author credits as entity links, for a podcast's View tab / panel. */
export function PodcastAuthorsValue({
  personIds,
  groupIds,
}: {
  personIds: string[];
  groupIds: string[];
}) {
  const {
    data: people,
  } = usePeople();
  const {
    data: groups,
  } = useGroups();

  const creditedPeople = (people ?? []).filter(person => personIds.includes(person.id));
  const creditedGroups = (groups ?? []).filter(group => groupIds.includes(group.id));

  if (creditedPeople.length === 0 && creditedGroups.length === 0) {
    return <span className="text-muted-foreground">Unknown</span>;
  }

  return (
    <div className="flex flex-wrap gap-x-2 gap-y-1">
      {creditedPeople.map(person => (
        <Link
          key={person.id}
          to="/taxonomies/people/$personSlug/general"
          params={{
            personSlug: person.slug,
          }}
          className="
            text-primary
            hover:underline
          "
        >
          {person.name}
        </Link>
      ))}
      {creditedGroups.map(group => (
        <Link
          key={group.id}
          to="/taxonomies/groups/$groupSlug/general"
          params={{
            groupSlug: group.slug,
          }}
          className="
            text-primary
            hover:underline
          "
        >
          {group.name}
        </Link>
      ))}
    </div>
  );
}
