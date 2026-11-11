import type { FillRow } from "./rowTypes";
import type { FillRunResult } from "../../lib/fill/fillEngine";
import type { ExtensionFillContext, WebsiteExtensionFillRule } from "@eesimple/types";

import { buildFieldRow, buildImageRow, buildSectionsRow, buildTaxonomyRow } from "./bookmarkRows";
import { buildTaxonomyDirectRow } from "./directRows";
import { buildTaxonomyEntityRow } from "./entityRows";
import { buildPropertyRow } from "./propertyRows";
import { baseRow } from "./rowTypes";

/**
 * Turn one rule + its engine result into a review row. Exhaustive over `FillTarget["kind"]`: a new
 * target kind fails `tsc` here until it has a builder (the old popup fell through to "unsupported").
 */
export function buildRow(rule: WebsiteExtensionFillRule, result: FillRunResult | undefined, ctx: ExtensionFillContext): FillRow {
  const target = rule.target;
  const values = result?.values ?? [];
  if (target.kind === "taxonomyDirect") return buildTaxonomyDirectRow(rule, target, result, ctx);
  if (target.kind === "taxonomyEntity") return buildTaxonomyEntityRow(rule, target, values, ctx);
  // Every other kind writes the bookmark itself, so it needs one (taxonomy mode has none).
  const bookmark = ctx.bookmark;
  if (!bookmark) return baseRow(rule, "", values[0] ?? "", false, "unsupported");
  const properties = ctx.properties ?? [];
  switch (target.kind) {
    case "field":
      return buildFieldRow(rule, target, values, bookmark);
    case "customProperty":
      return buildPropertyRow(rule, target, values, bookmark, properties);
    case "taxonomy":
      return buildTaxonomyRow(rule, target, values, bookmark, ctx);
    case "image":
      return buildImageRow(rule, target, values, bookmark);
    case "sections":
      return buildSectionsRow(rule, target, result?.entries ?? [], bookmark, properties);
    default: {
      // Compile-time exhaustiveness; at runtime a rule from a newer server still renders, disabled.
      const unknownTarget: never = target;
      void unknownTarget;
      return baseRow(rule, "", values[0] ?? "", false, "unsupported");
    }
  }
}
