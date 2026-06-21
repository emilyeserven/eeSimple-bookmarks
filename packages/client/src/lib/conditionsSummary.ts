import type { ConditionMatchOperator, ConditionNode, ConditionTree } from "@eesimple/types";

const OPERATOR_VERBS: Record<ConditionMatchOperator, string> = {
  contains: "contains",
  starts_with: "starts with",
  regex: "matches",
  domain: "domain is",
};

function summarizeNode(node: ConditionNode): string {
  switch (node.type) {
    case "group": {
      if (node.children.length === 0) return "no conditions";
      const joiner = node.combinator === "and" ? " and " : " or ";
      return node.children.map(summarizeNode).join(joiner);
    }
    case "match":
      return node.operator === "domain"
        ? `domain is “${node.pattern}”`
        : `${node.field === "url" ? "URL" : "title"} ${OPERATOR_VERBS[node.operator]} “${node.pattern}”`;
    case "category":
      return `category is one of (${node.categoryIds.length})`;
    case "website":
      return node.domains.length === 1
        ? `website is “${node.domains[0]}”`
        : `website is one of (${node.domains.length})`;
    case "tag":
      return `tagged with (${node.tagIds.length})`;
    case "youtube-channel":
      return node.channelIds.length === 1
        ? "YouTube channel is (1)"
        : `YouTube channel is one of (${node.channelIds.length})`;
    case "media-type":
      return node.mediaTypeIds.length === 1
        ? "media type is (1)"
        : `media type is one of (${node.mediaTypeIds.length})`;
    case "relationship-type":
      return node.relationshipTypeIds.length === 1
        ? "has a relationship of type (1)"
        : `has a relationship of one of (${node.relationshipTypeIds.length})`;
    case "property":
      return `${node.predicate.valueKind} property condition`;
    default: {
      const exhaustive: never = node;
      return exhaustive;
    }
  }
}

/** A short, human-readable one-line summary of a condition tree (for list rows). */
export function summarizeConditions(tree: ConditionTree): string {
  return summarizeNode(tree);
}
