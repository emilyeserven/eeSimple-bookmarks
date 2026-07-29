interface StripParamsListProps {
  /** Query params always stripped from the site's URLs on save. */
  params: string[];
  /** Text shown when there are no strip params. */
  emptyText: string;
}

/**
 * Read-only list of a website's strip params (the blacklist of query params dropped on save).
 * Rendered by the website workbench's Param Rules view tab.
 */
export function StripParamsList({
  params, emptyText,
}: StripParamsListProps) {
  if (params.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }
  return (
    <ul className="flex flex-wrap gap-2 text-sm">
      {params.map(param => (
        <li
          key={param}
          className="rounded-md border px-2 py-1 font-mono"
        >
          {param}
        </li>
      ))}
    </ul>
  );
}
