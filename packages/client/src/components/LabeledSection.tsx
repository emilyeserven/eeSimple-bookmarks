import type { ReactNode } from "react";

interface LabeledSectionProps {
  title: string;
  description?: ReactNode;
  children?: ReactNode;
}

/**
 * A titled group for detail/edit pages: a small heading plus optional muted description, then its
 * content. Callers stack these in a `space-y-6` container and divide them with `<Separator />`
 * (see `AutofillRuleDetail`/`AutofillRuleForm` and the Website pages). Use the collapsible/accordion
 * pattern instead when a section is long or optional and benefits from collapsing.
 */
export function LabeledSection({
  title, description, children,
}: LabeledSectionProps) {
  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
