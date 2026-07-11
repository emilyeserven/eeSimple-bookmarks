import type { CustomPropertyInputs } from "./bookmarkFormSchema";
import type { SectionEntry } from "@eesimple/types";

/**
 * The per-kind custom-property input state + change handlers shared by the bookmark form's two
 * custom-field surfaces (the main `RevealedCustomFields` and the Advanced section). Extends the
 * canonical {@link CustomPropertyInputs} value maps and adds the change handlers, so the input-map
 * block lives in one place instead of being repeated (and drifting) here.
 */
export interface CustomFieldControls extends CustomPropertyInputs {
  onNumberChange: (id: string, value: string) => void;
  onBooleanChange: (id: string, value: boolean) => void;
  onDateTimeChange: (id: string, value: string) => void;
  onChoicesChange: (id: string, values: string[]) => void;
  onProgressChange: (id: string, field: "current" | "total", value: string) => void;
  onSectionsChange: (id: string, value: { exhaustive: boolean;
    sections: SectionEntry[]; }) => void;
  onTextChange: (id: string, value: string) => void;
  /** Match-or-create author names parsed from a pasted list into the bookmark's People. */
  onAddPeople?: (names: string[]) => void;
}
