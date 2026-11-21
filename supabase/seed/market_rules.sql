insert into public.market_rules (
  id,
  title,
  kind,
  process,
  status,
  key_date,
  impact,
  rule_text,
  impact_text,
  steps,
  sources,
  "check",
  checked_at
)
values
  (
    'R01',
    'ACM supply licence for small connections',
    'must',
    'licence',
    'in_force',
    '2026-01-01',
    'high',
    'Supplying clients on small connections needs an ACM licence. Small = electricity up to 3x80A, gas up to 40 m³(n)/h. Large connections need no licence. Reselling under a licensed supplier is the alternative.',
    'Decides the entry route. Large-connection mid-market can start without a licence. Small SMEs cannot.',
    array[
      'Split target list by connection size',
      'Pick route: own licence or reseller',
      'Prepare application: organisation, finance, technical capability, business and risk plan',
      'Bibob integrity check; VOG for directors may be asked'
    ],
    '[{"label":"Ondernemersplein: supply to small users","url":"https://ondernemersplein.overheid.nl/wetten-en-regels/gas-of-elektriciteit-leveren-aan-kleinverbruikers/"},{"label":"ACM: licence requirements","url":"https://www.acm.nl/nl/energie/elektriciteit-en-gas/energie-verkopen/energie-leveren-met-vergunning/eisen-energievergunning"}]'::jsonb,
    false,
    '2026-11-21'
  ),
  (
    'R02',
    'ACM financial resilience rules',
    'must',
    'risk',
    'in_force',
    '2026-04-10',
    'high',
    'Licensed suppliers keep a 12-month liquidity forecast that stays positive in a base case and two stress cases (prices halved, prices doubled). Supply obligations must be hedged with matching positions within 7 calendar days.',
    'Sets procurement and treasury design for small-connection clients. Over- and under-buying are not allowed.',
    array[
      'Monthly 12-month liquidity forecast with both stress cases',
      'Hedge each signed contract within 7 days',
      'Track churn, bad debt and imbalance cost as stress inputs'
    ],
    '[{"label":"ACM: financial position requirements","url":"https://www.acm.nl/nl/publicaties/eisen-financiele-positie-energieleveranciers-nader-ingevuld"},{"label":"ACM policy rule (PDF)","url":"https://www.acm.nl/system/files/documents/beleidsregel-financi%C3%ABle-weerbaarheid-energieleveranciers-acm.pdf"}]'::jsonb,
    false,
    '2026-11-21'
  ),
  (
    'R03',
    'Licence conduct duties',
    'must',
    'customer',
    'in_force',
    '2026-01-01',
    'medium',
    'Licensed suppliers must supply on request at reasonable terms, offer model contracts (fixed with 12+ months fixed tariffs, and open-ended variable), notify new tariffs to ACM 3 working days before sale and tariff changes 30 days ahead, run a complaints scheme and join a disputes committee.',
    'Fixes the product menu and pricing calendar for small-connection clients.',
    array[
      'Build model fixed and variable products',
      'Tariff change calendar: ACM + clients 30 days ahead',
      'Complaints flow and disputes committee membership'
    ],
    '[{"label":"ACM: licence requirements","url":"https://www.acm.nl/nl/energie/elektriciteit-en-gas/energie-verkopen/energie-leveren-met-vergunning/eisen-energievergunning"}]'::jsonb,
    false,
    '2026-11-21'
  ),
  (
    'R04',
    'Energiewet: protection by company size',
    'must',
    'customer',
    'in_force',
    '2026-01-01',
    'high',
    'The Energiewet replaced the Elektriciteitswet 1998 and Gaswet 2000. Micro-enterprises get consumer-like rights (14-day cooling off, max one month notice, termination fee only if in the contract). Small enterprises get continued supply if the supplier fails. Medium: transparency duties.',
    'One SME contract will not fit all. Terms depend on client size.',
    array[
      'Capture staff and turnover at onboarding',
      'Contract templates per size class',
      'Termination fee logic per size class'
    ],
    '[{"label":"Gaslicht: Energiewet for business (secondary)","url":"https://www.gaslicht.com/zakelijk/de-energiewet-uitgelegd-voor-zakelijke-klanten"},{"label":"Energiewet (wetten.overheid.nl)","url":"https://wetten.overheid.nl/BWBR0050714/"}]'::jsonb,
    true,
    '2026-11-21'
  ),
  (
    'R05',
    'Early exit fee on business fixed contracts',
    'must',
    'customer',
    'in_force',
    '2026-01-01',
    'medium',
    'When a business ends a fixed-term, fixed-price contract early, the supplier may charge a fee equal to its loss.',
    'Protects hedged volumes. Needs a clear, provable loss calculation.',
    array[
      'Define loss formula (hedge unwind)',
      'Show fee rule in offer and contract'
    ],
    '[{"label":"Ondernemersplein: supply to small users","url":"https://ondernemersplein.overheid.nl/wetten-en-regels/gas-of-elektriciteit-leveren-aan-kleinverbruikers/"}]'::jsonb,
    false,
    '2026-11-21'
  ),
  (
    'R06',
    'Balance responsibility for electricity',
    'must',
    'balancing',
    'in_force',
    null,
    'high',
    'Every electricity supplier must have a Balance Responsible Party recognised by TenneT, in-house or contracted. The BRP submits daily E-programmes and pays imbalance at the imbalance price.',
    'Make or buy: own BRP recognition, or contract one. Sets imbalance cost in the margin.',
    array[
      'Decide own BRP vs contracted BRP',
      'Apply to TenneT via Message Box (if own)',
      'Daily forecasting and E-programme submission',
      'Imbalance cost tracking'
    ],
    '[{"label":"Business.gov.nl: balancing responsibility","url":"https://business.gov.nl/regulations/balancing-responsibility-electricity-supply/"},{"label":"TenneT: BRP","url":"https://www.tennet.eu/nl-en/balance-responsible-party-brp"}]'::jsonb,
    false,
    '2026-11-21'
  ),
  (
    'R07',
    'Gas: shipper relation and GTS registration',
    'must',
    'balancing',
    'in_force',
    null,
    'high',
    'A gas supplier always works with a shipper that buys and delivers the gas. After EDSN registration, the supplier registers with Gasunie Transport Services. GTS invoices licensed small-user suppliers for Peak Supply.',
    'Gas needs its own wholesale partner and cost line.',
    array[
      'Select shipper',
      'GTS supplier registration form',
      'Budget Peak Supply cost (small-user clients)'
    ],
    '[{"label":"GTS: suppliers","url":"https://www.gasunietransportservices.nl/en/suppliers"}]'::jsonb,
    false,
    '2026-11-21'
  ),
  (
    'R08',
    'Market registration and data access',
    'must',
    'data',
    'in_force',
    null,
    'high',
    'New market parties register via Partners in Energie for EDSN data services used in market processes. Preferred Party Administration is mandatory for licensed suppliers and BRPs. An EAN code is needed for messaging.',
    'No switching, meter data or settlement without it. Long IT lead time.',
    array[
      'Register in the market participant registry',
      'Get EAN code',
      'Build or buy market messaging (switch, meter data)',
      'Preferred Party Administration (if licensed)'
    ],
    '[{"label":"Partners in Energie: registration","url":"https://www.partnersinenergie.nl/toegang-aanvragen/organisatie-registreren"},{"label":"GTS: suppliers","url":"https://www.gasunietransportservices.nl/en/suppliers"}]'::jsonb,
    false,
    '2026-11-21'
  ),
  (
    'R09',
    'Energy tax collected by the supplier',
    'must',
    'billing',
    'in_force',
    '2026-01-01',
    'high',
    'The supplier owes energy tax on supply and files returns per period with the Belastingdienst. ODE is merged into it since 2023. 2026 electricity: €0.09161/kWh up to 10,000 kWh, €0.06671 to 50,000, €0.03735 to 10 mln. Gas: €0.60066/m³ up to 170,000 m³. Tax reduction €519.80 per electricity connection with a building use.',
    'Bracket logic per connection drives every invoice. Rates change each 1 January.',
    array[
      'Register for energy tax returns',
      'Bracket engine per connection, updated each year',
      'Apply reduction per eligible connection'
    ],
    '[{"label":"Belastingdienst: energy tax","url":"https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/overige_belastingen/belastingen_op_milieugrondslag/energiebelasting/energiebelasting"}]'::jsonb,
    false,
    '2026-11-21'
  ),
  (
    'R10',
    'End of net metering',
    'must',
    'billing',
    'coming',
    '2027-01-01',
    'high',
    'Net metering (salderingsregeling) for households and small businesses ends 1 Jan 2027. Until 2030 the supplier pays at least 50% of the bare supply tariff for feed-in. Suppliers may charge feed-in costs, supervised by ACM.',
    'Small businesses with solar need a feed-in price from day one. Also a switch moment to sell into.',
    array[
      'Feed-in tariff product (min. 50% rule)',
      'Separate feed-in metering in billing',
      'Outreach to SMEs with solar before Jan 2027'
    ],
    '[{"label":"Rijksoverheid: salderingsregeling","url":"https://www.rijksoverheid.nl/themas/klimaat-milieu-en-natuur/energie-thuis/salderingsregeling"}]'::jsonb,
    false,
    '2026-11-21'
  ),
  (
    'R11',
    'Feed-in costs per kWh on the invoice',
    'must',
    'billing',
    'coming',
    '2027-01-01',
    'medium',
    'From 1 Jan 2027, total feed-in costs must show on the invoice in euro per kWh fed in, for households and micro-enterprises. The offer must state how the cost is calculated.',
    'Invoice layout and offer text for micro-enterprise clients.',
    array[
      'Invoice line: feed-in cost €/kWh',
      'Calculation method in every feed-in offer'
    ],
    '[{"label":"Solar Magazine on Energieregeling change (secondary)","url":"https://cdn.solarmagazine.nl/nieuws-zonne-energie/i44687/eigenaren-zonnepanelen-weten-eindelijk-waar-ze-aan-toe-zijn-terugleverkosten-moeten-vanaf-2027-per-kilowattuur-op-factuur"}]'::jsonb,
    true,
    '2026-11-21'
  ),
  (
    'R12',
    'Power label backed by GvOs',
    'must',
    'reporting',
    'in_force',
    '2027-05-01',
    'medium',
    'Licensed suppliers to small connections publish a power label (stroometiket) on their website by 1 May each year and add it to the annual bill. Green claims are backed by Guarantees of Origin held and cancelled in a VertiCer account.',
    'Green products need a GvO buying and cancelling process.',
    array[
      'Open VertiCer account',
      'Buy and cancel GvOs to match green volume',
      'Publish label by 1 May'
    ],
    '[{"label":"ACM: licence requirements (stroometiket)","url":"https://www.acm.nl/nl/energie/elektriciteit-en-gas/energie-verkopen/energie-leveren-met-vergunning/eisen-energievergunning"}]'::jsonb,
    false,
    '2026-11-21'
  ),
  (
    'R13',
    'Energy-saving duty: next report 1 Dec 2027',
    'opp',
    'sales',
    'coming',
    '2027-12-01',
    'high',
    'Companies above a usage threshold per site report savings measures to RVO every 4 years. Next deadline 1 Dec 2027. New portal expected around April 2027. Draft measures list (EML) expected January 2027.',
    'Clients need usage data per site. A data-rich supplier offer helps them report.',
    array[
      'Usage reports per site in the client portal',
      'Campaign Q2–Q3 2027 before the deadline'
    ],
    '[{"label":"RVO: energiebesparingsplicht","url":"https://www.rvo.nl/onderwerpen/energiebesparingsplicht"}]'::jsonb,
    false,
    '2026-11-21'
  ),
  (
    'R14',
    'CSRD narrowed by Omnibus I',
    'opp',
    'sales',
    'coming',
    '2027-01-01',
    'low',
    'CSRD now covers companies with more than 1,000 employees and over €450m turnover, from financial years starting 1 Jan 2027. NL transposition due 19 Mar 2027. Others may report voluntarily (VSME).',
    'Most SME and mid-market clients are out of scope. Green supply stays a voluntary sell, not a compliance sell.',
    array[
      'Keep CSRD out of the core pitch',
      'Offer Scope 2 data for voluntary reporters'
    ],
    '[{"label":"RVO: Omnibus overview","url":"https://www.rvo.nl/onderwerpen/omnibusvoorstel"},{"label":"Accountancy van Morgen: directive published","url":"https://www.accountancyvanmorgen.nl/2026/03/03/omnibus-richtlijn-met-soepeler-csrd-gepubliceerd/"}]'::jsonb,
    true,
    '2026-11-21'
  ),
  (
    'R15',
    'EIA tax deduction: 40%, 45.5% from 2027',
    'opp',
    'sales',
    'in_force',
    '2027-01-01',
    'medium',
    'Businesses deduct 40% of qualifying energy investments from profit. Apply within 3 months of the order. Budget €460m. Rate set to rise to 45.5% on 1 Jan 2027, pending Belastingplan 2027.',
    'Lowers the cost of client solar, batteries and efficiency. Fits a bundled offer.',
    array[
      'Flag EIA-eligible investments in sales calls',
      'Remind clients of the 3-month window'
    ],
    '[{"label":"RVO: EIA for businesses","url":"https://www.rvo.nl/subsidies-financiering/eia/ondernemers"},{"label":"Solar Magazine: 45.5% in Belastingplan","url":"https://solarmagazine.nl/nieuws-zonne-energie/i44783/kabinet-verankert-verhoging-energie-investeringsaftrek-in-belastingplan-aftrekpercentage-stijgt-van-40-naar-45-5-procent"}]'::jsonb,
    true,
    '2026-11-21'
  ),
  (
    'R16',
    'SDE++ 2026 round closes 26 Nov',
    'opp',
    'sales',
    'in_force',
    '2026-11-26',
    'low',
    'SDE++ 2026 has €8bn and runs 27 Oct to 26 Nov 2026 in five phases. €8bn a year is reserved for rounds up to 2032. Solar only where grid capacity exists.',
    'Clients building renewables need an offtaker. A lead source for later PPA work.',
    array[
      'Track SDE++ awardees as leads',
      'Revisit before the 2027 round'
    ],
    '[{"label":"Accountant.nl: €8bn SDE++","url":"https://www.accountant.nl/nieuws/2026/10/kabinet-stelt-acht-miljard-beschikbaar-voor-stimulering-duurzame-energie/"},{"label":"Solar Magazine: round phases","url":"https://solarmagazine.nl/nieuws-zonne-energie/i44212/openstelling-sde-2026-door-co2-opslag-vertraagd-tot-november"}]'::jsonb,
    true,
    '2026-11-21'
  )
on conflict (id) do update
set
  title = excluded.title,
  kind = excluded.kind,
  process = excluded.process,
  status = excluded.status,
  key_date = excluded.key_date,
  impact = excluded.impact,
  rule_text = excluded.rule_text,
  impact_text = excluded.impact_text,
  steps = excluded.steps,
  sources = excluded.sources,
  "check" = excluded."check",
  checked_at = excluded.checked_at;
