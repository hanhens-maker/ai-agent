import { MarketRulesDashboard } from "@/components/market-rules-dashboard";
import snapshot from "@/supabase/seed/radar-snapshot.json";

export default function MarketRulesPage() {
  return <MarketRulesDashboard report={snapshot} />;
}
