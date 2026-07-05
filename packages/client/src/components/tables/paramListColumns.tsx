import type { ColumnDef } from "@tanstack/react-table";

import { makeStringListColumns } from "./domainListColumns";
import i18n from "../../i18n";

/** Column definitions for a plain string[] query-parameter list (custom strip params). */
export function paramListColumns(onDelete: (param: string) => void): ColumnDef<string>[] {
  return makeStringListColumns("param", i18n.t("Parameter"), onDelete);
}
