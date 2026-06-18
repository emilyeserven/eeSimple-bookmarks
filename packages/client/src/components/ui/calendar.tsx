import type { ComponentProps } from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CalendarProps = ComponentProps<typeof DayPicker>;

/** Calendar primitive wrapping `react-day-picker`, styled to match the app's button/popover look. */
function Calendar({
  className, classNames, showOutsideDays = true, ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "relative flex flex-col gap-4",
        month: "flex flex-col gap-4",
        month_caption: "flex h-9 items-center justify-center",
        caption_label: "text-sm font-medium",
        nav: "absolute top-3 flex w-[calc(100%-1.5rem)] items-center justify-between",
        button_previous: cn(
          buttonVariants({
            variant: "outline",
          }),
          `
            size-7 bg-transparent p-0 opacity-50
            hover:opacity-100
          `,
        ),
        button_next: cn(
          buttonVariants({
            variant: "outline",
          }),
          `
            size-7 bg-transparent p-0 opacity-50
            hover:opacity-100
          `,
        ),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday: "w-9 rounded-md text-[0.8rem] font-normal text-muted-foreground",
        week: "mt-2 flex w-full",
        day: "size-9 p-0 text-center text-sm",
        day_button: cn(
          buttonVariants({
            variant: "ghost",
          }),
          `
            size-9 p-0 font-normal
            aria-selected:opacity-100
          `,
        ),
        today: "rounded-md bg-accent text-accent-foreground",
        selected:
          `
            rounded-md bg-primary text-primary-foreground
            hover:bg-primary hover:text-primary-foreground
            focus:bg-primary focus:text-primary-foreground
          `,
        outside: "text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({
          orientation,
        }: { orientation?: "left" | "right" | "up" | "down" }) =>
          orientation === "left"
            ? <ChevronLeft className="size-4" />
            : <ChevronRight className="size-4" />,
      }}
      {...props}
    />
  );
}

export { Calendar };
