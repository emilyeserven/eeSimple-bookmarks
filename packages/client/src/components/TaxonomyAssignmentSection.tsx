import type { ComboboxOption } from "./Combobox";
import type { Taxonomy, TaxonomyOwnerType } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { Combobox } from "./Combobox";
import { LabeledSection } from "./LabeledSection";
import { MultiCombobox } from "./MultiCombobox";
import { useTaxonomyTermTree } from "../hooks/useTaxonomies";
import { useOwnerTaxonomyTermsFor, useSetOwnerTaxonomyTerms } from "../hooks/useTaxonomyAssignments";
import { notifyError, notifySuccess } from "../lib/notifications";
import { flattenTree } from "../lib/tagTree";

import { Label } from "@/components/ui/label";

interface TaxonomyAssignmentSectionProps {
  /** The taxonomy whose terms are attached here (drives the combobox widget + single/multi mode). */
  taxonomy: Taxonomy;
  /** Which kind of owner these terms attach to (`bookmark`, `category`, `website`, …). */
  ownerType: TaxonomyOwnerType;
  /** The owner entity's id. */
  ownerId: string;
  /** A term id to exclude from the picker (e.g. a term being edited, so it can't self-attach). */
  excludeId?: string;
  title?: string;
  description?: string;
  /** Render as a plain stacked Label-then-combobox block instead of the two-column `LabeledSection`. */
  stacked?: boolean;
}

/**
 * Reusable taxonomy-term attach picker, auto-saving on change. The generic successor to
 * `GenreMoodAssignmentSection`: dropped onto any owner's edit surface (and injected as a dynamic
 * bookmark/entity field), it renders a **single** combobox for a single-value taxonomy and a
 * **multi**-select otherwise, over the taxonomy's term tree (depth-indented for hierarchical ones).
 */
export function TaxonomyAssignmentSection({
  taxonomy,
  ownerType,
  ownerId,
  excludeId,
  title: titleProp,
  description: descriptionProp,
  stacked,
}: TaxonomyAssignmentSectionProps) {
  const {
    t,
  } = useTranslation();
  const title = titleProp ?? taxonomy.name;
  const description = descriptionProp ?? (stacked ? undefined : undefined);
  const {
    data: tree = [],
  } = useTaxonomyTermTree(taxonomy.id);
  const {
    terms: assigned,
  } = useOwnerTaxonomyTermsFor(taxonomy.id, ownerType, ownerId);
  const setAssignments = useSetOwnerTaxonomyTerms(taxonomy.id, ownerType, ownerId);
  const values = assigned.map(term => term.id);

  const options: ComboboxOption[] = flattenTree(tree)
    .filter(({
      node,
    }) => node.id !== excludeId)
    .map(({
      node, depth,
    }) => ({
      value: node.id,
      label: node.name,
      depth,
      names: node.names,
    }));

  const save = (next: string[]) => {
    setAssignments.mutate(next, {
      onSuccess: () => notifySuccess(t("{{title}} saved", {
        title,
      })),
      onError: () => notifyError(t("Couldn't save {{title}}", {
        title: title.toLowerCase(),
      })),
    });
  };

  const body = taxonomy.singleValue
    ? (
      <Combobox
        aria-label={title}
        placeholder={t("Select {{title}}…", {
          title: title.toLowerCase(),
        })}
        options={options}
        value={values[0]}
        onValueChange={next => save(next ? [next] : [])}
      />
    )
    : (
      <MultiCombobox
        aria-label={title}
        placeholder={t("Add {{title}}…", {
          title: title.toLowerCase(),
        })}
        options={options}
        values={values}
        onValuesChange={save}
      />
    );

  if (stacked) {
    return (
      <div className="space-y-1">
        <Label>{title}</Label>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        {body}
      </div>
    );
  }

  return (
    <LabeledSection
      title={title}
      description={description}
    >
      {body}
    </LabeledSection>
  );
}
