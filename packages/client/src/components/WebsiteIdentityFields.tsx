import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** The name/domain inputs plus Save button at the top of an editable website row. */
export function WebsiteIdentityFields({
  websiteId,
  builtIn,
  siteName,
  domain,
  onSiteNameChange,
  onDomainChange,
  canSave,
  isPending,
  onSave,
}: {
  websiteId: string;
  builtIn: boolean;
  siteName: string;
  domain: string;
  onSiteNameChange: (value: string) => void;
  onDomainChange: (value: string) => void;
  canSave: boolean;
  isPending: boolean;
  onSave: () => void;
}) {
  return (
    <div className="space-y-2">
      <div
        className="
          grid gap-3
          sm:grid-cols-[1fr_1fr_auto] sm:items-end
        "
      >
        <div className="space-y-1">
          <Label htmlFor={`site-name-${websiteId}`}>Site name</Label>
          <Input
            id={`site-name-${websiteId}`}
            value={siteName}
            disabled={builtIn}
            onChange={event => onSiteNameChange(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`site-domain-${websiteId}`}>Domain</Label>
          <Input
            id={`site-domain-${websiteId}`}
            value={domain}
            disabled={builtIn}
            onChange={event => onDomainChange(event.target.value)}
          />
        </div>
        <Button
          type="button"
          size="sm"
          disabled={!canSave || isPending}
          onClick={onSave}
        >
          {isPending ? "Saving…" : "Save"}
        </Button>
      </div>
      {builtIn
        ? (
          <p className="text-xs text-muted-foreground">
            Built-in site — its name and domain are fixed, but you can edit its rules below.
          </p>
        )
        : null}
    </div>
  );
}
