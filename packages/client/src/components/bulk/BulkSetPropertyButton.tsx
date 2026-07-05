import type { CustomProperty, UpdateBookmarkInput } from "@eesimple/types";

import { useState } from "react";

import { useTranslation } from "react-i18next";

import { useBulkUpdateBookmarks } from "../../hooks/useBookmarks";
import { Combobox } from "../Combobox";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Property types whose value is a single scalar we can set in bulk (number, boolean, date). */
const BULK_SETTABLE_TYPES = new Set<CustomProperty["type"]>([
  "number",
  "ratingScale",
  "boolean",
  "datetime",
]);

/** Build the value patch for a single custom property from the raw input string. */
function propertyValuePatch(property: CustomProperty, raw: string): UpdateBookmarkInput | null {
  if (property.type === "boolean") {
    return {
      booleanValues: [{
        propertyId: property.id,
        value: raw === "true",
      }],
    };
  }
  if (property.type === "datetime") {
    if (raw === "") return null;
    return {
      dateTimeValues: [{
        propertyId: property.id,
        value: new Date(raw).toISOString(),
      }],
    };
  }
  // number / ratingScale
  if (raw === "" || Number.isNaN(Number(raw))) return null;
  return {
    numberValues: [{
      propertyId: property.id,
      value: Number(raw),
    }],
  };
}

interface BulkSetPropertyButtonProps {
  ids: string[];
  properties: CustomProperty[];
  /** Called after a bulk action succeeds, so the caller can clear the selection. */
  onDone: () => void;
}

/** Set one custom-property value across the selected bookmarks (merged with their existing values). */
export function BulkSetPropertyButton({
  ids,
  properties,
  onDone,
}: BulkSetPropertyButtonProps) {
  const {
    t,
  } = useTranslation();
  const [open, setOpen] = useState(false);
  const [propertyId, setPropertyId] = useState<string | undefined>(undefined);
  const [raw, setRaw] = useState("");
  const bulkUpdate = useBulkUpdateBookmarks();

  const settable = properties.filter(property => BULK_SETTABLE_TYPES.has(property.type));
  const property = settable.find(p => p.id === propertyId);
  if (settable.length === 0) return null;

  function apply() {
    if (!property) return;
    const patch = propertyValuePatch(property, raw);
    if (!patch) return;
    bulkUpdate.mutate({
      ids,
      patch,
    }, {
      onSuccess: () => {
        setOpen(false);
        setPropertyId(undefined);
        setRaw("");
        onDone();
      },
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
        >{t("Set property")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("Set a property value")}</DialogTitle>
          <DialogDescription>
            {t("Sets one property on {{count}} selected {{noun}}, keeping their other values.", {
              count: ids.length,
              noun: ids.length === 1 ? t("bookmark") : t("bookmarks"),
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Combobox
            options={settable.map(p => ({
              value: p.id,
              label: p.name,
            }))}
            value={propertyId}
            onValueChange={(next) => {
              setPropertyId(next);
              setRaw("");
            }}
            placeholder={t("Select a property")}
          />
          {property
            ? (
              <div className="space-y-1">
                <Label>{property.name}</Label>
                <PropertyValueInput
                  property={property}
                  value={raw}
                  onChange={setRaw}
                />
              </div>
            )
            : null}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t("Cancel")}</Button>
          </DialogClose>
          <Button
            disabled={!property || bulkUpdate.isPending}
            onClick={apply}
          >{t("Apply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** The value input for a settable property — a Yes/No combobox, a date, or a number. */
function PropertyValueInput({
  property,
  value,
  onChange,
}: {
  property: CustomProperty;
  value: string;
  onChange: (value: string) => void;
}) {
  const {
    t,
  } = useTranslation();
  if (property.type === "boolean") {
    return (
      <Combobox
        options={[
          {
            value: "true",
            label: t("Yes"),
          },
          {
            value: "false",
            label: t("No"),
          },
        ]}
        value={value || undefined}
        onValueChange={next => onChange(next ?? "")}
        placeholder={t("Select a value")}
      />
    );
  }
  if (property.type === "datetime") {
    return (
      <Input
        type="datetime-local"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    );
  }
  return (
    <Input
      type="number"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={t("Enter a number")}
    />
  );
}
