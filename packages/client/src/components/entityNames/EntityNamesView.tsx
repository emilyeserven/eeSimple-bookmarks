import type { EntityName } from "@eesimple/types";

import { Badge } from "../ui/badge";

interface EntityNamesViewProps {
  names: EntityName[];
  /** Text shown when there are no additional names. */
  emptyText?: string;
}

/** Read-only display of an owner's multilingual names as `Language — value` chips. */
export function EntityNamesView({
  names, emptyText = "No additional names added.",
}: EntityNamesViewProps) {
  if (names.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }
  return (
    <ul className="flex flex-wrap gap-2">
      {names.map(name => (
        <li key={name.id}>
          <Badge
            variant="secondary"
            className="gap-1"
          >
            <span className="font-medium">{name.language.name}</span>
            <span className="text-muted-foreground">—</span>
            <span>{name.value}</span>
            {name.isPrimary && <span className="text-muted-foreground">(primary)</span>}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
