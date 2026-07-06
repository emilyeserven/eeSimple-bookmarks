import type { Album } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { MultiCombobox } from "./MultiCombobox";
import { useEntityCreateOption } from "./useEntityCreateOption";
import { useUpdateAlbum } from "../hooks/useAlbums";
import { useGroups } from "../hooks/useGroups";
import { usePeople } from "../hooks/usePeople";

import { LabeledSection } from "@/components/LabeledSection";
import { Label } from "@/components/ui/label";
import { notifyFieldSaved } from "@/lib/autoSave";

/**
 * Edit an album's creator credits — People (individuals) and Groups (groups/bands) — as two
 * auto-saving many-to-many pickers. Replaces the former Album↔Artist section now that the Artists
 * taxonomy collapsed into People + Groups. Each picker offers inline-create of a new credit.
 */
export function AlbumCreditsSection({
  album,
}: {
  album: Album;
}) {
  const {
    t,
  } = useTranslation();
  const update = useUpdateAlbum();
  const {
    data: people,
  } = usePeople();
  const {
    data: groups,
  } = useGroups();

  const personCreate = useEntityCreateOption("person", (person) => {
    if (album.personIds.includes(person.id)) return;
    savePeople([...album.personIds, person.id]);
  });
  const groupCreate = useEntityCreateOption("group", (group) => {
    if (album.groupIds.includes(group.id)) return;
    saveGroups([...album.groupIds, group.id]);
  });

  function savePeople(personIds: string[]): void {
    update.mutate(
      {
        id: album.id,
        input: {
          personIds,
        },
      },
      {
        onSuccess: () => notifyFieldSaved("People"),
      },
    );
  }

  function saveGroups(groupIds: string[]): void {
    update.mutate(
      {
        id: album.id,
        input: {
          groupIds,
        },
      },
      {
        onSuccess: () => notifyFieldSaved("Groups"),
      },
    );
  }

  return (
    <LabeledSection
      title={t("Credits")}
      description={t("People (individuals) and Groups (groups/bands) credited on this album.")}
    >
      <div className="space-y-4">
        <div className="space-y-1">
          <Label>{t("People")}</Label>
          <MultiCombobox
            options={(people ?? []).map(p => ({
              value: p.id,
              label: p.name,
              names: p.names,
            }))}
            values={album.personIds}
            onValuesChange={savePeople}
            placeholder={t("Select people…")}
            searchPlaceholder={t("Search people…")}
            emptyText={t("No people found.")}
            createOption={personCreate.createOption}
          />
          {personCreate.modal}
        </div>
        <div className="space-y-1">
          <Label>{t("Groups")}</Label>
          <MultiCombobox
            options={(groups ?? []).map(p => ({
              value: p.id,
              label: p.name,
              names: p.names,
            }))}
            values={album.groupIds}
            onValuesChange={saveGroups}
            placeholder={t("Select groups…")}
            searchPlaceholder={t("Search groups…")}
            emptyText={t("No groups found.")}
            createOption={groupCreate.createOption}
          />
          {groupCreate.modal}
        </div>
      </div>
    </LabeledSection>
  );
}

/** Read-only display of an album's People + Group credits, for the album View tab / panel. */
export function AlbumCreditsValue({
  album,
}: {
  album: Album;
}) {
  const {
    t,
  } = useTranslation();
  const {
    data: people,
  } = usePeople();
  const {
    data: groups,
  } = useGroups();

  const creditedPeople = (people ?? []).filter(p => album.personIds.includes(p.id));
  const creditedGroups = (groups ?? []).filter(p => album.groupIds.includes(p.id));

  return (
    <LabeledSection title={t("Credits")}>
      {creditedPeople.length === 0 && creditedGroups.length === 0
        ? <p className="text-sm text-muted-foreground">{t("No credits.")}</p>
        : (
          <div className="space-y-3 text-sm">
            {creditedPeople.length > 0 && (
              <div className="space-y-1">
                <Label className="text-muted-foreground">{t("People")}</Label>
                <div className="flex flex-wrap gap-2">
                  {creditedPeople.map(person => (
                    <Link
                      key={person.id}
                      to="/taxonomies/people/$personSlug"
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
                </div>
              </div>
            )}
            {creditedGroups.length > 0 && (
              <div className="space-y-1">
                <Label className="text-muted-foreground">{t("Groups")}</Label>
                <div className="flex flex-wrap gap-2">
                  {creditedGroups.map(group => (
                    <Link
                      key={group.id}
                      to="/taxonomies/groups/$groupSlug"
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
              </div>
            )}
          </div>
        )}
    </LabeledSection>
  );
}
