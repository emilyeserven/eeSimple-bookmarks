import type { ReactNode } from "react";

import { Checkbox } from "@/components/ui/checkbox";

/** A "set as default for <source>" checkbox row, shared by the category / media-type / tags fields. */
export function SourceDefaultCheckbox({
  checked, onCheckedChange, children,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <Checkbox
        checked={checked}
        onCheckedChange={v => onCheckedChange(Boolean(v))}
      />
      {children}
    </label>
  );
}
