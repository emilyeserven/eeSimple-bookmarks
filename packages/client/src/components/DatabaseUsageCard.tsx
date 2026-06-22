import { formatSize } from "./galleryFormat";
import { useDatabaseUsage } from "../hooks/useAppSettings";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Read-only "Database usage" summary on the Advanced settings page: a per-table breakdown of
 * on-disk space (data + indexes) sorted largest-first, with an estimated row count and a
 * whole-database total. Sourced from PostgreSQL catalog introspection — display only.
 */
export function DatabaseUsageCard() {
  const {
    data, isLoading, isError, error,
  } = useDatabaseUsage();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Database usage</CardTitle>
        <CardDescription>
          Disk space used by each table in the PostgreSQL database (including its indexes). Row
          counts are estimates.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading
          ? <p className="text-sm text-muted-foreground">Loading…</p>
          : isError
            ? (
              <p className="text-sm text-muted-foreground">
                {`Couldn't load database usage: ${error.message}`}
              </p>
            )
            : data && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Table</TableHead>
                    <TableHead className="text-right">Rows (est.)</TableHead>
                    <TableHead className="text-right">Size</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.tables.map(table => (
                    <TableRow key={table.tableName}>
                      <TableCell className="font-medium">{table.tableName}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {table.rowEstimate.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatSize(table.totalBytes)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell>Total (whole database)</TableCell>
                    <TableCell />
                    <TableCell className="text-right tabular-nums">
                      {formatSize(data.totalBytes)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            )}
      </CardContent>
    </Card>
  );
}
