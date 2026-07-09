import { useTranslation } from "react-i18next";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface WebsiteScanIsbnFieldProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

/** The "Scan URL for ISBN" flag checkbox for a website's General edit tab. */
export function WebsiteScanIsbnField({
  checked,
  onCheckedChange,
}: WebsiteScanIsbnFieldProps) {
  const {
    t,
  } = useTranslation();

  return (
    <div className="flex items-start gap-3">
      <Checkbox
        id="scan-url-for-isbn"
        checked={checked}
        onCheckedChange={value => onCheckedChange(value === true)}
      />
      <div className="space-y-1">
        <Label htmlFor="scan-url-for-isbn">{t("Scan URL for ISBN")}</Label>
        <p className="text-sm text-muted-foreground">
          {t("When a bookmark URL from this site is scanned, read the page for an ISBN and autofill the ISBN field. ISBN autodetect only runs for sites with this enabled.")}
        </p>
      </div>
    </div>
  );
}
