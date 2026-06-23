import type {
  CreateImportRuleInput,
  ImportRule,
  UpdateImportRuleInput,
} from "@eesimple/types";

import { createCrudApi, request } from "./client";

export const importRulesApi = {
  ...createCrudApi<ImportRule, CreateImportRuleInput, UpdateImportRuleInput>("import-rules"),
  getBySlug: (slug: string) =>
    request<ImportRule>(`/import-rules/by-slug/${encodeURIComponent(slug)}`),
};
