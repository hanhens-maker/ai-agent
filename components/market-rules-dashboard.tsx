"use client";

import { useMemo, useState } from "react";
import type { MarketRule as PrototypeRule, MarketRuleProcess } from "@/lib/data/market-rules";
import type snapshot from "@/supabase/seed/radar-snapshot.json";

type MarketRuleKind = string;
type MarketRuleStatus = "Collected" | "For review";
type MarketRuleImpact = "Unassessed";
type MarketRule = Omit<PrototypeRule, "kind" | "status" | "impact" | "process"> & {
  kind: MarketRuleKind; status: MarketRuleStatus; impact: MarketRuleImpact;
  process: MarketRuleProcess | "unmapped";
};
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

const complianceProcesses = marketRuleProcesses.filter(value => value !== "sales");

const processLabels: Record<MarketRule["process"], string> = {
  unmapped: "Unmapped",
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



function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date.slice(0, 10)}T00:00:00Z`));
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
    <label className="relative min-w-0 flex-1 sm:min-w-40 sm:flex-none">
      <span className="sr-only">{label}</span>
      <select
        className="h-10 w-full appearance-none rounded-full border border-[#9BF3CF] bg-[#FFFDF7] pl-3 pr-8 text-xs font-medium text-[#062417] outline-none transition hover:border-[#2AA370] focus:border-[#0C472F] focus:ring-2 focus:ring-[#6EEEBA]/60 sm:h-11 sm:pl-4 sm:pr-10 sm:text-sm"
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
      <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#0C472F] sm:right-3.5" />
    </label>
  );
}

function StatusPill({ status }: { status: MarketRuleStatus }) {
  const isInForce = status === "Collected";

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#CDFDE9] px-2.5 py-1 text-xs font-medium text-[#062417]">
      {isInForce ? <CheckIcon className="size-3.5" /> : <ClockIcon className="size-3.5" />}
      {status}
    </span>
  );
}

function ImpactPill({ impact }: { impact: MarketRuleImpact }) {
  return (
    <span
      className="inline-flex rounded-full border border-[#9BF3CF] bg-[#FFFDF7] px-2.5 py-1 text-xs font-medium text-[#0C472F]"
    >
      {impact}
    </span>
  );
}

function RuleDetails({ rule }: { rule: MarketRule }) {
  return (
    <div
      id={`rule-details-${rule.id}`}
      role="region"
      aria-label={`Details: ${rule.title}`}
      className="grid gap-6 border-t border-[#CDFDE9] bg-[#FBF7EB] px-4 py-5 md:grid-cols-[1.15fr_0.85fr] md:px-6">
      <div>
        <p className="market-kicker">What the rule says</p>
        <p className="mt-2 text-sm leading-6 text-[#0C472F]">{rule.rule_text || "Open the official document to read its text."}</p>

        <p className="market-kicker mt-5">Source description</p>
        <p className="mt-2 text-sm leading-6 text-[#0C472F]">{rule.impact_text}</p>

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#1F7A54]">
          <span>Checked {formatDate(rule.checked_at)}</span>
          {rule.check ? (
            <span className="rounded-full border border-[#9BF3CF] bg-[#FFFDF7] px-2 py-1 font-medium text-[#0C472F]">
              Secondary source — re-check
            </span>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border border-[#9BF3CF] bg-[#FFFDF7] p-4">
        <p className="market-kicker flex items-center gap-2">
          <SparkIcon className="size-4" />
          Review checklist
        </p>
        <p className="mt-3 text-sm">No verified action items yet.</p>
        <ol className="mt-3 space-y-3">
          {rule.steps.map((step, index) => (
            <li key={`${index}-${step}`} className="flex gap-3 text-sm leading-5 text-[#0C472F]">
              <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#0C472F] text-[11px] font-semibold text-white">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>

        <div className="mt-5 border-t border-[#CDFDE9] pt-4">
          <p className="market-kicker">Evidence / sources</p>
          <div className="mt-2 flex flex-col items-start gap-2">
            {rule.sources.map((source, sourceIndex) => (
              <a
                key={`${sourceIndex}-${source.url}`}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0C472F] underline decoration-[#6EEEBA] underline-offset-4 hover:decoration-[#0C472F]"
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

const kindLabels: Record<string, string> = { regulation: "Regulation", acm_code: "Market code", guidance: "Guidance", policy: "Policy", excerpt: "Article excerpt" };

function radarRows(report: typeof snapshot): MarketRule[] {
  const processByArticle: Record<string, MarketRuleProcess> = { "2.5": "customer", "2.17": "licence", "2.32": "reporting" };
  const shared = { impact: "Unassessed" as const, steps: [], check: false };
  return [
    ...report.passages.map(p => ({
      ...shared, id: "article-" + p.article, title: "Energiewet · Artikel " + p.article,
      kind: "excerpt", status: "For review" as const, process: processByArticle[p.article] ?? "unmapped",
      rule_text: p.quote, impact_text: p.title, key_date: null, checked_at: p.checked.slice(0, 10),
      sources: [{ label: "Read article " + p.article + " on wetten.overheid.nl", url: p.url }]
    })),
    ...report.sources.map(s => ({
      ...shared, id: s.source_url, title: s.title, kind: s.document_kind, status: "Collected" as const,
      process: "unmapped" as const, rule_text: "", impact_text: kindLabels[s.document_kind],
      key_date: s.valid_from, checked_at: s.checked_at.slice(0, 10),
      sources: [{ label: "Official document", url: s.source_url }]
    })),
  ];
}

export function MarketRulesDashboard({ report }: { report: typeof snapshot }) {
  const rules = useMemo(() => radarRows(report), [report]);
  const [search, setSearch] = useState("");
  const [process, setProcess] = useState<FilterValue<MarketRule["process"]>>("all");
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
        (kind === "all" || kind === rule.kind) &&
        (status === "all" || rule.status === status)
      );
    });
  }, [kind, process, rules, search, status]);

  const attentionRules = rules.filter(rule => rule.status === "For review");
  const prerequisiteRules = (["licence", "balancing", "data", "billing"] as const)
    .flatMap(process => attentionRules.filter(rule => rule.process === process).slice(0, 1));

  const attentionCount = attentionRules.length;

  const processSummaries = useMemo(
    () =>
      complianceProcesses.map((processName) => {
        const processRules = rules.filter((rule) => rule.process === processName);
        const nextDate = processRules
          .map((rule) => rule.key_date)
          .filter((date): date is string => Boolean(date))
          .sort()[0];

        return {
          name: processName,
          count: processRules.length,
          highCount: processRules.filter((rule) => rule.status === "For review").length,
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
    <div className="min-h-screen bg-[#FFFDF7] text-[#062417]">
      <header className="sticky top-0 z-40 border-b border-[#CDFDE9] bg-[#FFFDF7]/95 backdrop-blur lg:hidden">
        <div className="flex h-14 items-center justify-between px-3 sm:h-16 sm:px-6">
          <a href="#top" className="flex items-center gap-2.5 text-sm font-semibold tracking-[-0.02em] sm:gap-3 sm:text-base">
            <span className="grid size-8 place-items-center rounded-lg bg-[#CDFDE9] text-[#0C472F] sm:size-9 sm:rounded-xl">
              <BoltIcon className="size-4 sm:size-5" />
            </span>
            Netherlands GTM Dashboard
          </a>
          <button
            type="button"
            aria-label={mobileNavigationOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileNavigationOpen}
            className="grid size-9 place-items-center rounded-lg border border-[#9BF3CF] bg-[#FFFDF7] sm:size-10 sm:rounded-xl"
            onClick={() => setMobileNavigationOpen((current) => !current)}
          >
            {mobileNavigationOpen ? <CloseIcon className="size-5" /> : <MenuIcon className="size-5" />}
          </button>
        </div>
        {mobileNavigationOpen ? (
          <nav className="grid gap-1 border-t border-[#CDFDE9] bg-[#FFFDF7] p-3 text-sm">
            <a href="#top" className="market-nav-link market-nav-link-active" onClick={() => setMobileNavigationOpen(false)}>
              <HomeIcon className="size-5" /> Overview
            </a>
            <a href="#rules" className="market-nav-link" onClick={() => setMobileNavigationOpen(false)}>
              <ShieldIcon className="size-5" /> Compliance
            </a>
            <a href="#prerequisites" className="market-nav-link" onClick={() => setMobileNavigationOpen(false)}>
              <ChecklistIcon className="size-5" /> Prerequisites
            </a>
            <a href="#regional-grid" className="market-nav-link" onClick={() => setMobileNavigationOpen(false)}>
              <LayersIcon className="size-5" /> Regional grid
            </a>
          </nav>
        ) : null}
      </header>

      <aside className="palette-wash-sidebar fixed inset-y-0 left-0 z-30 hidden w-[250px] flex-col border-r border-[#CDFDE9] px-3 py-7 lg:flex">
        <a href="#top" className="flex items-center gap-3 px-2">
          <span className="grid size-11 place-items-center rounded-xl bg-[#CDFDE9] text-[#0C472F]">
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
          <a href="#regional-grid" className="market-nav-link">
            <LayersIcon className="size-5" /> Regional grid
          </a>
        </nav>

        <div className="mt-auto rounded-xl border border-[#9BF3CF] bg-[#FFFDF7] p-4">
          <p className="text-sm font-semibold">Market scope</p>
          <p className="mt-1.5 text-xs leading-5 text-[#0C472F]/70">
            B2B · SME + mid-market
            <br />
            Electricity · Netherlands
          </p>
        </div>
      </aside>

      <main id="top" className="lg:pl-[250px]">
        <div className="mx-auto max-w-[1480px] px-3 pb-12 pt-5 sm:px-7 sm:pb-16 sm:pt-7 lg:px-8 lg:pt-5 xl:px-9">
          <header>
            <h1 className="max-w-5xl text-[32px] font-semibold leading-[1.04] tracking-[-0.05em] sm:text-[50px] sm:leading-[1.02] sm:tracking-[-0.055em]">
              Netherlands market &amp; compliance overview
            </h1>
            <p className="mt-1 text-[15px] leading-6 text-[#0C472F]/75 sm:text-lg">
              Energy market entry, supplier setup and regulatory compliance in the Netherlands
            </p>
            <p className="mt-2.5 inline-flex rounded-full border border-[#9BF3CF] bg-[#FFFDF7] px-3 py-1 text-xs font-medium text-[#0C472F]/75">Sources checked {report.asOf}</p>
          </header>

          <section className="market-panel mt-5 overflow-hidden sm:mt-7" aria-labelledby="attention-title">
            <div className="flex flex-wrap items-center gap-2.5 px-3 py-3 sm:gap-3 sm:px-5 sm:py-4">
              <span className="grid size-8 place-items-center rounded-lg bg-[#FFFDF7] text-[#0C472F] shadow-sm ring-1 ring-[#9BF3CF] sm:size-9 sm:rounded-xl">
                <BellIcon className="size-4 sm:size-5" />
              </span>
              <h2 id="attention-title" className="text-lg font-semibold tracking-[-0.025em] sm:text-xl">
                Needs attention
              </h2>
              <span className="text-xs text-[#0C472F]/75 sm:text-sm">
                {attentionCount} {attentionCount === 1 ? "item" : "items"} to review
              </span>
            </div>

            <div className="mx-1.5 mb-1.5 overflow-hidden rounded-[15px] border border-[#9BF3CF] bg-[#FFFDF7]/90 sm:mx-2 sm:mb-2 sm:rounded-xl">
              {attentionRules.map((rule) => (
                <div
                  key={rule.id}
                  className="grid grid-cols-[minmax(0,1fr)_36px] items-center gap-2 border-b border-[#CDFDE9] px-2.5 py-2.5 transition last:border-b-0 sm:grid-cols-[1fr_auto] sm:gap-3 sm:px-3 sm:py-3"
                >
                  <span className="min-w-0">
                    <span className="block text-[15px] font-semibold leading-5 sm:text-base">{rule.title}</span>
                    <span className="mt-0.5 line-clamp-2 block text-[13px] leading-5 text-[#0C472F]/70 sm:text-sm">
                      {processLabels[rule.process]} · {rule.impact_text}
                    </span>
                    <span className="mt-1.5 flex flex-wrap gap-1.5">
                      <StatusPill status={rule.status} />
                      <ImpactPill impact={rule.impact} />
                    </span>
                  </span>
                  <button
                    type="button"
                    aria-label={`Check details for ${rule.title}`}
                    className="inline-flex size-9 items-center justify-center rounded-lg border border-[#0C472F] bg-[#FFFDF7] text-[#0C472F] transition hover:bg-[#E4FCF2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#29ED9B] focus-visible:ring-offset-2 sm:h-10 sm:w-auto sm:gap-2 sm:rounded-full sm:px-4"
                    onClick={() => showRule(rule)}
                  >
                    <ArrowUpRightIcon className="size-4" />
                    <span className="sr-only sm:not-sr-only">Check details</span>
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section id="prerequisites" className="mt-5 scroll-mt-20 sm:mt-8" aria-labelledby="prerequisites-title">
            <div className="market-section-banner">
              <h2 id="prerequisites-title" className="market-section-title">Supplier prerequisites</h2>
            </div>
            <div className="market-table-shell mt-3 overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-left text-sm">
                <thead>
                  <tr>
                    <th scope="col">Passage for review</th>
                    <th scope="col">Process</th>
                    <th scope="col">Status</th>
                    <th scope="col">Evidence / link</th>
                    <th scope="col">Key date</th>
                  </tr>
                </thead>
                <tbody>
                  {prerequisiteRules.map((rule) => (
                    <tr key={rule.id}>
                      <td className="font-medium text-[#062417]">{rule.title}</td>
                      <td>{processLabels[rule.process]}</td>
                      <td><StatusPill status={rule.status} /></td>
                      <td>
                        {rule.sources[0]?.url.startsWith("https://") ? (
                          <a
                            href={rule.sources[0].url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 font-medium text-[#0C472F] underline decoration-[#6EEEBA] underline-offset-4 hover:decoration-[#0C472F]"
                          >
                            {rule.sources[0].label}
                            <ArrowUpRightIcon className="size-3.5" />
                          </a>
                        ) : (
                          "No source"
                        )}
                      </td>
                      <td className="whitespace-nowrap">{rule.key_date ? formatDate(rule.key_date) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="rules" className="mt-5 scroll-mt-20 sm:mt-8" aria-labelledby="rules-title">
            <div className="market-section-banner flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="rules-title" className="market-section-title">Market rules radar</h2>
                <p aria-live="polite" className="mt-1 text-sm text-[#0C472F]/70">
                  Showing {filteredRules.length} of {rules.length} documents and passages
                </p>
              </div>
              {(search || process !== "all" || kind !== "all" || status !== "all") ? (
                <button type="button" className="text-sm font-medium underline underline-offset-4" onClick={clearFilters}>
                  Clear filters
                </button>
              ) : null}
            </div>

            <div className="mt-2 flex flex-col gap-2 rounded-t-2xl border border-b-0 border-[#9BF3CF] bg-[#CDFDE9] p-2.5 sm:mt-3 sm:rounded-t-[22px] sm:p-3 xl:flex-row">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Search rules</span>
                <SearchIcon className="absolute left-3.5 top-2.5 size-5 text-[#2AA370] sm:left-4 sm:top-3" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search rules, requirements or steps"
                  className="h-10 w-full rounded-full border border-[#9BF3CF] bg-[#FFFDF7] pl-10 pr-3 text-[13px] text-[#062417] outline-none placeholder:text-[#2AA370]/70 focus:border-[#0C472F] focus:ring-2 focus:ring-[#6EEEBA]/60 sm:h-11 sm:pl-11 sm:pr-4 sm:text-sm"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <SelectFilter
                  label="Processes"
                  value={process}
                  onChange={setProcess}
                  options={complianceProcesses.map((value) => ({ value, label: processLabels[value] }))}
                />
                <SelectFilter
                  label="Types"
                  value={kind}
                  onChange={setKind}
                  options={Object.entries(kindLabels).map(([value, label]) => ({ value, label }))}
                />
                <SelectFilter
                  label="Statuses"
                  value={status}
                  onChange={setStatus}
                  options={[
                    { value: "Collected", label: "Collected" },
                    { value: "For review", label: "For review" },
                  ]}
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-b-2xl border border-[#9BF3CF] bg-[#FFFDF7] shadow-[0_12px_32px_rgba(12,71,47,0.08)] sm:rounded-b-[22px]">
              {filteredRules.length ? (
                filteredRules.map((rule) => {
                  const expanded = expandedRule === rule.id;
                  return (
                    <article key={rule.id} data-rule-id={rule.id} className="border-b border-[#CDFDE9] last:border-b-0">
                      <button
                        type="button"
                        aria-expanded={expanded}
                        aria-controls={`rule-details-${rule.id}`}
                        className="grid w-full grid-cols-[minmax(0,1fr)_32px] items-center gap-2.5 px-3 py-3 text-left transition hover:bg-[#E4FCF2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0C472F] md:grid-cols-[minmax(250px,1.35fr)_minmax(170px,0.8fr)_auto_auto_32px] md:gap-3 md:px-5 md:py-4"
                        onClick={() => setExpandedRule(expanded ? null : rule.id)}
                      >
                        <span className="min-w-0">
                          <span className="line-clamp-2 block text-[15px] font-semibold leading-5 sm:text-base">{rule.title}</span>
                          <span className="line-clamp-2 block text-[13px] leading-5 text-[#0C472F]/70 sm:mt-1 sm:text-sm">{rule.impact_text}</span>
                          <span className="mt-1.5 flex flex-wrap gap-1.5 md:hidden">
                            <StatusPill status={rule.status} />
                            <ImpactPill impact={rule.impact} />
                          </span>
                        </span>
                        <span className="hidden text-sm text-[#0C472F] md:block">{processLabels[rule.process]}</span>
                        <span className="hidden md:inline-flex"><StatusPill status={rule.status} /></span>
                        <span className="hidden md:inline-flex"><ImpactPill impact={rule.impact} /></span>
                        <span className={`grid size-8 place-items-center rounded-full border border-[#9BF3CF] bg-[#FFFDF7] text-[#0C472F] transition ${expanded ? "rotate-180 bg-[#CDFDE9]" : ""}`}>
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
                    <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-[#CDFDE9] text-[#0C472F]">
                      <SearchIcon className="size-5" />
                    </span>
                    <h3 className="mt-4 font-semibold">No matching rules</h3>
                    <p className="mt-1 text-sm text-[#0C472F]/70">Change or clear the filters to see all rules.</p>
                    <button type="button" className="market-outline-button mt-4" onClick={clearFilters}>Clear filters</button>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section id="regional-grid" className="mt-5 scroll-mt-20 sm:mt-8" aria-labelledby="regional-grid-title">
            <div className="market-section-banner">
              <h2 id="regional-grid-title" className="market-section-title">Regional grid layer</h2>
              <p className="mt-1 text-sm text-[#0C472F]/70">Process coverage by market function</p>
            </div>
            <div className="market-table-shell mt-3 overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead>
                  <tr>
                    <th scope="col">Process</th>
                    <th scope="col">Decision question</th>
                    <th scope="col">Rules</th>
                    <th scope="col">For review</th>
                    <th scope="col">Next key date</th>
                  </tr>
                </thead>
                <tbody>
                  {processSummaries.map((summary) => (
                    <tr key={summary.name}>
                      <td className="font-medium text-[#062417]">{processLabels[summary.name]}</td>
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
