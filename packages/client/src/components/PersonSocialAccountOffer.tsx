import type { SocialAccountRef } from "@eesimple/types";

import { useState } from "react";

import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { SOCIAL_MEDIA_PLATFORM_LABELS } from "@/lib/socialLinks";

interface PersonSocialAccountOfferProps {
  /** The detected social account with no matching person, or null to render nothing. */
  account: SocialAccountRef | null;
  /** Create a new person from the account (attaches the link + pulls the avatar). */
  onCreate: () => Promise<void> | void;
  /** Dismiss the offer without creating an person. */
  onDismiss: () => void;
}

/**
 * Inline callout shown when a bookmark is added from a recognized social-network profile that no
 * existing person already lists. Offers to create an person from the account in one click.
 */
export function PersonSocialAccountOffer({
  account,
  onCreate,
  onDismiss,
}: PersonSocialAccountOfferProps) {
  const [isPending, setIsPending] = useState(false);
  const {
    t,
  } = useTranslation();

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
        {t("New")}
        {" "}
        <span className="font-medium text-foreground">
          {SOCIAL_MEDIA_PLATFORM_LABELS[account.platform]}
        </span>
        {" "}
        {t("account")}
        {" "}
        <span className="font-medium text-foreground">
          @
          {account.handle}
        </span>
        {" "}
        —
        {" "}
        {t("create an person?")}
      </p>
      <div className="flex shrink-0 gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => void handleCreate()}
        >
          {t("Create person")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onDismiss}
        >
          {t("Dismiss")}
        </Button>
      </div>
    </div>
  );
}
