import type { Person } from "@eesimple/types";

import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useUpdatePerson } from "../hooks/usePeople";
import { useWebsites } from "../hooks/useWebsites";
import { describeError } from "../lib/apiError";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";
import { toggleId } from "../lib/tag-utils";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Props {
  person: Person;
}

/** Association tab: pick which websites are connected to this person. Auto-saves on toggle. */
export function PersonWebsitesForm({
  person,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    data: websites,
  } = useWebsites();
  const update = useUpdatePerson();
  const enabledIds = person.websiteIds;

  return (
    <div className="space-y-3">
      {(websites ?? []).length === 0
        ? <p className="text-sm text-muted-foreground">{t("No websites exist yet.")}</p>
        : (
          <ul className="space-y-2">
            {(websites ?? []).map(site => (
              <li
                key={site.id}
                className="flex items-center gap-2"
              >
                <Checkbox
                  id={`site-${site.id}`}
                  checked={enabledIds.includes(site.id)}
                  onCheckedChange={() =>
                    update.mutate(
                      {
                        id: person.id,
                        input: {
                          websiteIds: toggleId(enabledIds, site.id),
                        },
                      },
                      {
                        onSuccess: () => notifyFieldSaved("Websites"),
                        onError: error => notifyFieldSaveError("Websites", describeError(error)),
                      },
                    )}
                />
                {site.imageUrl
                  ? (
                    <img
                      src={site.imageUrl}
                      alt=""
                      className="size-5 rounded-sm object-cover"
                    />
                  )
                  : <Globe className="size-4 shrink-0 text-muted-foreground" />}
                <Label
                  htmlFor={`site-${site.id}`}
                  className="cursor-pointer font-normal"
                >
                  {site.siteName}
                  <span className="ml-1 text-xs text-muted-foreground">{site.domain}</span>
                </Label>
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}

/** Read-only view of connected websites. */
export function PersonWebsitesView({
  person,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    data: websites,
  } = useWebsites();
  const connected = (websites ?? []).filter(site => person.websiteIds.includes(site.id));

  if (connected.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("No websites connected.")}</p>;
  }

  return (
    <ul className="space-y-2">
      {connected.map(site => (
        <li
          key={site.id}
          className="flex items-center gap-2 text-sm"
        >
          {site.imageUrl
            ? (
              <img
                src={site.imageUrl}
                alt=""
                className="size-5 rounded-sm object-cover"
              />
            )
            : <Globe className="size-4 shrink-0 text-muted-foreground" />}
          {site.siteName}
          <span className="text-xs text-muted-foreground">{site.domain}</span>
        </li>
      ))}
    </ul>
  );
}
