export const marketRuleProcesses = [
  "licence",
  "risk",
  "balancing",
  "data",
  "billing",
  "customer",
  "reporting",
  "sales",
] as const;

export type MarketRuleProcess = (typeof marketRuleProcesses)[number];
export type MarketRuleKind = "must" | "opp";
export type MarketRuleStatus = "in_force" | "coming";
export type MarketRuleImpact = "high" | "medium" | "low";

export type MarketRuleSource = {
  label: string;
  url: string;
};

export type MarketRule = {
  id: string;
  title: string;
  kind: MarketRuleKind;
  process: MarketRuleProcess;
  status: MarketRuleStatus;
  key_date: string | null;
  impact: MarketRuleImpact;
  rule_text: string;
  impact_text: string;
  steps: string[];
  sources: MarketRuleSource[];
  check: boolean;
  checked_at: string;
};

export const marketRulesAreMockData = true;

const mockSource: MarketRuleSource = {
  label: "Mock source — replace from backend",
  url: "https://example.com/replace-with-backend-source",
};

const mockRuleText =
  "Temporary mock content for frontend layout testing. Replace this record with backend-provided, source-verified rule text.";

/**
 * UI-only fixtures. These records are deliberately generic and are not a
 * regulatory dataset. Replace this export with the Supabase query result.
 */
export const marketRules: MarketRule[] = [
  {
    id: "M01",
    title: "Mock licence requirement",
    kind: "must",
    process: "licence",
    status: "in_force",
    key_date: null,
    impact: "high",
    rule_text: mockRuleText,
    impact_text: "Tests a high-impact market-access card and expanded details.",
    steps: ["Mock first process step", "Mock second process step"],
    sources: [mockSource],
    check: false,
    checked_at: "2026-11-21",
  },
  {
    id: "M02",
    title: "Mock procurement control",
    kind: "must",
    process: "risk",
    status: "in_force",
    key_date: null,
    impact: "high",
    rule_text: mockRuleText,
    impact_text: "Tests the risk and procurement filter state.",
    steps: ["Mock control step", "Mock reporting step"],
    sources: [mockSource],
    check: false,
    checked_at: "2026-11-21",
  },
  {
    id: "M03",
    title: "Mock balancing obligation",
    kind: "must",
    process: "balancing",
    status: "in_force",
    key_date: null,
    impact: "high",
    rule_text: mockRuleText,
    impact_text: "Tests a balancing rule with several suggested process steps.",
    steps: ["Mock partner decision", "Mock daily workflow", "Mock cost tracking"],
    sources: [mockSource],
    check: false,
    checked_at: "2026-11-21",
  },
  {
    id: "M04",
    title: "Mock market data access",
    kind: "must",
    process: "data",
    status: "in_force",
    key_date: null,
    impact: "medium",
    rule_text: mockRuleText,
    impact_text: "Tests the metering and market-data process state.",
    steps: ["Mock registration step", "Mock integration step"],
    sources: [mockSource],
    check: false,
    checked_at: "2026-11-21",
  },
  {
    id: "M05",
    title: "Mock billing change",
    kind: "must",
    process: "billing",
    status: "coming",
    key_date: "2027-01-01",
    impact: "high",
    rule_text: mockRuleText,
    impact_text: "Tests a dated, coming rule in billing and tax.",
    steps: ["Mock invoice update", "Mock release check"],
    sources: [mockSource],
    check: false,
    checked_at: "2026-11-21",
  },
  {
    id: "M06",
    title: "Mock customer protection rule",
    kind: "must",
    process: "customer",
    status: "in_force",
    key_date: null,
    impact: "medium",
    rule_text: mockRuleText,
    impact_text: "Tests contracts and customer-protection content.",
    steps: ["Mock onboarding update", "Mock contract update"],
    sources: [mockSource],
    check: false,
    checked_at: "2026-11-21",
  },
  {
    id: "M07",
    title: "Mock annual disclosure",
    kind: "must",
    process: "reporting",
    status: "coming",
    key_date: "2027-05-01",
    impact: "low",
    rule_text: mockRuleText,
    impact_text: "Tests a low-impact disclosure with a future key date.",
    steps: ["Mock evidence collection", "Mock publication step"],
    sources: [mockSource],
    check: false,
    checked_at: "2026-11-21",
  },
  {
    id: "M08",
    title: "Mock client sales trigger",
    kind: "opp",
    process: "sales",
    status: "coming",
    key_date: "2027-12-01",
    impact: "medium",
    rule_text: mockRuleText,
    impact_text: "Tests the client-rule treatment and sales-opportunity filter.",
    steps: ["Mock client segment", "Mock outreach campaign"],
    sources: [mockSource],
    check: false,
    checked_at: "2026-11-21",
  },
];
