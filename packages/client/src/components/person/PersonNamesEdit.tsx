import type { Person } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { EntityNamesTabEditor } from "../entityNames/EntityNamesTab";

import { Label } from "@/components/ui/label";

interface Props {
  person: Person;
}

/** The person's additional-names editor (the `names` field). Self-saving via `EntityNamesTabEditor`. */
export function PersonNamesEdit({
  person,
}: Props) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-1">
      <Label>{t("Names")}</Label>
      <EntityNamesTabEditor
        ownerType="person"
        ownerId={person.id}
      />
    </div>
  );
}
