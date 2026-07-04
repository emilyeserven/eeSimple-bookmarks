import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CardDisplayRuleGeneralFieldsProps {
  idPrefix: string;
  name: string;
  description: string | null;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

/** The rule's name + description inputs, shared by the inline General section and its expand modal. */
export function CardDisplayRuleGeneralFields({
  idPrefix, name, description, onNameChange, onDescriptionChange,
}: CardDisplayRuleGeneralFieldsProps) {
  const {
    t,
  } = useTranslation();
  return (
    <>
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-name`}>{t("Name")}</Label>
        <Input
          id={`${idPrefix}-name`}
          value={name}
          onChange={e => onNameChange(e.target.value)}
          placeholder={t("Rule name")}
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-description`}>{t("Description")}</Label>
        <Textarea
          id={`${idPrefix}-description`}
          value={description ?? ""}
          onChange={e => onDescriptionChange(e.target.value)}
          placeholder={t("Optional note")}
          rows={2}
        />
      </div>
    </>
  );
}
