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
  high: "border-[#171916] bg-[#171916] text-white",
  medium: "border-[#f0b63e] bg-[#fff5d8] text-[#714a00]",
  low: "border-[#c8cbc3] bg-[#f2f2ef] text-[#5d6259]",
};

const kindStyles: Record<MarketRuleKind, string> = {
  must: "bg-[#ffe4e0] text-[#9f3025]",
  opp: "bg-[#e5f3dd] text-[#316528]",
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
        className="h-11 w-full appearance-none rounded-full border border-[#d4d4ce] bg-white pl-4 pr-10 text-sm font-medium text-[#343630] outline-none transition hover:border-[#95988e] focus:border-[#171916] focus:ring-2 focus:ring-[#d7fd58] sm:w-auto"
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
      <ChevronDownIcon className="pointer-events-none absolute right-3.5 top-3.5 size-4 text-[#60645b]" />
    </label>
  );
}

function RuleCard({ rule }: { rule: MarketRule }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="overflow-hidden rounded-[22px] border border-[#dbdcd5] bg-white shadow-[0_1px_0_rgba(23,25,22,0.04)] transition hover:border-[#bfc1b9]">
      <button
        type="button"
        aria-expanded={expanded}
        className="grid w-full grid-cols-[auto_1fr_auto] gap-x-3 gap-y-3 p-5 text-left sm:gap-x-5 sm:p-6"
        onClick={() => setExpanded((current) => !current)}
      >
        <span className="pt-0.5 font-mono text-xs font-semibold tracking-[0.08em] text-[#777b71]">
          {rule.id}
        </span>
        <span className="min-w-0">
          <span className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.09em] ${kindStyles[rule.kind]}`}
            >
              {rule.kind === "must" ? "Must comply" : "Sales opportunity"}
            </span>
            <span className="text-xs font-medium capitalize text-[#777b71]">
              {processLabels[rule.process]}
            </span>
          </span>
          <span className="block text-[20px] font-semibold leading-[1.2] tracking-[-0.025em] text-[#171916] sm:text-[22px]">
            {rule.title}
          </span>
          <span className="mt-2.5 line-clamp-2 block max-w-3xl text-sm leading-6 text-[#5f635a]">
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
            className={`grid size-8 place-items-center rounded-full border border-[#dedfd9] text-[#4c5048] transition ${expanded ? "rotate-180 bg-[#f2f2ee]" : "bg-white"}`}
          >
            <ChevronDownIcon className="size-4" />
          </span>
        </span>
      </button>

      {expanded ? (
        <div className="border-t border-[#e4e5df] bg-[#fafaf7] px-5 py-6 sm:px-[74px] sm:py-7">
          <div className="grid gap-7 lg:grid-cols-[1.25fr_0.9fr] lg:gap-12">
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.13em] text-[#777b71]">
                What the rule says
              </p>
              <p className="text-sm leading-6 text-[#363933]">{rule.rule_text}</p>

              <p className="mb-2 mt-6 text-[11px] font-bold uppercase tracking-[0.13em] text-[#777b71]">
                What this means for trawa
              </p>
              <p className="text-sm leading-6 text-[#363933]">{rule.impact_text}</p>
            </div>

            <div className="rounded-2xl border border-[#dfe0da] bg-white p-5">
              <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.13em] text-[#777b71]">
                <SparkIcon className="size-4 text-[#5c7500]" />
                Suggested process steps
              </p>
              <ol className="space-y-3">
                {rule.steps.map((step, index) => (
                  <li key={step} className="flex gap-3 text-sm leading-5 text-[#363933]">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#e8ff94] text-[10px] font-bold text-[#2e3800]">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-[#e4e5df] pt-5 text-xs text-[#6b6f66]">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span>{rule.status === "in_force" ? "In force" : "Coming"}</span>
              {rule.key_date ? <span>Key date: {formatDate(rule.key_date)}</span> : null}
              <span>Checked {formatDate(rule.checked_at)}</span>
              {rule.check ? (
                <span className="rounded-full bg-[#fff0d8] px-2 py-1 font-semibold text-[#8a5600]">
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
                  className="inline-flex items-center gap-1.5 font-semibold text-[#31352e] underline decoration-[#b7b9b1] underline-offset-4 hover:decoration-[#31352e]"
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
    <div className="min-h-screen bg-[#f4f3ef] text-[#171916]">
      <header className="sticky top-0 z-30 border-b border-[#deded8] bg-[#f4f3ef]/95 backdrop-blur lg:hidden">
        <div className="flex h-16 items-center justify-between px-5">
          <a href="#top" className="flex items-center gap-2.5 font-semibold tracking-[-0.02em]">
            <span className="grid size-8 place-items-center rounded-full bg-[#171916] text-[#d7fd58]">
              <RadarIcon className="size-[18px]" />
            </span>
            NL market entry
          </a>
          <button
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={mobileNavigationOpen}
            className="grid size-10 place-items-center rounded-full border border-[#d5d5ce] bg-white"
            onClick={() => setMobileNavigationOpen((current) => !current)}
          >
            <MenuIcon className="size-5" />
          </button>
        </div>
        {mobileNavigationOpen ? (
          <nav className="border-t border-[#deded8] bg-white px-5 py-4 text-sm">
            <a href="#rules" className="flex items-center gap-3 rounded-xl bg-[#eefbba] px-4 py-3 font-semibold">
              <RadarIcon className="size-5" />
              Market rules radar
            </a>
          </nav>
        ) : null}
      </header>

      <aside className="fixed inset-y-0 left-0 hidden w-[264px] flex-col border-r border-[#deded8] bg-[#ecebe5] px-5 py-6 lg:flex">
        <a href="#top" className="flex items-center gap-3 px-2">
          <span className="grid size-9 place-items-center rounded-full bg-[#171916] text-[#d7fd58]">
            <RadarIcon className="size-5" />
          </span>
          <span>
            <span className="block text-sm font-bold tracking-[-0.015em]">Netherlands GTM</span>
            <span className="block text-xs text-[#777b71]">trawa market entry</span>
          </span>
        </a>

        <div className="mt-12 px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#898c83]">
          Environmental radar
        </div>
        <nav className="mt-3">
          <a href="#rules" className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold shadow-[0_1px_0_rgba(23,25,22,0.05)]">
            <RadarIcon className="size-5" />
            Market rules
            <span className="ml-auto rounded-full bg-[#d7fd58] px-2 py-0.5 text-[10px] font-bold">
              {rules.length}
            </span>
          </a>
        </nav>

        <div className="mt-auto rounded-2xl border border-[#d7d7d0] bg-[#f5f4ef] p-4">
          <p className="text-xs font-semibold">Scope</p>
          <p className="mt-1.5 text-xs leading-5 text-[#73776e]">
            B2B only · SME + mid-market
            <br />
            Power + gas · Netherlands
          </p>
        </div>
      </aside>

      <main id="top" className="lg:pl-[264px]">
        <div className="mx-auto max-w-[1440px] px-5 pb-20 pt-10 sm:px-8 sm:pt-14 lg:px-12 xl:px-16">
          <section className="grid items-end gap-8 border-b border-[#cecec7] pb-10 lg:grid-cols-[1fr_auto] lg:gap-12">
            <div>
              <div className="mb-5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#6d7168]">
                <span className="size-2 rounded-full bg-[#9cb900]" />
                Environmental radar · Module 1
              </div>
              <h1 className="max-w-4xl text-[42px] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-[58px] lg:text-[68px]">
                NL Market Rules Radar
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#666a61] sm:text-lg">
                Dutch energy-market rules, mapped to the process each one forces trawa to build. Red means trawa must comply. Green means a client rule trawa can sell into.
              </p>
              <p className="mt-4 text-xs font-medium text-[#85887f]">
                {isMockData
                  ? "Temporary mock data · awaiting backend integration"
                  : "Curated by hand · source dates shown per rule"}
              </p>
            </div>

            <dl className="grid grid-cols-3 overflow-hidden rounded-2xl border border-[#d5d5cf] bg-white lg:w-[380px]">
              <div className="border-r border-[#e1e1dc] p-4 sm:p-5">
                <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#85887f]">Rules</dt>
                <dd className="mt-1 text-2xl font-semibold tracking-[-0.04em]">{rules.length}</dd>
              </div>
              <div className="border-r border-[#e1e1dc] p-4 sm:p-5">
                <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#85887f]">High</dt>
                <dd className="mt-1 text-2xl font-semibold tracking-[-0.04em]">{highImpactCount}</dd>
              </div>
              <div className="p-4 sm:p-5">
                <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#85887f]">Coming</dt>
                <dd className="mt-1 text-2xl font-semibold tracking-[-0.04em]">{comingCount}</dd>
              </div>
            </dl>
          </section>

          <section className="grid gap-8 border-b border-[#cecec7] py-8 xl:grid-cols-[0.8fr_1.6fr]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6d7168]">
                Assumptions to confirm
              </p>
              <ul className="mt-4 space-y-2.5 text-sm leading-6 text-[#555950]">
                <li className="flex gap-3"><span className="text-[#9cb900]">•</span>B2B only: SMEs and mid-market. No households.</li>
                <li className="flex gap-3"><span className="text-[#9cb900]">•</span>Electricity and gas both in scope.</li>
                <li className="flex gap-3"><span className="text-[#9cb900]">•</span>Regulation first. Grid congestion and pricing come later.</li>
                <li className="flex gap-3">
                  <span className="text-[#9cb900]">•</span>
                  {isMockData
                    ? "Mock records are for UI testing only. Backend content is pending."
                    : "Not legal advice. “Check” means a secondary source is used."}
                </li>
              </ul>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6d7168]">
                Processes trawa needs in NL
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {processSummaries.map((summary) => (
                  <button
                    key={summary.name}
                    type="button"
                    className="rounded-2xl border border-[#d8d9d2] bg-white p-4 text-left transition hover:border-[#aeb1a7] hover:bg-[#fcfcf8]"
                    onClick={() => {
                      setProcess(summary.name);
                      document.querySelector("#rules")?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    <span className="block text-sm font-semibold tracking-[-0.01em]">
                      {processLabels[summary.name]}
                    </span>
                    <span className="mt-1 block text-xs text-[#7b7f76]">
                      {processQuestions[summary.name]}
                    </span>
                    <span className="mt-3 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.05em] text-[#7b7f76]">
                      <span>{summary.count} {summary.count === 1 ? "rule" : "rules"}</span>
                      <span>{summary.highCount} high</span>
                      <span>next: {summary.nextDate ? formatDate(summary.nextDate) : "—"}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section id="rules" className="pt-8">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold tracking-[-0.025em]">Rules radar</h2>
                <p aria-live="polite" className="mt-1 text-sm text-[#777b71]">
                  Showing {filteredRules.length} of {rules.length} rules
                </p>
              </div>
              <SlidersIcon className="size-5 text-[#777b71] sm:hidden" />
            </div>

            <div className="mb-6 flex flex-col gap-3 xl:flex-row">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Search rules</span>
                <SearchIcon className="absolute left-4 top-3 size-5 text-[#777b71]" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search rules, requirements or steps"
                  className="h-11 w-full rounded-full border border-[#d4d4ce] bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-[#969990] hover:border-[#95988e] focus:border-[#171916] focus:ring-2 focus:ring-[#d7fd58]"
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
              <div className="grid min-h-[300px] place-items-center rounded-[22px] border border-dashed border-[#c9cac3] bg-[#eeede8] px-6 text-center">
                <div>
                  <span className="mx-auto grid size-12 place-items-center rounded-full border border-[#d4d5ce] bg-white text-[#62665d]">
                    <SearchIcon className="size-5" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">No matching rules</h3>
                  <p className="mt-1 text-sm text-[#777b71]">
                    Change or clear the filters to see the full radar.
                  </p>
                  <button
                    type="button"
                    className="mt-5 rounded-full bg-[#171916] px-4 py-2 text-xs font-semibold text-white"
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
