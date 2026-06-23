import type {
  ConditionMatchOperator,
  ConditionNode,
  ConditionTree,
  ImportRule,
  ImportRuleAction,
} from "@eesimple/types";

const OPERATOR_VERBS: Record<ConditionMatchOperator, string> = {
  contains: "contains",
  starts_with: "starts with",
  regex: "matches",
  domain: "domain is",
};

const ACTION_LABELS: Record<ImportRuleAction, string> = {
  approve: "Approve",
  reject: "Reject",
  block: "Block",
};

function describeImportConditionNode(node: ConditionNode): string {
  switch (node.type) {
    case "group": {
      if (node.children.length === 0) return "(empty group)";
      const combLabel = node.combinator === "and" ? "ALL" : "ANY";
      const inner = node.children.map(describeImportConditionNode).join(node.combinator === "and" ? " AND " : " OR ");
      return `${combLabel} of: (${inner})`;
    }
    case "match":
      return node.operator === "domain"
        ? `Domain is "${node.pattern}"`
        : `${node.field === "url" ? "URL" : "Title"} ${OPERATOR_VERBS[node.operator]} "${node.pattern}"`;
    case "website":
      return node.domains.length === 1
        ? `Website is: ${node.domains[0]}`
        : `Website is one of: ${node.domains.join(", ")}`;
    default:
      return "(unsupported condition type)";
  }
}

/** Body of the General view tab: action badge, description, and metadata. */
export function ImportRuleGeneralFields({
  rule,
}: { rule: ImportRule }) {
  return (
    <div className="space-y-3 text-sm">
      <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2">
        <dt className="text-muted-foreground">Action</dt>
        <dd className="font-medium">{ACTION_LABELS[rule.action]}</dd>
        <dt className="text-muted-foreground">Priority</dt>
        <dd>{rule.sortOrder}</dd>
        <dt className="text-muted-foreground">Slug</dt>
        <dd className="font-mono">{rule.slug}</dd>
        <dt className="text-muted-foreground">Added</dt>
        <dd>{new Date(rule.createdAt).toLocaleDateString()}</dd>
      </dl>
      {rule.description
        ? <p className="mt-2">{rule.description}</p>
        : <p className="text-muted-foreground">No description.</p>}
    </div>
  );
}

/** Body of the Conditions view tab: detailed breakdown of the condition tree. */
export function ImportRuleConditionsFields({
  rule,
}: { rule: ImportRule }) {
  const tree: ConditionTree = rule.conditions;
  if (tree.children.length === 0) {
    return <p className="text-sm text-muted-foreground">Always matches (no conditions set.)</p>;
  }
  const combinatorLabel = tree.combinator === "and" ? "ALL" : "ANY";
  return (
    <div className="space-y-2 text-sm">
      <p className="text-muted-foreground">
        Matches
        {" "}
        {combinatorLabel}
        {" "}
        of:
      </p>
      <ul className="space-y-1">
        {tree.children.map((child, index) => (
          <li
            key={index}
            className="flex gap-2"
          >
            <span className="text-muted-foreground">•</span>
            <span>{describeImportConditionNode(child)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
