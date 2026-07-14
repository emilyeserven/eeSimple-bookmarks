import { useQuery } from "@tanstack/react-query";

import { appSettingsApi } from "../../lib/api/settings";

const DATABASE_USAGE_KEY = ["app-settings", "database-usage"] as const;

/** Read-only snapshot of how much disk space each table and the whole database is using. */
export function useDatabaseUsage() {
  return useQuery({
    queryKey: DATABASE_USAGE_KEY,
    queryFn: appSettingsApi.getDatabaseUsage,
  });
}

/** Diagnostic detail for a single table, fetched lazily when a Database usage row is expanded. */
export function useDatabaseTableDetail(tableName: string | null) {
  return useQuery({
    queryKey: [...DATABASE_USAGE_KEY, tableName],
    queryFn: () => appSettingsApi.getDatabaseTableDetail(tableName as string),
    enabled: tableName !== null,
  });
}
