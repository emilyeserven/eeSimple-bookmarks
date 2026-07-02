import type { BookmarkDetailLayout } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { CheckIcon, Columns2Icon, PencilIcon } from "lucide-react";

import { CommandGroup, CommandItem, CommandSeparator } from "@/components/ui/command";

/** The "Current Page" actions on a bookmark detail view: jump to edit, switch the detail layout. */
export function BookmarkViewPageCommandGroup({
  bookmarkId,
  detailLayout,
  setDetailLayout,
  onClose,
}: {
  bookmarkId: string;
  detailLayout: BookmarkDetailLayout;
  setDetailLayout: (layout: BookmarkDetailLayout) => void;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  return (
    <>
      <CommandGroup heading="Current Page">
        <CommandItem
          value="Go to Edit"
          onSelect={() => {
            void navigate({
              to: "/bookmarks/$bookmarkId/edit/general",
              params: {
                bookmarkId,
              },
            });
            onClose();
          }}
        >
          <PencilIcon />
          Go to Edit
        </CommandItem>
        <CommandItem
          value="Single Layout"
          onSelect={() => {
            setDetailLayout("single");
            onClose();
          }}
        >
          {detailLayout === "single" && (
            <CheckIcon
              className="text-primary"
            />
          )}
          <Columns2Icon />
          Single Layout
        </CommandItem>
        <CommandItem
          value="Tabbed Layout"
          onSelect={() => {
            setDetailLayout("tabbed");
            onClose();
          }}
        >
          {detailLayout === "tabbed" && (
            <CheckIcon
              className="text-primary"
            />
          )}
          <Columns2Icon />
          Tabbed Layout
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
    </>
  );
}
