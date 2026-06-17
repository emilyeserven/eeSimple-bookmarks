import { AutofillRulePanel } from "./AutofillRulePanel";
import { TagPanel } from "./TagPanel";
import { usePanelControls } from "./usePanelControls";

/**
 * Dispatches the right-hand panel's body based on the `dCT`/`dCId` search params. Keyed by the
 * target so switching rule/tag remounts the editor with fresh form defaults.
 */
export function PanelContent() {
  const {
    dCT, dCId,
  } = usePanelControls();

  if (!dCT || !dCId) return null;

  if (dCT === "autofill") {
    return (
      <AutofillRulePanel
        key={`autofill:${dCId}`}
        ruleId={dCId}
      />
    );
  }

  return (
    <TagPanel
      key={`tag:${dCId}`}
      tagId={dCId}
    />
  );
}
