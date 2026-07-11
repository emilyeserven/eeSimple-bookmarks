import type { BookmarkDetailLayout } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { CheckIcon, Columns2Icon, PencilIcon, ShoppingBasket } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useBasketStore } from "../stores/basketStore";

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
  const {
    t,
  } = useTranslation();
  const navigate = useNavigate();
  const inBasket = useBasketStore(s => s.bookmarkIds.includes(bookmarkId));
  const toggleBasket = useBasketStore(s => s.toggle);
  return (
    <>
      <CommandGroup heading={t("Current Page")}>
        <CommandItem
          value={inBasket ? "Remove from Basket" : "Add to Basket"}
          onSelect={() => {
            toggleBasket(bookmarkId);
            onClose();
          }}
        >
          {inBasket && (
            <CheckIcon
              className="text-primary"
            />
          )}
          <ShoppingBasket />
          {inBasket ? t("Remove from Basket") : t("Add to Basket")}
        </CommandItem>
        <CommandItem
          value="Go to Edit"
          onSelect={() => {
            void navigate({
              to: "/bookmarks/$bookmarkId/edit",
              params: {
                bookmarkId,
              },
              search: {},
            });
            onClose();
          }}
        >
          <PencilIcon />
          {t("Go to Edit")}
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
          {t("Single Layout")}
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
          {t("Tabbed Layout")}
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
    </>
  );
}
