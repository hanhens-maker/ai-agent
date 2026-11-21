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
  ChevronDownIcon,
  MenuIcon,
  RadarIcon,
  SearchIcon,
  SlidersIcon,
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

const impactStyles: Record<MarketRuleImpact, string> = {
  high: "border-[#062417] bg-[#062417] text-white",
  medium: "border-[#29ED9B] bg-[#CDFDE9] text-[#0C472F]",
  low: "border-[#9BF3CF] bg-[#E4FCF2] text-[#0C472F]",
};

const kindStyles: Record<MarketRuleKind, string> = {
  must: "bg-[#0C472F] text-white",
  opp: "bg-[#29ED9B] text-[#062417]",
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
    <label className="relative min-w-[148px] flex-1 sm:flex-none">
      <span className="sr-only">{label}</span>
      <select
        className="h-11 w-full appearance-none rounded-full border border-[#9BF3CF] bg-white pl-4 pr-10 text-sm font-medium text-[#062417] outline-none transition hover:border-[#2AA370] focus:border-[#0C472F] focus:ring-2 focus:ring-[#6EEEBA] sm:w-auto"
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
      <ChevronDownIcon className="pointer-events-none absolute right-3.5 top-3.5 size-4 text-[#0C472F]" />
    </label>
  );
}

function RuleCard({ rule }: { rule: MarketRule }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="overflow-hidden rounded-[22px] border border-white/80 bg-white shadow-[0_10px_30px_rgba(12,71,47,0.08)] transition hover:-translate-y-0.5 hover:border-[#6EEEBA] hover:shadow-[0_14px_36px_rgba(12,71,47,0.13)]">
      <button
        type="button"
        aria-expanded={expanded}
        className="grid w-full grid-cols-[auto_1fr_auto] gap-x-3 gap-y-3 p-5 text-left sm:gap-x-5 sm:p-6"
        onClick={() => setExpanded((current) => !current)}
      >
        <span className="pt-0.5 font-mono text-xs font-semibold tracking-[0.08em] text-[#2AA370]">
          {rule.id}
        </span>
        <span className="min-w-0">
          <span className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.09em] ${kindStyles[rule.kind]}`}
            >
              {rule.kind === "must" ? "Must comply" : "Sales opportunity"}
            </span>
            <span className="text-xs font-medium capitalize text-[#2AA370]">
              {processLabels[rule.process]}
            </span>
          </span>
          <span className="block text-[20px] font-semibold leading-[1.2] tracking-[-0.025em] text-[#062417] sm:text-[22px]">
            {rule.title}
          </span>
          <span className="mt-2.5 line-clamp-2 block max-w-3xl text-sm leading-6 text-[#0C472F]/75">
            {rule.impact_text}
          </span>
        </span>
        <span className="flex flex-col items-end gap-3">
          <span
            className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.09em] ${impactStyles[rule.impact]}`}
          >
            {rule.impact}
          </span>
          <span
            className={`grid size-8 place-items-center rounded-full border border-[#9BF3CF] text-[#0C472F] transition ${expanded ? "rotate-180 bg-[#CDFDE9]" : "bg-white"}`}
          >
            <ChevronDownIcon className="size-4" />
          </span>
        </span>
      </button>

      {expanded ? (
        <div className="border-t border-[#CDFDE9] bg-[#E4FCF2] px-5 py-6 sm:px-[74px] sm:py-7">
          <div className="grid gap-7 lg:grid-cols-[1.25fr_0.9fr] lg:gap-12">
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.13em] text-[#2AA370]">
                What the rule says
              </p>
              <p className="text-sm leading-6 text-[#0C472F]">{rule.rule_text}</p>

              <p className="mb-2 mt-6 text-[11px] font-bold uppercase tracking-[0.13em] text-[#2AA370]">
                What this means for trawa
              </p>
              <p className="text-sm leading-6 text-[#0C472F]">{rule.impact_text}</p>
            </div>

            <div className="rounded-2xl border border-[#9BF3CF] bg-white p-5">
              <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.13em] text-[#2AA370]">
                <SparkIcon className="size-4 text-[#29ED9B]" />
                Suggested process steps
              </p>
              <ol className="space-y-3">
                {rule.steps.map((step, index) => (
                  <li key={step} className="flex gap-3 text-sm leading-5 text-[#0C472F]">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#29ED9B] text-[10px] font-bold text-[#062417]">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-[#9BF3CF] pt-5 text-xs text-[#0C472F]/70">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span>{rule.status === "in_force" ? "In force" : "Coming"}</span>
              {rule.key_date ? <span>Key date: {formatDate(rule.key_date)}</span> : null}
              <span>Checked {formatDate(rule.checked_at)}</span>
              {rule.check ? (
                <span className="rounded-full bg-white px-2 py-1 font-semibold text-[#0C472F]">
                  Secondary source — re-check
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-3">
              {rule.sources.map((source) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 font-semibold text-[#0C472F] underline decoration-[#6EEEBA] underline-offset-4 hover:decoration-[#0C472F]"
                >
                  {source.label}
                  <ArrowUpRightIcon className="size-3.5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </article>
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

  const highImpactCount = rules.filter((rule) => rule.impact === "high").length;
  const comingCount = rules.filter((rule) => rule.status === "coming").length;

  const processSummaries = marketRuleProcesses.map((processName) => {
    const processRules = rules.filter((rule) => rule.process === processName);
    const nextRule = processRules
      .filter((rule) => rule.key_date && rule.key_date >= "2026-11-21")
      .sort((first, second) =>
        (first.key_date ?? "").localeCompare(second.key_date ?? ""),
      )[0];

    return {
      name: processName,
      count: processRules.length,
      highCount: processRules.filter((rule) => rule.impact === "high").length,
      nextDate: nextRule?.key_date ?? null,
    };
  });

  function clearFilters() {
    setSearch("");
    setProcess("all");
    setKind("all");
    setStatus("all");
  }

  return (
    <div className="min-h-screen bg-white text-[#062417]">
      <header className="sticky top-0 z-30 border-b border-[#CDFDE9] bg-white/95 backdrop-blur lg:hidden">
        <div className="flex h-16 items-center justify-between px-5">
          <a href="#top" className="flex items-center gap-2.5 font-semibold tracking-[-0.02em]">
            <span className="grid size-8 place-items-center rounded-full bg-[#062417] text-[#29ED9B]">
              <RadarIcon className="size-[18px]" />
            </span>
            NL market entry
          </a>
          <button
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={mobileNavigationOpen}
            className="grid size-10 place-items-center rounded-full border border-[#9BF3CF] bg-white"
            onClick={() => setMobileNavigationOpen((current) => !current)}
          >
            <MenuIcon className="size-5" />
          </button>
        </div>
        {mobileNavigationOpen ? (
          <nav className="border-t border-[#CDFDE9] bg-white px-5 py-4 text-sm">
            <a href="#rules" className="flex items-center gap-3 rounded-xl bg-[#CDFDE9] px-4 py-3 font-semibold">
              <RadarIcon className="size-5" />
              Market rules radar
            </a>
          </nav>
        ) : null}
      </header>

      <aside className="palette-wash-sidebar fixed inset-y-0 left-0 hidden w-[264px] flex-col border-r border-[#CDFDE9] px-5 py-6 lg:flex">
        <a href="#top" className="flex items-center gap-3 px-2">
          <span className="grid size-9 place-items-center rounded-full bg-[#062417] text-[#29ED9B]">
            <RadarIcon className="size-5" />
          </span>
          <span>
            <span className="block text-sm font-bold tracking-[-0.015em]">Netherlands GTM</span>
            <span className="block text-xs text-[#0C472F]/70">trawa market entry</span>
          </span>
        </a>

        <div className="mt-12 px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#2AA370]">
          Environmental radar
        </div>
        <nav className="mt-3">
          <a href="#rules" className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold shadow-[0_10px_28px_rgba(12,71,47,0.10)]">
            <RadarIcon className="size-5" />
            Market rules
            <span className="ml-auto rounded-full bg-[#29ED9B] px-2 py-0.5 text-[10px] font-bold">
              {rules.length}
            </span>
          </a>
        </nav>

        <div className="mt-auto rounded-2xl border border-[#9BF3CF] bg-white/80 p-4 backdrop-blur">
          <p className="text-xs font-semibold">Scope</p>
          <p className="mt-1.5 text-xs leading-5 text-[#0C472F]/70">
            B2B only · SME + mid-market
            <br />
            Power + gas · Netherlands
          </p>
        </div>
      </aside>

      <main id="top" className="lg:pl-[264px]">
        <div className="mx-auto max-w-[1440px] px-5 pb-20 pt-6 sm:px-8 sm:pt-8 lg:px-12 xl:px-16">
          <section className="palette-wash green-panel-shadow grid items-end gap-8 overflow-hidden rounded-[32px] p-6 sm:p-9 lg:grid-cols-[1fr_auto] lg:gap-12 lg:p-12">
            <div>
              <div className="mb-5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#0C472F]">
                <span className="size-2 rounded-full bg-[#29ED9B] ring-4 ring-white/50" />
                Environmental radar · Module 1
              </div>
              <h1 className="max-w-4xl text-[42px] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-[58px] lg:text-[68px]">
                NL Market Rules Radar
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#0C472F]/80 sm:text-lg">
                Dutch energy-market rules, mapped to the process each one forces trawa to build. Dark green means trawa must comply. Bright green means a client rule trawa can sell into.
              </p>
              <p className="mt-4 text-xs font-medium text-[#0C472F]/65">
                {isMockData
                  ? "Temporary mock data · awaiting backend integration"
                  : "Curated by hand · source dates shown per rule"}
              </p>
            </div>

            <dl className="grid grid-cols-3 overflow-hidden rounded-2xl border border-white/70 bg-white/90 shadow-[0_14px_38px_rgba(12,71,47,0.10)] backdrop-blur lg:w-[380px]">
              <div className="border-r border-[#CDFDE9] p-4 sm:p-5">
                <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#2AA370]">Rules</dt>
                <dd className="mt-1 text-2xl font-semibold tracking-[-0.04em]">{rules.length}</dd>
              </div>
              <div className="border-r border-[#CDFDE9] p-4 sm:p-5">
                <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#2AA370]">High</dt>
                <dd className="mt-1 text-2xl font-semibold tracking-[-0.04em]">{highImpactCount}</dd>
              </div>
              <div className="p-4 sm:p-5">
                <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#2AA370]">Coming</dt>
                <dd className="mt-1 text-2xl font-semibold tracking-[-0.04em]">{comingCount}</dd>
              </div>
            </dl>
          </section>

          <section className="palette-wash-soft mt-6 grid gap-8 rounded-[28px] border border-[#CDFDE9] p-6 sm:p-8 xl:grid-cols-[0.8fr_1.6fr]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#2AA370]">
                Assumptions to confirm
              </p>
              <ul className="mt-4 space-y-2.5 text-sm leading-6 text-[#0C472F]/80">
                <li className="flex gap-3"><span className="text-[#29ED9B]">•</span>B2B only: SMEs and mid-market. No households.</li>
                <li className="flex gap-3"><span className="text-[#29ED9B]">•</span>Electricity and gas both in scope.</li>
                <li className="flex gap-3"><span className="text-[#29ED9B]">•</span>Regulation first. Grid congestion and pricing come later.</li>
                <li className="flex gap-3">
                  <span className="text-[#29ED9B]">•</span>
                  {isMockData
                    ? "Mock records are for UI testing only. Backend content is pending."
                    : "Not legal advice. “Check” means a secondary source is used."}
                </li>
              </ul>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#2AA370]">
                Processes trawa needs in NL
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {processSummaries.map((summary) => (
                  <button
                    key={summary.name}
                    type="button"
                    className="rounded-2xl border border-white/80 bg-white/90 p-4 text-left shadow-[0_8px_22px_rgba(12,71,47,0.06)] transition hover:-translate-y-0.5 hover:border-[#6EEEBA] hover:bg-white hover:shadow-[0_12px_28px_rgba(12,71,47,0.11)]"
                    onClick={() => {
                      setProcess(summary.name);
                      document.querySelector("#rules")?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    <span className="block text-sm font-semibold tracking-[-0.01em]">
                      {processLabels[summary.name]}
                    </span>
                    <span className="mt-1 block text-xs text-[#0C472F]/65">
                      {processQuestions[summary.name]}
                    </span>
                    <span className="mt-3 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.05em] text-[#2AA370]">
                      <span>{summary.count} {summary.count === 1 ? "rule" : "rules"}</span>
                      <span>{summary.highCount} high</span>
                      <span>next: {summary.nextDate ? formatDate(summary.nextDate) : "—"}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section id="rules" className="palette-wash mt-6 scroll-mt-20 rounded-[32px] p-5 sm:p-8">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold tracking-[-0.025em]">Rules radar</h2>
                <p aria-live="polite" className="mt-1 text-sm text-[#0C472F]/70">
                  Showing {filteredRules.length} of {rules.length} rules
                </p>
              </div>
              <SlidersIcon className="size-5 text-[#0C472F] sm:hidden" />
            </div>

            <div className="mb-6 flex flex-col gap-3 xl:flex-row">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Search rules</span>
                <SearchIcon className="absolute left-4 top-3 size-5 text-[#2AA370]" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search rules, requirements or steps"
                  className="h-11 w-full rounded-full border border-[#9BF3CF] bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-[#2AA370]/60 hover:border-[#2AA370] focus:border-[#0C472F] focus:ring-2 focus:ring-[#6EEEBA]"
                />
              </label>
              <div className="flex flex-wrap gap-3">
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

            {filteredRules.length ? (
              <div className="space-y-3">
                {filteredRules.map((rule) => (
                  <RuleCard key={rule.id} rule={rule} />
                ))}
              </div>
            ) : (
              <div className="grid min-h-[300px] place-items-center rounded-[22px] border border-dashed border-[#6EEEBA] bg-white/75 px-6 text-center">
                <div>
                  <span className="mx-auto grid size-12 place-items-center rounded-full border border-[#9BF3CF] bg-white text-[#0C472F]">
                    <SearchIcon className="size-5" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">No matching rules</h3>
                  <p className="mt-1 text-sm text-[#0C472F]/70">
                    Change or clear the filters to see the full radar.
                  </p>
                  <button
                    type="button"
                    className="mt-5 rounded-full bg-[#062417] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#0C472F] focus:outline-none focus:ring-2 focus:ring-[#29ED9B] focus:ring-offset-2"
                    onClick={clearFilters}
                  >
                    Clear filters
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
