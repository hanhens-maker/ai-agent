import { MarketRulesDashboard } from "@/components/market-rules-dashboard";
import snapshot from "@/supabase/seed/radar-snapshot.json";
import {
  marketRules,
  marketRulesAreMockData,
} from "@/lib/data/market-rules";

export default function MarketRulesPage() {
  return (
    <>
    <section className="mx-auto max-w-5xl space-y-5 p-6" aria-labelledby="sources-heading">
      <h1 id="sources-heading" className="text-3xl font-semibold">Dutch electricity regulations</h1>
      <p>{snapshot.sources.length} official sources · Collection date {snapshot.asOf}</p>
      <h2 className="text-xl font-semibold">Energiewet supplier passages for review</h2>
      <p>Opening excerpts for relevance review. Read each full article for conditions and exceptions.</p>
      {snapshot.passages.map(p => <details key={p.article} className="border-b pb-2">
        <summary className="cursor-pointer">Artikel {p.article} · {p.title}</summary>
        <blockquote lang="nl" className="my-3">{p.quote}</blockquote>
        <a className="underline" href={p.url}>Official XML version</a> · Source checked {p.checked.slice(0, 10)}
      </details>)}
      <details><summary className="cursor-pointer font-semibold">View all {snapshot.sources.length} official documents</summary>
        <ul className="space-y-2 py-3">{snapshot.sources.map(s => <li key={s.source_url}>
          <a className="underline" href={s.source_url}>{s.title}</a> · Checked {s.checked_at.slice(0, 10)}
        </li>)}</ul>
      </details>
    </section>
    <MarketRulesDashboard
      rules={marketRules}
      isMockData={marketRulesAreMockData}
    />
    </>
  );
}
