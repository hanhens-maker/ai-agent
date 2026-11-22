import { MarketRulesDashboard } from "@/components/market-rules-dashboard";
import {
  marketRules,
  marketRulesAreMockData,
} from "@/lib/data/market-rules";

export default function MarketRulesPage() {
  return (
    <MarketRulesDashboard
      rules={marketRules}
      isMockData={marketRulesAreMockData}
    />
  );
}
