import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { usePurgeProcessedItems } from "../hooks/useImports";
import { notifyError, notifySuccess } from "../lib/notifications";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** Sweep processed inbox items: those marked for deletion (a bookmark was created) + blocked items. */
export function ProcessedItemsCard() {
  const {
    t,
  } = useTranslation();
  const purge = usePurgeProcessedItems();

  function onPurge(): void {
    purge.mutate(undefined, {
      onSuccess: (result) => {
        notifySuccess(
          result.deleted === 0
            ? t("No processed items to delete")
            : `Deleted ${result.deleted} processed item${result.deleted === 1 ? "" : "s"}`,
        );
      },
      onError: () => notifyError(t("Couldn't delete processed items")),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inbox</CardTitle>
        <CardDescription>
          Delete every inbox item that has been processed: items marked for deletion (a bookmark was
          already created from them) and blocked items. Blocked links stay on the Imports Blacklist, so
          they’re still skipped on future imports.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          type="button"
          variant="destructive"
          onClick={onPurge}
          disabled={purge.isPending}
        >
          <Trash2 className="mr-1 size-4" />
          Delete all items marked for deletion
        </Button>
      </CardContent>
    </Card>
  );
}
