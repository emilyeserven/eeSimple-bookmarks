import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

interface InputGroupProps extends HTMLAttributes<HTMLDivElement> {}

export function InputGroup({
  className, children, ...props
}: InputGroupProps) {
  return (
    <div
      data-slot="input-group"
      className={cn("relative", className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface InputAddonProps extends HTMLAttributes<HTMLDivElement> {
  align?: "inline-start" | "inline-end";
}

export function InputAddon({
  className, align = "inline-start", children, ...props
}: InputAddonProps) {
  return (
    <div
      data-slot="input-addon"
      data-align={align}
      className={cn(
        "absolute inset-y-0 flex items-center",
        align === "inline-end" ? "end-0 pe-1" : "start-0 ps-1",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
