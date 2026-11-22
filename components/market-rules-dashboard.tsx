"use client";

import { useMemo, useState } from "react";
import type {
  MarketRule,
  MarketRuleImpact,
  MarketRuleKind,
  MarketRuleProcess,
  MarketRuleStatus,
} from "@/lib/data/market-rules";
import { marketRuleProcesses } from "@/lib/data/market-rules";
import {
  ArrowUpRightIcon,
  BellIcon,
  BoltIcon,
  CheckIcon,
  ChecklistIcon,
  ChevronDownIcon,
  ClockIcon,
  CloseIcon,
  HomeIcon,
  LayersIcon,
  MenuIcon,
  SearchIcon,
  ShieldIcon,
  SparkIcon,
} from "@/components/icons";

type FilterValue<T extends string> = "all" | T;

const processLabels: Record<MarketRuleProcess, string> = {
  licence: "Licensing & market access",
  risk: "Risk & procurement",
  balancing: "Balancing & wholesale",
  data: "Metering & market data",
  billing: "Billing & tax",
  customer: "Contracts & protection",
  reporting: "Reporting & disclosure",
  sales: "Client triggers (sales)",
};

const processQuestions: Record<MarketRuleProcess, string> = {
  licence: "Can we legally supply?",
  risk: "Can we survive a price shock?",
  balancing: "Who carries imbalance?",
  data: "Can we switch and read meters?",
  billing: "Is every invoice line right?",
  customer: "Which client gets which terms?",
  reporting: "What must we publish?",
  sales: "Which client rule opens a deal?",
};

const impactLabels: Record<MarketRuleImpact, string> = {
  high: "High impact",
  medium: "Medium impact",
  low: "Low impact",
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function SelectFilter<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: FilterValue<T>;
  onChange: (value: FilterValue<T>) => void;
  options: readonly { value: T; label: string }[];
}) {
  return (
    <label className="relative min-w-40 flex-1 sm:flex-none">
      <span className="sr-only">{label}</span>
      <select
        className="h-10 w-full appearance-none rounded-xl border border-[#d7dce2] bg-white pl-3 pr-9 text-sm font-medium text-[#20252b] outline-none transition hover:border-[#9aa3ad] focus:border-[#20252b] focus:ring-2 focus:ring-[#20252b]/10"
        value={value}
        onChange={(event) => onChange(event.target.value as FilterValue<T>)}
      >
        <option value="all">All {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-3 top-3 size-4 text-[#6d7580]" />
    </label>
  );
}

function StatusPill({ status }: { status: MarketRuleStatus }) {
  const isInForce = status === "in_force";

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e9ebee] px-2.5 py-1 text-xs font-medium text-[#20252b]">
      {isInForce ? <CheckIcon className="size-3.5" /> : <ClockIcon className="size-3.5" />}
      {isInForce ? "In force" : "Coming"}
    </span>
  );
}

function ImpactPill({ impact }: { impact: MarketRuleImpact }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
        impact === "high"
          ? "border-[#20252b] bg-[#20252b] text-white"
          : impact === "medium"
            ? "border-[#b7bec6] bg-[#f1f2f4] text-[#20252b]"
            : "border-[#d7dce2] bg-white text-[#59616b]"
      }`}
    >
      {impactLabels[impact]}
    </span>
  );
}

function RuleDetails({ rule }: { rule: MarketRule }) {
  return (
    <div className="grid gap-6 border-t border-[#d7dce2] bg-[#f7f8f9] px-4 py-5 md:grid-cols-[1.15fr_0.85fr] md:px-6">
      <div>
        <p className="market-kicker">What the rule says</p>
        <p className="mt-2 text-sm leading-6 text-[#454c55]">{rule.rule_text}</p>

        <p className="market-kicker mt-5">What this means for trawa</p>
        <p className="mt-2 text-sm leading-6 text-[#454c55]">{rule.impact_text}</p>

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#6d7580]">
          <span>Checked {formatDate(rule.checked_at)}</span>
          {rule.check ? (
            <span className="rounded-full border border-[#c8cdd3] bg-white px-2 py-1 font-medium text-[#454c55]">
              Secondary source — re-check
            </span>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border border-[#d7dce2] bg-white p-4">
        <p className="market-kicker flex items-center gap-2">
          <SparkIcon className="size-4" />
          Suggested process steps
        </p>
        <ol className="mt-3 space-y-3">
          {rule.steps.map((step, index) => (
            <li key={step} className="flex gap-3 text-sm leading-5 text-[#454c55]">
              <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#20252b] text-[11px] font-semibold text-white">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>

        <div className="mt-5 border-t border-[#e3e6e9] pt-4">
          <p className="market-kicker">Evidence / sources</p>
          <div className="mt-2 flex flex-col items-start gap-2">
            {rule.sources.map((source) => (
              <a
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#20252b] underline decoration-[#aab0b8] underline-offset-4 hover:decoration-[#20252b]"
              >
                {source.label}
                <ArrowUpRightIcon className="size-3.5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MarketRulesDashboard({
  rules,
  isMockData = false,
}: {
  rules: MarketRule[];
  isMockData?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [process, setProcess] = useState<FilterValue<MarketRuleProcess>>("all");
  const [kind, setKind] = useState<FilterValue<MarketRuleKind>>("all");
  const [status, setStatus] = useState<FilterValue<MarketRuleStatus>>("all");
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

  const filteredRules = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rules.filter((rule) => {
      const matchesSearch =
        !query ||
        [rule.id, rule.title, rule.rule_text, rule.impact_text, ...rule.steps]
          .join(" ")
          .toLowerCase()
          .includes(query);

      return (
        matchesSearch &&
        (process === "all" || rule.process === process) &&
        (kind === "all" || rule.kind === kind) &&
        (status === "all" || rule.status === status)
      );
    });
  }, [kind, process, rules, search, status]);

  const attentionRules = useMemo(
    () =>
      [...rules]
        .filter(
          (rule) =>
            rule.kind === "must" &&
            (rule.impact === "high" || rule.status === "coming"),
        )
        .sort((first, second) => {
          if (first.impact === "high" && second.impact !== "high") return -1;
          if (first.impact !== "high" && second.impact === "high") return 1;
          return (first.key_date ?? "9999").localeCompare(second.key_date ?? "9999");
        }),
    [rules],
  );

  const prerequisiteRules = useMemo(
    () =>
      rules
        .filter((rule) => ["licence", "balancing", "data", "billing"].includes(rule.process))
        .slice(0, 5),
    [rules],
  );

  const processSummaries = useMemo(
    () =>
      marketRuleProcesses.map((processName) => {
        const processRules = rules.filter((rule) => rule.process === processName);
        const nextDate = processRules
          .map((rule) => rule.key_date)
          .filter((date): date is string => Boolean(date))
          .sort()[0];

        return {
          name: processName,
          count: processRules.length,
          highCount: processRules.filter((rule) => rule.impact === "high").length,
          nextDate,
        };
      }),
    [rules],
  );

  function clearFilters() {
    setSearch("");
    setProcess("all");
    setKind("all");
    setStatus("all");
  }

  function showRule(rule: MarketRule) {
    clearFilters();
    setExpandedRule(rule.id);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.querySelector(`[data-rule-id="${rule.id}"]`)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });
    });
  }

  return (
    <div className="min-h-screen bg-[#f4f5f6] text-[#20252b]">
      <header className="sticky top-0 z-40 border-b border-[#d7dce2] bg-white/95 backdrop-blur lg:hidden">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <a href="#top" className="flex items-center gap-3 font-semibold tracking-[-0.02em]">
            <span className="grid size-9 place-items-center rounded-xl bg-[#eef0f2]">
              <BoltIcon className="size-5" />
            </span>
            Netherlands GTM Dashboard
          </a>
          <button
            type="button"
            aria-label={mobileNavigationOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileNavigationOpen}
            className="grid size-10 place-items-center rounded-xl border border-[#d7dce2] bg-white"
            onClick={() => setMobileNavigationOpen((current) => !current)}
          >
            {mobileNavigationOpen ? <CloseIcon className="size-5" /> : <MenuIcon className="size-5" />}
          </button>
        </div>
        {mobileNavigationOpen ? (
          <nav className="grid gap-1 border-t border-[#e3e6e9] bg-white p-3 text-sm">
            <a href="#top" className="market-nav-link market-nav-link-active" onClick={() => setMobileNavigationOpen(false)}>
              <HomeIcon className="size-5" /> Overview
            </a>
            <a href="#rules" className="market-nav-link" onClick={() => setMobileNavigationOpen(false)}>
              <ShieldIcon className="size-5" /> Compliance
            </a>
            <a href="#prerequisites" className="market-nav-link" onClick={() => setMobileNavigationOpen(false)}>
              <ChecklistIcon className="size-5" /> Prerequisites
            </a>
            <a href="#processes" className="market-nav-link" onClick={() => setMobileNavigationOpen(false)}>
              <LayersIcon className="size-5" /> Process coverage
            </a>
          </nav>
        ) : null}
      </header>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[250px] flex-col border-r border-[#d7dce2] bg-[#f7f8f9] px-3 py-7 lg:flex">
        <a href="#top" className="flex items-center gap-3 px-2">
          <span className="grid size-11 place-items-center rounded-xl bg-[#e9ebee]">
            <BoltIcon className="size-6" />
          </span>
          <span className="text-[17px] font-semibold leading-5 tracking-[-0.025em]">
            Netherlands
            <span className="block">GTM Dashboard</span>
          </span>
        </a>

        <nav className="mt-10 grid gap-1 text-[15px]">
          <a href="#top" className="market-nav-link market-nav-link-active">
            <HomeIcon className="size-5" /> Overview
          </a>
          <a href="#rules" className="market-nav-link">
            <ShieldIcon className="size-5" /> Compliance
          </a>
          <a href="#prerequisites" className="market-nav-link">
            <ChecklistIcon className="size-5" /> Prerequisites
          </a>
          <a href="#processes" className="market-nav-link">
            <LayersIcon className="size-5" /> Process coverage
          </a>
        </nav>

        <div className="mt-auto rounded-xl border border-[#d7dce2] bg-white p-4">
          <p className="text-sm font-semibold">Market scope</p>
          <p className="mt-1.5 text-xs leading-5 text-[#6d7580]">
            B2B · SME + mid-market
            <br />
            Power + gas · Netherlands
          </p>
        </div>
      </aside>

      <main id="top" className="lg:pl-[250px]">
        <div className="mx-auto max-w-[1480px] px-4 pb-16 pt-7 sm:px-7 lg:px-8 lg:pt-5 xl:px-9">
          <header>
            <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.045em] sm:text-[38px]">
              Netherlands market &amp; compliance overview
            </h1>
            <p className="mt-1 text-base text-[#59616b] sm:text-lg">
              Energy market entry, supplier setup and regulatory compliance in the Netherlands
            </p>
            {isMockData ? (
              <p className="mt-3 inline-flex rounded-full border border-[#c8cdd3] bg-white px-3 py-1 text-xs font-medium text-[#59616b]">
                Temporary interface data · verified backend content pending
              </p>
            ) : null}
          </header>

          <section className="market-panel mt-7 overflow-hidden" aria-labelledby="attention-title">
            <div className="flex flex-wrap items-center gap-3 px-4 py-4 sm:px-5">
              <span className="grid size-9 place-items-center rounded-xl bg-white shadow-sm ring-1 ring-[#e3e6e9]">
                <BellIcon className="size-5" />
              </span>
              <h2 id="attention-title" className="text-xl font-semibold tracking-[-0.025em]">
                Needs attention
              </h2>
              <span className="text-sm text-[#59616b]">
                {attentionRules.length} {attentionRules.length === 1 ? "item" : "items"} to review
              </span>
            </div>

            <div className="mx-2 mb-2 overflow-hidden rounded-xl border border-white bg-white/80">
              {attentionRules.slice(0, 4).map((rule) => (
                <div
                  key={rule.id}
                  className="grid gap-3 border-b border-[#d7dce2] px-3 py-3 last:border-b-0 sm:grid-cols-[44px_1fr_auto] sm:items-center"
                >
                  <span className="hidden size-10 place-items-center rounded-xl border border-[#c8cdd3] bg-[#f7f8f9] sm:grid">
                    {rule.status === "coming" ? <ClockIcon className="size-5" /> : <CheckIcon className="size-5" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold leading-5">{rule.title}</span>
                    <span className="mt-0.5 block truncate text-sm text-[#59616b]">
                      {processLabels[rule.process]} · {rule.impact_text}
                    </span>
                  </span>
                  <button type="button" className="market-outline-button" onClick={() => showRule(rule)}>
                    Review details
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section id="prerequisites" className="mt-8 scroll-mt-20" aria-labelledby="prerequisites-title">
            <h2 id="prerequisites-title" className="market-section-title">Supplier prerequisites</h2>
            <div className="market-table-shell mt-3 overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-left text-sm">
                <thead>
                  <tr>
                    <th>Requirement</th>
                    <th>Process</th>
                    <th>Status</th>
                    <th>Evidence / link</th>
                    <th>Key date</th>
                  </tr>
                </thead>
                <tbody>
                  {prerequisiteRules.map((rule) => (
                    <tr key={rule.id}>
                      <td className="font-medium text-[#20252b]">{rule.title}</td>
                      <td>{processLabels[rule.process]}</td>
                      <td><StatusPill status={rule.status} /></td>
                      <td>
                        <a
                          href={rule.sources[0]?.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 font-medium underline decoration-[#b7bec6] underline-offset-4 hover:decoration-[#20252b]"
                        >
                          {rule.sources[0]?.label ?? "No source"}
                          <ArrowUpRightIcon className="size-3.5" />
                        </a>
                      </td>
                      <td className="whitespace-nowrap">{rule.key_date ? formatDate(rule.key_date) : "Ongoing"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="rules" className="mt-8 scroll-mt-20" aria-labelledby="rules-title">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="rules-title" className="market-section-title">Market rules radar</h2>
                <p aria-live="polite" className="mt-1 text-sm text-[#6d7580]">
                  Showing {filteredRules.length} of {rules.length} rules
                </p>
              </div>
              {(search || process !== "all" || kind !== "all" || status !== "all") ? (
                <button type="button" className="text-sm font-medium underline underline-offset-4" onClick={clearFilters}>
                  Clear filters
                </button>
              ) : null}
            </div>

            <div className="mt-3 flex flex-col gap-2 rounded-t-2xl border border-b-0 border-[#c8cdd3] bg-[#eef0f2] p-3 xl:flex-row">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Search rules</span>
                <SearchIcon className="absolute left-3 top-2.5 size-5 text-[#6d7580]" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search rules, requirements or steps"
                  className="h-10 w-full rounded-xl border border-[#d7dce2] bg-white pl-10 pr-3 text-sm outline-none placeholder:text-[#8b929b] focus:border-[#20252b] focus:ring-2 focus:ring-[#20252b]/10"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <SelectFilter
                  label="Processes"
                  value={process}
                  onChange={setProcess}
                  options={marketRuleProcesses.map((value) => ({ value, label: processLabels[value] }))}
                />
                <SelectFilter
                  label="Types"
                  value={kind}
                  onChange={setKind}
                  options={[
                    { value: "must", label: "Must comply" },
                    { value: "opp", label: "Sales opportunity" },
                  ]}
                />
                <SelectFilter
                  label="Statuses"
                  value={status}
                  onChange={setStatus}
                  options={[
                    { value: "in_force", label: "In force" },
                    { value: "coming", label: "Coming" },
                  ]}
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-b-2xl border border-[#c8cdd3] bg-white">
              {filteredRules.length ? (
                filteredRules.map((rule) => {
                  const expanded = expandedRule === rule.id;
                  return (
                    <article key={rule.id} data-rule-id={rule.id} className="border-b border-[#d7dce2] last:border-b-0">
                      <button
                        type="button"
                        aria-expanded={expanded}
                        className="grid w-full gap-3 px-4 py-4 text-left transition hover:bg-[#f7f8f9] md:grid-cols-[minmax(250px,1.35fr)_minmax(170px,0.8fr)_auto_auto_32px] md:items-center md:px-5"
                        onClick={() => setExpandedRule(expanded ? null : rule.id)}
                      >
                        <span className="min-w-0">
                          <span className="block font-semibold leading-5">{rule.title}</span>
                          <span className="mt-1 block truncate text-sm text-[#6d7580]">{rule.impact_text}</span>
                        </span>
                        <span className="text-sm text-[#454c55]">{processLabels[rule.process]}</span>
                        <StatusPill status={rule.status} />
                        <ImpactPill impact={rule.impact} />
                        <span className={`grid size-8 place-items-center rounded-lg border border-[#d7dce2] bg-white transition ${expanded ? "rotate-180" : ""}`}>
                          <ChevronDownIcon className="size-4" />
                        </span>
                      </button>
                      {expanded ? <RuleDetails rule={rule} /> : null}
                    </article>
                  );
                })
              ) : (
                <div className="grid min-h-64 place-items-center px-6 text-center">
                  <div>
                    <span className="mx-auto grid size-11 place-items-center rounded-xl bg-[#eef0f2]">
                      <SearchIcon className="size-5" />
                    </span>
                    <h3 className="mt-4 font-semibold">No matching rules</h3>
                    <p className="mt-1 text-sm text-[#6d7580]">Change or clear the filters to see all rules.</p>
                    <button type="button" className="market-outline-button mt-4" onClick={clearFilters}>Clear filters</button>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section id="processes" className="mt-8 scroll-mt-20" aria-labelledby="processes-title">
            <h2 id="processes-title" className="market-section-title">NL market process coverage</h2>
            <p className="mt-1 text-sm text-[#6d7580]">Process map</p>
            <div className="market-table-shell mt-3 overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead>
                  <tr>
                    <th>Process</th>
                    <th>Decision question</th>
                    <th>Rules</th>
                    <th>High impact</th>
                    <th>Next key date</th>
                  </tr>
                </thead>
                <tbody>
                  {processSummaries.map((summary) => (
                    <tr key={summary.name}>
                      <td className="font-medium text-[#20252b]">{processLabels[summary.name]}</td>
                      <td>{processQuestions[summary.name]}</td>
                      <td>{summary.count}</td>
                      <td>{summary.highCount}</td>
                      <td className="whitespace-nowrap">{summary.nextDate ? formatDate(summary.nextDate) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
