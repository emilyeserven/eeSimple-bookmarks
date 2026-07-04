import type { CardFieldZones } from "@eesimple/types";

import { useState } from "react";

import { BookMarked, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  useCardFieldTemplates,
  useCreateCardFieldTemplate,
  useDeleteCardFieldTemplate,
} from "../hooks/useCardFieldTemplates";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SaveTemplatePopoverProps {
  fieldZones: CardFieldZones;
}

/** Popover with a name field to save the current card-field arrangement as a reusable template. */
export function SaveTemplatePopover({
  fieldZones,
}: SaveTemplatePopoverProps) {
  const {
    t,
  } = useTranslation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const {
    mutate, isPending,
  } = useCreateCardFieldTemplate();

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    mutate({
      name: trimmed,
      fieldZones,
    }, {
      onSuccess: () => {
        setOpen(false);
        setName("");
      },
    });
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setName("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-6 px-2 text-xs"
        >
          {t("Save as template")}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-64 space-y-3 p-3"
      >
        <p className="text-sm font-medium">{t("Save as template")}</p>
        <div className="space-y-1">
          <Label
            htmlFor="card-field-template-name"
            className="text-xs"
          >
            {t("Template name")}
          </Label>
          <Input
            id="card-field-template-name"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSave();
              }
            }}
            placeholder={t("e.g. Compact layout")}
            className="h-7 text-xs"
          />
        </div>
        <Button
          type="button"
          size="sm"
          className="w-full"
          disabled={!name.trim() || isPending}
          onClick={handleSave}
        >
          {isPending ? t("Saving...") : t("Save")}
        </Button>
      </PopoverContent>
    </Popover>
  );
}

interface LoadTemplateDropdownProps {
  onLoad: (zones: CardFieldZones) => void;
}

/** Popover listing saved card-field templates; clicking one replaces the current field zones. */
export function LoadTemplateDropdown({
  onLoad,
}: LoadTemplateDropdownProps) {
  const {
    t,
  } = useTranslation();
  const [open, setOpen] = useState(false);
  const {
    data: templates, isLoading,
  } = useCardFieldTemplates();
  const {
    mutate: deleteTemplate, isPending: isDeleting,
  } = useDeleteCardFieldTemplate();

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-6 px-2 text-xs"
        >
          <BookMarked className="size-3" />
          {t("Load template")}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-64 p-1"
      >
        {isLoading
          ? (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">{t("Loading...")}</p>
          )
          : !templates?.length
            ? (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">{t("No templates saved yet.")}</p>
            )
            : (
              <ul className="space-y-0.5">
                {templates.map(template => (
                  <li
                    key={template.id}
                    className="flex items-center gap-1"
                  >
                    <button
                      type="button"
                      className="
                        flex-1 truncate rounded-sm px-2 py-1.5 text-left text-sm
                        transition-colors
                        hover:bg-accent hover:text-accent-foreground
                      "
                      onClick={() => {
                        onLoad(template.fieldZones);
                        setOpen(false);
                      }}
                    >
                      {template.name}
                    </button>
                    <button
                      type="button"
                      aria-label={t("Delete template \"{{name}}\"", {
                        name: template.name,
                      })}
                      disabled={isDeleting}
                      className="
                        shrink-0 rounded-sm p-1 text-muted-foreground
                        transition-colors
                        hover:bg-destructive/10 hover:text-destructive
                        disabled:opacity-50
                      "
                      onClick={() => deleteTemplate(template.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
      </PopoverContent>
    </Popover>
  );
}
