import { ChevronDown, ChevronRight } from "lucide-react";

/**
 * A small chevron button that folds/unfolds a section (or the whole Sections block). Mirrors
 * `TaxonomyTreeRowExpander`'s idiom — `ChevronDown` when expanded / `ChevronRight` when collapsed,
 * with `aria-expanded` and a caller-supplied label — so the collapse affordance is identical on the
 * bookmark detail view and the edit form.
 */
export function SectionCollapseToggle({
  collapsed, onToggle, label,
}: {
  collapsed: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={!collapsed}
      onClick={onToggle}
      className="
        inline-flex size-4 items-center justify-center align-middle
        text-muted-foreground
        hover:text-foreground
      "
    >
      {collapsed
        ? <ChevronRight className="size-4" />
        : <ChevronDown className="size-4" />}
    </button>
  );
}
