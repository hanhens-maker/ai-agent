# Netherlands GTM Dashboard
Hey! 👋

This repo is the story of how I'd take trawa into the Netherlands, and the dashboard I built to do it.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000/market-rules](http://localhost:3000/market-rules).

## Documentation

- System map: [`docs/Architecture.md`](docs/Architecture.md)
- Market rules module: [`docs/market-rules.md`](docs/market-rules.md)
- Data contract: [`docs/contracts/data-contract.md`](docs/contracts/data-contract.md)
- API contract: [`docs/contracts/api-contract.md`](docs/contracts/api-contract.md)

## Checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Query Dutch national legislation

`scripts/bwb_sru.py` queries the official Basiswettenbestand (BWB) SRU service
and converts its XML records to normalized JSON. It does not write to Supabase.

```bash
python3 scripts/bwb_sru.py \
  --query 'titel="Energiewet" sortby dcterms.modified/descending' \
  --maximum-records 5 \
  --output data/energiewet.json
```

Search a known BWB identifier:

```bash
python3 scripts/bwb_sru.py \
  --query 'dcterms.identifier==BWBR0050714' \
  --maximum-records 10
```

The live BWB service currently accepts SRU 1.2 for this request shape. Override
it with `--version` if the service completes its documented move to 2.0.
The client keeps TLS verification enabled. If Python does not use the operating
system trust store, it falls back to the system `curl` client.

Run parser tests without accessing the network:

```bash
python3 -m unittest discover -s tests
```

## Collect the compliance source scope

The source scope lives in `config/compliance_sources.json`. It currently covers:

- Energiewet, Energiebesluit, Energieregeling and Invoeringsregeling Energiewet
- every electricity or mixed electricity/gas code linked from ACM's energy rules index
- ACM handreikingen and beleidsregels published from 1 January 2026

Run the complete collection without writing to Supabase:

```bash
python3 scripts/collect_compliance_sources.py \
  --output data/compliance-sources.json
```

For codes, the collector searches BWB first. If an exact current BWB title is
not available, it retrieves the linked Staatscourant record from the current
official-publications SRU service.

Discover live SRU query fields and official-publication collections:

```bash
python3 scripts/sru_discovery.py \
  --output data/sru-capabilities.json
```

### Supabase handoff

Apply `supabase/migrations/202611220001_create_compliance_source_documents.sql`
through the normal migration workflow. The table is public-read with RLS and
has no client write policy.

After the migration is applied, a scheduled server-side job can upsert a
snapshot with service-role credentials:

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
python3 scripts/collect_compliance_sources.py \
  --output data/compliance-sources.json \
  --write-supabase
```

Never put either value in the repository. Stable content hashes make reruns
idempotent; changed source metadata creates a new version row.
