import type { Person } from "@eesimple/types";

import { usePrimaryLanguageField } from "../../hooks/usePrimaryLanguageField";
import { PrimaryLanguageField } from "../entityNames/PrimaryLanguageField";

interface Props {
  person: Person;
}

/**
 * The person's primary-language picker (the `primaryLanguage` field). Mounts its own react-query-backed
 * `usePrimaryLanguageField`, so it coordinates with the name field's sync via the shared cache.
 */
export function PersonPrimaryLanguageEdit({
  person,
}: Props) {
  const primaryLanguage = usePrimaryLanguageField("person", person.id);
  return (
    <PrimaryLanguageField
      value={primaryLanguage.primaryLanguageId}
      onValueChange={v => primaryLanguage.setPrimaryLanguage(v, person.name)}
    />
  );
}
