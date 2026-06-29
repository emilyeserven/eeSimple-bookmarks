import { usePanelControls } from "./usePanelControls";
import { useCreateCardDisplayRule } from "../../hooks/useCardDisplayRules";
import { CardDisplayRuleForm } from "../CardDisplayRuleForm";

/** Create form: on success, re-target the panel at the saved rule so editing continues inline. */
export function CreateCardDisplayRule() {
  const {
    openItem, openType,
  } = usePanelControls();
  const create = useCreateCardDisplayRule();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">New card display rule</h2>
        <p className="text-sm text-muted-foreground">
          Override how matching bookmark cards display — which fields show, where, and how the image is
          presented.
        </p>
      </div>
      <CardDisplayRuleForm
        isPending={create.isPending}
        onSave={(values) => {
          create.mutate(
            {
              name: values.name,
              description: values.description,
              conditions: values.conditions,
              ...values.display,
            },
            {
              onSuccess: rule => openItem("card-display-rule", rule.id, "edit"),
            },
          );
        }}
        onCancel={() => openType("card-display-rule")}
      />
    </div>
  );
}
