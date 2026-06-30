import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface WebsiteRedirectFailureFieldProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

/** The "Redirect resolution failure" flag checkbox for a website's General edit tab. */
export function WebsiteRedirectFailureField({
  checked,
  onCheckedChange,
}: WebsiteRedirectFailureFieldProps) {
  return (
    <div className="flex items-start gap-3">
      <Checkbox
        id="redirect-resolution-failure"
        checked={checked}
        onCheckedChange={value => onCheckedChange(value === true)}
      />
      <div className="space-y-1">
        <Label htmlFor="redirect-resolution-failure">Redirect resolution failure</Label>
        <p className="text-sm text-muted-foreground">
          Flag this site when its redirects resolve unreliably. Flagged bookmarks appear in
          Settings → Redirect Failures for URL correction.
        </p>
      </div>
    </div>
  );
}
