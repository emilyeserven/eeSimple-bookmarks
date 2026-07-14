import type { Person } from "@eesimple/types";

import { PersonAvatarEdit } from "./person/PersonAvatarEdit";
import { PersonCreatorMediaEdit } from "./person/PersonCreatorMediaEdit";
import { PersonDetailsFields } from "./person/PersonDetailsFields";
import { PersonGenreMoodsEdit } from "./person/PersonGenreMoodsEdit";
import { PersonLabeledWebsitesEdit } from "./person/PersonLabeledWebsitesEdit";
import { PersonNamesEdit } from "./person/PersonNamesEdit";
import { PersonPrimaryLanguageEdit } from "./person/PersonPrimaryLanguageEdit";
import { PersonSocialLinksEdit } from "./person/PersonSocialLinksEdit";

import { Separator } from "@/components/ui/separator";

/**
 * The person General form. Each field is a per-field placeable edit sub-component (#1194 composite
 * extraction), now relocated into `./person/*` so this recomposition shell — and every consumer of a
 * single sub-component — stays under the `import/max-dependencies` cap (#1368). Each sub-component is
 * **independently backed** — its own `useFieldAutoSave` / react-query hook, no shared form controller —
 * following the Category "independently-backed" shape (name→primary-language sync coordinates through
 * react-query, not one `useAppForm`).
 *
 * The sub-components are re-exported here so `workbench/person.tsx` (the layout registry) keeps importing
 * them from `./PersonGeneralForm`, and this whole-form shell (its Storybook story) renders unchanged.
 */

export { PersonAvatarEdit } from "./person/PersonAvatarEdit";
export { PersonCreatorMediaEdit } from "./person/PersonCreatorMediaEdit";
export { PersonDetailsFields } from "./person/PersonDetailsFields";
export { PersonGenreMoodsEdit } from "./person/PersonGenreMoodsEdit";
export { PersonLabeledWebsitesEdit } from "./person/PersonLabeledWebsitesEdit";
export { PersonNamesEdit } from "./person/PersonNamesEdit";
export { PersonPrimaryLanguageEdit } from "./person/PersonPrimaryLanguageEdit";
export { PersonSocialLinksEdit } from "./person/PersonSocialLinksEdit";

interface Props {
  person: Person;
}

/**
 * Edit a person's name, URLs, avatar, social links, and creator/media fields. Each field auto-saves (no
 * Save button). Recomposed from the same placeable sub-fields the person workbench registry uses, so this
 * whole-form shell (its Storybook story) stays in lockstep with the layout-driven General tab.
 */
export function PersonGeneralForm({
  person,
}: Props) {
  return (
    <div className="space-y-4">
      <PersonDetailsFields person={person} />
      <PersonPrimaryLanguageEdit person={person} />
      <PersonNamesEdit person={person} />
      <PersonLabeledWebsitesEdit person={person} />
      <PersonAvatarEdit person={person} />
      <Separator />
      <PersonSocialLinksEdit person={person} />
      <Separator />
      <PersonCreatorMediaEdit person={person} />
      <Separator />
      <PersonGenreMoodsEdit person={person} />
    </div>
  );
}
