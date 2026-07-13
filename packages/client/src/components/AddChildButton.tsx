import { useState } from "react";

import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { AddChildModal } from "./AddChildModal";

import { Button } from "@/components/ui/button";

type AddChildButtonProps = { kind: "tag" | "mediaType";
  /** The current entity's id — becomes the new child's fixed parent. Undefined while loading. */
  parentId: string | undefined; }
  | { kind: "taxonomyTerm";
    /** The current term's id — becomes the new child term's fixed parent. Undefined while loading. */
    parentId: string | undefined;
    taxonomyId: string | undefined;
    taxonomySlug: string; };

function addChildLabel(kind: AddChildButtonProps["kind"], t: (key: string) => string): string {
  if (kind === "tag") return t("New sub-tag");
  if (kind === "mediaType") return t("New sub-type");
  return t("New sub-term");
}

/**
 * Header button (rendered just left of the panel toggle) on a hierarchy-taxonomy *detail* page that
 * quick-creates a child of the current entity, with the parent fixed to it. Keeps its own modal
 * state so `AppHeader` stays lean. Disabled until the parent id (and, for a custom taxonomy term,
 * its taxonomy id) resolve.
 */
export function AddChildButton(props: AddChildButtonProps) {
  const [open, setOpen] = useState(false);
  const {
    t,
  } = useTranslation();

  const disabled = props.kind === "taxonomyTerm"
    ? !props.parentId || !props.taxonomyId
    : !props.parentId;
  const label = addChildLabel(props.kind, t);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={label}
        title={label}
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <Plus className="size-4" />
      </Button>

      <AddChildModal
        {...props}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
