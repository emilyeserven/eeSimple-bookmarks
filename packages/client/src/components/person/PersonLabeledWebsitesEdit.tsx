import type { Person, UpdatePersonInput } from "@eesimple/types";

import { z } from "zod";

import { useFieldAutoSave } from "../../hooks/useFieldAutoSave";
import { useUpdatePerson } from "../../hooks/usePeople";
import { labeledWebsiteSchema } from "../../lib/labeledWebsites";
import { LabeledWebsitesField } from "../LabeledWebsitesField";

interface Props {
  person: Person;
}

const LABELED_WEBSITES_LABELS: Partial<Record<keyof UpdatePersonInput, string>> = {
  labeledWebsites: "Websites",
};

const labeledWebsitesFieldSchema = z.array(labeledWebsiteSchema);

/** The person's labeled-website rows (the `labeledWebsites` field). Auto-saves the whole array on change. */
export function PersonLabeledWebsitesEdit({
  person,
}: Props) {
  const update = useUpdatePerson();
  const autoSave = useFieldAutoSave<UpdatePersonInput, Person>({
    id: person.id,
    update,
    labels: LABELED_WEBSITES_LABELS,
    initial: {
      labeledWebsites: person.labeledWebsites,
    },
  });
  return (
    <LabeledWebsitesField
      labeledWebsites={person.labeledWebsites}
      onChange={links => autoSave.saveField(
        "labeledWebsites",
        links,
        {
          valid: labeledWebsitesFieldSchema.safeParse(links).success,
        },
      )}
    />
  );
}
