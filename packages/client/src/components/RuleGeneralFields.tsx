import type { ReactNode } from "react";

import { useTranslation } from "react-i18next";

interface Props {
  description: string | null;
  slug: string | null;
  createdAt: string | Date;
  priorityLabel: ReactNode;
}

/** Body shared by the General view tab on Autofill rules and Card Display rules. */
export function RuleGeneralFields({
  description, slug, createdAt, priorityLabel,
}: Props) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-3 text-sm">
      {description
        ? <p>{description}</p>
        : <p className="text-muted-foreground">{t("No description.")}</p>}
      <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2">
        <dt className="text-muted-foreground">{t("Priority")}</dt>
        <dd>{priorityLabel}</dd>
        <dt className="text-muted-foreground">{t("Slug")}</dt>
        <dd className="font-mono">{slug}</dd>
        <dt className="text-muted-foreground">{t("Added")}</dt>
        <dd>{new Date(createdAt).toLocaleDateString()}</dd>
      </dl>
    </div>
  );
}
