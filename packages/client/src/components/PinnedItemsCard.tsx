import { PinManager } from "./PinManager";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Settings card for the sidebar's "Pinned Items": a combobox to pin any category / tag / website /
 * media type / YouTube channel / saved filter as a quick-access sidebar link, plus the list of
 * current pins with unpin buttons. The body is the shared {@link PinManager}, also surfaced in the
 * header's `HeaderPinButton` popover.
 */
export function PinnedItemsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pinned Items</CardTitle>
        <CardDescription>
          Quick-access links pinned below the Bookmarks link in the sidebar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PinManager />
      </CardContent>
    </Card>
  );
}
