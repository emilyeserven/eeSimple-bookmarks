import type { Category } from "@eesimple/types";

import { useState } from "react";

import { useCreateAutofillRule } from "../hooks/useAutofill";
import { notifyError, notifySuccess } from "../lib/notifications";

import { Button } from "@/components/ui/button";

interface BookmarkAutofillOfferProps {
  /** Normalized domain of the new website (from the website lookup). */
  domain: string;
  /** Current form value for categoryId. */
  categoryId: string;
  /** Pre-filled category from the route (overrides categoryId). */
  lockedCategoryId?: string;
  categories: Category[];
  dismissed: boolean;
  onDismiss: () => void;
}

/**
 * Inline callout that offers to create an autofill rule (website → category) when the user is
 * adding a bookmark from a brand-new site and has chosen a non-default category.
 */
export function BookmarkAutofillOffer({
  domain,
  categoryId,
  lockedCategoryId,
  categories,
  dismissed,
  onDismiss,
}: BookmarkAutofillOfferProps) {
  const [isPending, setIsPending] = useState(false);
  const createRule = useCreateAutofillRule();

  const effectiveCategoryId = lockedCategoryId ?? categoryId;
  const category = categories.find(c => c.id === effectiveCategoryId);

  if (dismissed || !domain || !category || category.builtIn) return null;

  async function handleCreate(): Promise<void> {
    if (!category) return;
    setIsPending(true);
    try {
      await createRule.mutateAsync({
        name: `${category.name} — ${domain}`,
        conditions: {
          type: "group",
          combinator: "and",
          children: [{
            type: "website",
            domains: [domain],
          }],
        },
        setCategoryId: effectiveCategoryId,
      });
      notifySuccess("Autofill rule created");
      onDismiss();
    }
    catch (err) {
      notifyError(err instanceof Error ? err.message : "Could not create autofill rule");
    }
    finally {
      setIsPending(false);
    }
  }

  return (
    <div
      className="
        flex items-start justify-between gap-3 rounded-md border bg-muted/50
        px-3 py-2 text-sm
      "
    >
      <p className="text-muted-foreground">
        Auto-apply
        {" "}
        <span className="font-medium text-foreground">{category.name}</span>
        {" "}
        to all new bookmarks from
        {" "}
        <span className="font-medium text-foreground">{domain}</span>
        ?
      </p>
      <div className="flex shrink-0 gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => void handleCreate()}
        >
          Create rule
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onDismiss}
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
}
