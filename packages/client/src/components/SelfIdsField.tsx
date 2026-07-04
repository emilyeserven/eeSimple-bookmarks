import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SelfIdsFieldProps {
  /** The current self-identifier strings (rendered as removable badges). */
  selfIds: string[];
  /** The draft value of the "add" input. */
  newSelfId: string;
  onNewSelfIdChange: (value: string) => void;
  /** Commit the draft (also fired on Enter). */
  onAdd: () => void;
  /** Remove one existing self-identifier. */
  onRemove: (id: string) => void;
  label?: string;
  description: string;
}

/**
 * Controlled editor for a channel's "self-identifiers" — the short names a channel appends to its
 * video titles, stripped from bookmark titles. Shared by `YouTubeChannelGeneralForm` and the inline
 * `WebsiteLookupBanner` so the badge-list + add-input UI lives in one place.
 */
export function SelfIdsField({
  selfIds, newSelfId, onNewSelfIdChange, onAdd, onRemove, label, description,
}: SelfIdsFieldProps) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-2">
      <Label className="block">{label ?? t("Self-identifiers")}</Label>
      <p className="text-sm text-muted-foreground">{description}</p>
      {selfIds.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selfIds.map(id => (
            <Badge
              key={id}
              variant="secondary"
              className="cursor-pointer gap-1"
              onClick={() => onRemove(id)}
              title={t("Remove \"{{id}}\"", {
                id,
              })}
            >
              {id}
              <span aria-hidden>×</span>
            </Badge>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={newSelfId}
          onChange={e => onNewSelfIdChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
          placeholder={t("e.g. SNL")}
          className="h-8 text-sm"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onAdd}
          disabled={!newSelfId.trim()}
        >
          {t("Add")}
        </Button>
      </div>
    </div>
  );
}
