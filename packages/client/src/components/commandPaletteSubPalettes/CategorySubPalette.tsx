import type { Category } from "@eesimple/types";

import {
  ArrowLeftIcon,
  CheckIcon,
  FolderOpen,
  PlusIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";

export function CategorySubPalette({
  categories,
  currentCategoryId,
  onBack,
  onSelect,
  onCreateNew,
}: {
  categories: Category[];
  currentCategoryId: string | null | undefined;
  onBack: () => void;
  onSelect: (categoryId: string) => void;
  onCreateNew: () => void;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <>
      <CommandGroup heading={t("Category")}>
        <CommandItem
          value="back"
          onSelect={onBack}
        >
          <ArrowLeftIcon />
          {t("Back")}
        </CommandItem>
        <CommandItem
          value="new category"
          onSelect={onCreateNew}
        >
          <PlusIcon />
          {t("New category…")}
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading={t("Select category")}>
        {categories.map(category => (
          <CommandItem
            key={category.id}
            value={category.name}
            onSelect={() => onSelect(category.id)}
          >
            <FolderOpen />
            {category.name}
            {currentCategoryId === category.id && (
              <CheckIcon className="ml-auto text-primary" />
            )}
          </CommandItem>
        ))}
      </CommandGroup>
    </>
  );
}
