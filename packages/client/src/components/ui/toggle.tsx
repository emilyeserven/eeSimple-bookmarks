import type { VariantProps } from "class-variance-authority";

import * as React from "react";

import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const toggleVariants = cva(
  `
    inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm
    font-medium whitespace-nowrap transition-colors outline-none
    focus-visible:border-ring focus-visible:ring-[3px]
    focus-visible:ring-ring/50
    disabled:pointer-events-none disabled:opacity-50
    data-[state=on]:bg-primary data-[state=on]:text-primary-foreground
    [&_svg]:pointer-events-none [&_svg]:shrink-0
    [&_svg:not([class*='size-'])]:size-4
  `,
  {
    variants: {
      variant: {
        default: `
          bg-transparent
          hover:bg-accent hover:text-accent-foreground
        `,
        outline:
          `
            border border-input bg-transparent shadow-xs
            hover:bg-accent hover:text-accent-foreground
          `,
      },
      size: {
        default: "h-9 min-w-9 px-2",
        sm: "h-7 min-w-7 rounded-sm px-1.5",
        lg: "h-10 min-w-10 px-2.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root>
  & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({
        variant,
        size,
        className,
      }))}
      {...props}
    />
  );
}

export { Toggle, toggleVariants };
