import type { Person } from "@eesimple/types";

import { useGroups } from "../hooks/useGroups";
import { useUpdatePerson } from "../hooks/usePeople";
import { describeError } from "../lib/apiError";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";
import { toggleId } from "../lib/tag-utils";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Props {
  person: Person;
}

/** Association tab: pick which groups are connected to this person. Auto-saves on toggle. */
export function PersonGroupsForm({
  person,
}: Props) {
  const {
    data: groups,
  } = useGroups();
  const update = useUpdatePerson();
  const enabledIds = person.groupIds;

  return (
    <div className="space-y-3">
      {(groups ?? []).length === 0
        ? <p className="text-sm text-muted-foreground">No groups exist yet.</p>
        : (
          <ul className="space-y-2">
            {(groups ?? []).map(pub => (
              <li
                key={pub.id}
                className="flex items-center gap-2"
              >
                <Checkbox
                  id={`pub-${pub.id}`}
                  checked={enabledIds.includes(pub.id)}
                  onCheckedChange={() =>
                    update.mutate(
                      {
                        id: person.id,
                        input: {
                          groupIds: toggleId(enabledIds, pub.id),
                        },
                      },
                      {
                        onSuccess: () => notifyFieldSaved("Groups"),
                        onError: error => notifyFieldSaveError("Groups", describeError(error)),
                      },
                    )}
                />
                <Label
                  htmlFor={`pub-${pub.id}`}
                  className="cursor-pointer font-normal"
                >
                  {pub.name}
                  {pub.website
                    ? (
                      <span className="ml-1 text-xs text-muted-foreground">
                        {pub.website.domain}
                      </span>
                    )
                    : null}
                </Label>
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}

/** Read-only view of connected groups. */
export function PersonGroupsView({
  person,
}: Props) {
  const {
    data: groups,
  } = useGroups();
  const connected = (groups ?? []).filter(pub => person.groupIds.includes(pub.id));

  if (connected.length === 0) {
    return <p className="text-sm text-muted-foreground">No groups connected.</p>;
  }

  return (
    <ul className="space-y-2">
      {connected.map(pub => (
        <li
          key={pub.id}
          className="text-sm"
        >
          {pub.name}
          {pub.website
            ? <span className="ml-1 text-xs text-muted-foreground">{pub.website.domain}</span>
            : null}
        </li>
      ))}
    </ul>
  );
}
