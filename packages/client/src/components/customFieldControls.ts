import type { SectionEntry } from "@eesimple/types";

/**
 * The per-kind custom-property input state + change handlers shared by the bookmark form's two
 * custom-field surfaces (the main `RevealedCustomFields` and the Advanced section). Both extend this
 * so the 14-member block lives in one place instead of being repeated (and drifting) in each.
 */
export interface CustomFieldControls {
  numberInputs: Record<string, string>;
  booleanInputs: Record<string, boolean>;
  dateTimeInputs: Record<string, string>;
  choicesInputs: Record<string, string[]>;
  progressInputs: Record<string, { current: string;
    total: string; }>;
  sectionsInputs: Record<string, { exhaustive: boolean;
    sections: SectionEntry[]; }>;
  textInputs: Record<string, string>;
  onNumberChange: (id: string, value: string) => void;
  onBooleanChange: (id: string, value: boolean) => void;
  onDateTimeChange: (id: string, value: string) => void;
  onChoicesChange: (id: string, values: string[]) => void;
  onProgressChange: (id: string, field: "current" | "total", value: string) => void;
  onSectionsChange: (id: string, value: { exhaustive: boolean;
    sections: SectionEntry[]; }) => void;
  onTextChange: (id: string, value: string) => void;
}
