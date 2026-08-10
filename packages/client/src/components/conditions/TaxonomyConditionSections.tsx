import type { TaxonomyCondition } from "@eesimple/types";

import { Section } from "./ConditionsFieldSection";
import { TaxonomyConditionEditor } from "./TaxonomyConditionEditor";

import { useUserTaxonomies } from "@/hooks/useUserTaxonomies";
import i18n from "@/i18n";

/**
 * One collapsible condition section per user-created taxonomy, each editing that taxonomy's own
 * `taxonomy` leaf. Its own component (rather than inline in `ConditionsField`) so the section count
 * is data-driven and the parent's hook count is unchanged — fallow scores each function separately
 * and `ConditionsField` is already hook-dense (see CLAUDE.md's over-cap decomposition note).
 *
 * `onChange` receives the **whole** replacement leaf array. Leaves are merged in place rather than
 * rebuilt from the visible taxonomies, so a stored leaf whose taxonomy was since hidden or deleted
 * round-trips untouched instead of being silently dropped the first time any other section is edited.
 */
export function TaxonomyConditionSections({
  leaves, onChange,
}: {
  leaves: TaxonomyCondition[];
  onChange: (next: TaxonomyCondition[]) => void;
}) {
  const taxonomies = useUserTaxonomies();

  const replaceLeaf = (next: TaxonomyCondition) => {
    const index = leaves.findIndex(leaf => leaf.taxonomyId === next.taxonomyId);
    if (index === -1) {
      onChange([...leaves, next]);
      return;
    }
    const updated = [...leaves];
    updated[index] = next;
    onChange(updated);
  };

  return (
    <>
      {taxonomies.map((taxonomy) => {
        const leaf = leaves.find(entry => entry.taxonomyId === taxonomy.id);
        const count = leaf?.termIds.length ?? 0;
        return (
          <Section
            key={taxonomy.id}
            title={taxonomy.name}
            summary={count > 0
              ? i18n.t("{{count}} selected", {
                count,
              })
              : undefined}
            defaultOpen={count > 0}
          >
            <TaxonomyConditionEditor
              taxonomy={taxonomy}
              value={leaf ?? {
                type: "taxonomy",
                taxonomyId: taxonomy.id,
                termIds: [],
                cascadeTermIds: [],
              }}
              onChange={replaceLeaf}
            />
          </Section>
        );
      })}
    </>
  );
}
