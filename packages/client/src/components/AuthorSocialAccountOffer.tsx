import type { SocialAccountRef } from "@eesimple/types";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { SOCIAL_MEDIA_PLATFORM_LABELS } from "@/lib/socialLinks";

interface AuthorSocialAccountOfferProps {
  /** The detected social account with no matching author, or null to render nothing. */
  account: SocialAccountRef | null;
  /** Create a new author from the account (attaches the link + pulls the avatar). */
  onCreate: () => Promise<void> | void;
  /** Dismiss the offer without creating an author. */
  onDismiss: () => void;
}

/**
 * Inline callout shown when a bookmark is added from a recognized social-network profile that no
 * existing author already lists. Offers to create an author from the account in one click.
 */
export function AuthorSocialAccountOffer({
  account,
  onCreate,
  onDismiss,
}: AuthorSocialAccountOfferProps) {
  const [isPending, setIsPending] = useState(false);

  if (!account) return null;

  async function handleCreate(): Promise<void> {
    setIsPending(true);
    try {
      await onCreate();
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
        New
        {" "}
        <span className="font-medium text-foreground">
          {SOCIAL_MEDIA_PLATFORM_LABELS[account.platform]}
        </span>
        {" "}
        account
        {" "}
        <span className="font-medium text-foreground">
          @
          {account.handle}
        </span>
        {" "}
        — create an author?
      </p>
      <div className="flex shrink-0 gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => void handleCreate()}
        >
          Create author
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
