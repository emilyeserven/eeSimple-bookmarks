import type { ColumnDef } from "@tanstack/react-table";

import { makeStringListColumns } from "./domainListColumns";

/** Column definitions for a plain string[] query-parameter list (custom strip params). */
export function paramListColumns(onDelete: (param: string) => void): ColumnDef<string>[] {
  return makeStringListColumns("param", "Parameter", onDelete);
}
