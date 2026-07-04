import type { Website } from "@eesimple/types";

import { UserCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { usePeople, useUpdatePerson } from "../hooks/usePeople";
import { describeError } from "../lib/apiError";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";
import { toggleId } from "../lib/tag-utils";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Props {
  website: Website;
}

/** Association tab: pick which people are connected to this website. Auto-saves on toggle. */
export function WebsitePeopleForm({
  website,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    data: people,
  } = usePeople();
  const update = useUpdatePerson();

  return (
    <div className="space-y-3">
      {(people ?? []).length === 0
        ? <p className="text-sm text-muted-foreground">{t("No people exist yet.")}</p>
        : (
          <ul className="space-y-2">
            {(people ?? []).map(person => (
              <li
                key={person.id}
                className="flex items-center gap-2"
              >
                <Checkbox
                  id={`person-${person.id}`}
                  checked={person.websiteIds.includes(website.id)}
                  onCheckedChange={() =>
                    update.mutate(
                      {
                        id: person.id,
                        input: {
                          websiteIds: toggleId(person.websiteIds, website.id),
                        },
                      },
                      {
                        onSuccess: () => notifyFieldSaved("People"),
                        onError: error => notifyFieldSaveError("People", describeError(error)),
                      },
                    )}
                />
                {person.imageUrl
                  ? (
                    <img
                      src={person.imageUrl}
                      alt=""
                      className="size-5 rounded-full object-cover"
                    />
                  )
                  : (
                    <UserCircle
                      className="size-4 shrink-0 text-muted-foreground"
                    />
                  )}
                <Label
                  htmlFor={`person-${person.id}`}
                  className="cursor-pointer font-normal"
                >
                  {person.name}
                </Label>
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}

/** Read-only view of connected people. */
export function WebsitePeopleView({
  website,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    data: people,
  } = usePeople();
  const connected = (people ?? []).filter(a => a.websiteIds.includes(website.id));

  if (connected.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("No people connected.")}</p>;
  }

  return (
    <ul className="space-y-2">
      {connected.map(person => (
        <li
          key={person.id}
          className="flex items-center gap-2 text-sm"
        >
          {person.imageUrl
            ? (
              <img
                src={person.imageUrl}
                alt=""
                className="size-5 rounded-full object-cover"
              />
            )
            : <UserCircle className="size-4 shrink-0 text-muted-foreground" />}
          {person.name}
        </li>
      ))}
    </ul>
  );
}
