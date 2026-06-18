import type { ReactNode } from "react";

/** A labelled field row in the detail layout; renders nothing when its value is empty. */
export function DetailField({
  label, children,
}: {
  label: string;
  children: ReactNode;
}) {
  if (children === null || children === undefined || children === false) return null;
  return (
    <div
      className="
        grid gap-1
        sm:grid-cols-[10rem_1fr] sm:gap-4
      "
    >
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm text-foreground">{children}</dd>
    </div>
  );
}
