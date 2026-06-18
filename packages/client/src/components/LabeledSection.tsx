import type { ReactNode } from "react";

interface LabeledSectionProps {
  title: string;
  description?: ReactNode;
  children?: ReactNode;
}

/**
 * A titled group for detail/edit pages: a small heading plus optional muted description, then its
 * content. On narrow screens the heading stacks above the content; from the `md` breakpoint up it
 * becomes a two-column layout with the heading on the left (~1/5) and the content on the right
 * (~4/5). Callers stack these in a `space-y-6` container and divide them with `<Separator />`
 * (see `AutofillRuleDetail`/`AutofillRuleForm` and the Website pages). Use the collapsible/accordion
 * pattern instead when a section is long or optional and benefits from collapsing.
 */
export function LabeledSection({
  title, description, children,
}: LabeledSectionProps) {
  return (
    <section
      className="
        space-y-3
        md:grid md:grid-cols-5 md:gap-4 md:space-y-0
      "
    >
      <div
        className="
          space-y-1
          md:col-span-1
        "
      >
        <h3 className="text-sm font-semibold">{title}</h3>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>
      <div className="md:col-span-4">{children}</div>
    </section>
  );
}
