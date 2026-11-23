"use client";

import { useState } from "react";
import type snapshot from "@/supabase/seed/radar-snapshot.json";
import { BellIcon, BoltIcon, ChecklistIcon, CloseIcon, HomeIcon, LayersIcon, MenuIcon, ShieldIcon } from "@/components/icons";

const labels: Record<string, string> = { regulation: "Regulations", acm_code: "Market codes", guidance: "Guidance", policy: "Policy" };

export function MarketRulesDashboard({ report }: { report: typeof snapshot }) {
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("");
  const sources = report.sources.filter(s => (!kind || s.document_kind === kind) && s.title.toLowerCase().includes(search.trim().toLowerCase()));
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
              <ChecklistIcon className="size-5" /> Supplier checklist
            </a>
            <a href="#regional-grid" className="market-nav-link" onClick={() => setMobileNavigationOpen(false)}>
              <LayersIcon className="size-5" /> Source coverage
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
            <ChecklistIcon className="size-5" /> Supplier checklist
          </a>
          <a href="#regional-grid" className="market-nav-link">
            <LayersIcon className="size-5" /> Source coverage
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
            <p className="mt-2 text-sm">Sources checked {report.asOf}</p>
          </header>
          <section className="market-panel mt-5 overflow-hidden sm:mt-7">
            <div className="flex items-center gap-3 p-4">
              <BellIcon className="size-5" /><h2 className="text-xl font-semibold">Needs attention</h2>
              <span>{report.passages.length} supplier passages for review</span>
            </div>
            <div className="m-2 overflow-hidden rounded-xl border border-[#9BF3CF] bg-[#FFFDF7]">
              {report.passages.map(p => <details key={p.article} className="border-b border-[#CDFDE9] p-3 last:border-0">
                <summary className="cursor-pointer font-semibold">Energiewet · Artikel {p.article} · {p.title}</summary>
                <blockquote lang="nl" className="my-3">{p.quote}</blockquote>
                <a className="underline" href={p.url}>Full article and exceptions (official XML)</a> · Checked {p.checked.slice(0, 10)}
              </details>)}
            </div>
          </section>
          <section id="prerequisites" className="mt-8 scroll-mt-20">
            <div className="market-section-banner"><h2 className="market-section-title">Supplier checklist</h2></div>
            <p className="market-table-shell mt-3 p-4">No verified checklist items yet. The supplier passages above await relevance review.</p>
          </section>
          <section id="rules" className="mt-8 scroll-mt-20">
            <div className="market-section-banner"><h2 className="market-section-title">Market rules radar</h2>
              <p aria-live="polite">{sources.length} of {report.sources.length} official documents</p></div>
            <div className="mt-3 flex flex-wrap gap-2 rounded-t-2xl bg-[#CDFDE9] p-3">
              <input type="search" aria-label="Search document titles" placeholder="Search document titles" className="min-w-0 flex-1 rounded-full bg-[#FFFDF7] px-4 py-2" value={search} onChange={e => setSearch(e.target.value)} />
              <select aria-label="Document type" className="rounded-full bg-[#FFFDF7] px-3" value={kind} onChange={e => setKind(e.target.value)}>
                <option value="">All document types</option>
                {Object.entries(labels).map(([key,label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </div>
            <div className="market-table-shell">
              {sources.map(s => <details key={s.source_url} className="border-b border-[#CDFDE9] p-4 last:border-0">
                <summary className="cursor-pointer font-semibold">{s.title} <span className="text-sm font-normal">· {labels[s.document_kind]}</span></summary>
                <p className="my-2 text-sm">Checked {s.checked_at.slice(0, 10)}{s.valid_from && " · Effective from " + s.valid_from}</p>
                <a className="underline" href={s.source_url}>Open official source</a>
              </details>)}
              {!sources.length && <p className="p-4">No documents match these filters.</p>}
            </div>
          </section>
          <section id="regional-grid" className="mt-8 scroll-mt-20">
            <div className="market-section-banner"><h2 className="market-section-title">Source coverage</h2></div>
            <div className="market-table-shell mt-3"><table className="w-full text-left"><thead><tr><th>Document type</th><th>Collected</th></tr></thead><tbody>
              {Object.entries(labels).map(([key,label]) => <tr key={key}><td>{label}</td><td>{report.sources.filter(s => s.document_kind === key).length}</td></tr>)}
            </tbody></table></div>
          </section>
        </div>
      </main>
    </div>
  );
}
