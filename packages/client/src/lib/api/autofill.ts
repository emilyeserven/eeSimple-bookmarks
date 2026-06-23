import type {
  AutofillApplyInput,
  AutofillApplyResult,
  AutofillBackfillResult,
  AutofillPreviewInput,
  AutofillPreviewResult,
  AutofillRule,
  CreateAutofillRuleInput,
  UpdateAutofillRuleInput,
} from "@eesimple/types";

import { createCrudApi, request } from "./client";

export const autofillApi = {
  ...createCrudApi<AutofillRule, CreateAutofillRuleInput, UpdateAutofillRuleInput>("autofill-rules"),
  getBySlug: (slug: string) =>
    request<AutofillRule>(`/autofill-rules/by-slug/${encodeURIComponent(slug)}`),
  preview: (input: AutofillPreviewInput) =>
    request<AutofillPreviewResult>("/autofill-rules/preview", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  getBackfill: (ruleId: string) =>
    request<AutofillBackfillResult>(`/autofill-rules/${encodeURIComponent(ruleId)}/backfill`),
  applyBackfill: (ruleId: string, input: AutofillApplyInput) =>
    request<AutofillApplyResult>(`/autofill-rules/${encodeURIComponent(ruleId)}/backfill/apply`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
};
