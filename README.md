# 🌐 DomainAppraiser

**Know what a domain is really worth. AI consensus, not guesswork.**

Submit any domain name and get a multi-AI-verified valuation stored on-chain. Validators fetch the actual site, analyze everything from keyword strength to comparable sales, and agree on a grade and price range. No single appraiser's opinion. No inflated estimates. Just decentralized consensus on market value.

---

## The Problem

Domain valuation is subjective. Ask three appraisers and get three wildly different numbers. Sellers inflate, buyers lowball, and there's no neutral source of truth. Existing tools use simple formulas that miss context — they can't see what's actually on the site or understand industry trends.

DomainAppraiser uses multiple AI models that independently fetch and analyze the domain, then must agree before a valuation is stamped. Disagreements get filtered out by consensus.

---

## How It Works

1. **Submit Domain** — Enter any domain (e.g. `startup.io`) and pay a small appraisal fee
2. **AI Validators Fetch & Analyze** — Each validator independently:
   - Fetches the live website content
   - Evaluates domain length, memorability, and brandability
   - Assesses keyword value and search demand
   - Checks extension quality (.com > .xyz)
   - Analyzes current usage (active business vs parked page)
   - Considers industry relevance and comparable sales
3. **Consensus** — Grade must match exactly. Estimated value must be within 40% across validators
4. **On-Chain Report** — Grade (A-F), price range, strengths, weaknesses, comparables — stored permanently

---

## What You Get

```json
{
  "grade": "B",
  "estimated_value_usd": 15000,
  "estimated_value_high_usd": 35000,
  "strengths": ["Short, memorable", "High-value keyword", "Active business"],
  "weaknesses": [".io extension limits mass market appeal"],
  "comparable_sales": "similar 2-word .io domains sold for $10k-$50k",
  "summary": "Strong brandable domain with active usage. Premium for the .io space."
}
```

---

## Use Cases

- **Domain investors** — Screen portfolios before buying
- **Sellers** — Set fair asking prices backed by AI consensus
- **Startups** — Evaluate if a domain is worth the asking price
- **Disputes** — On-chain proof of value at a specific point in time
- **Portfolios** — Batch-appraise domain collections

---

## Why GenLayer?

Domain valuation requires:
1. **Web access** — Fetching live site content to understand current usage
2. **Subjective judgment** — Assessing "brandability" and "memorability" isn't math
3. **Consensus** — Multiple perspectives prevent one model's bias from dominating

Traditional oracles can't judge domain quality. Traditional smart contracts can't fetch websites. GenLayer does both.

---

## Consensus Rules

| Field | Rule |
|-------|------|
| Grade (A-F) | Must match exactly across validators |
| Estimated value | Within 40% tolerance (domains are volatile) |
| Strengths/Weaknesses | Not compared (subjective text) |

The 40% tolerance accounts for the inherent uncertainty in domain pricing — two experts rarely agree within tighter bounds.

---

## Deployed Contract

```
Network: GenLayer Studionet
Address: 0x8cdD6aB8A60F5f3096bD275bA7E33917A52d88A9
Status:  5/5 validators AGREE
```

---

## Project Structure

```
domain-appraiser-genlayer/
├── contracts/
│   └── domain_appraiser.py    # Intelligent Contract
├── frontend/
│   ├── src/app/
│   │   ├── layout.tsx
│   │   └── page.tsx           # Appraisal UI
│   ├── src/lib/genlayer.ts
│   ├── package.json
│   └── tsconfig.json
├── .gitignore
└── README.md
```

---

## Quick Start

```bash
# Install CLI
npm install -g genlayer

# Deploy (or use deployed address above)
genlayer network set studionet
genlayer account create --name appraiser --password "yourpass"
genlayer account unlock --password "yourpass"
genlayer deploy --contract contracts/domain_appraiser.py

# Frontend
cd frontend
npm install
echo "NEXT_PUBLIC_CONTRACT_ADDRESS=0x8cdD6aB8A60F5f3096bD275bA7E33917A52d88A9" > .env.local
npm run dev
```

---

## Contract API

| Method | Type | Description |
|--------|------|-------------|
| `request_appraisal(domain)` | payable | Submit domain + pay fee |
| `appraise(appraisal_id)` | write (AI) | Triggers multi-AI valuation |
| `get_appraisal(appraisal_id)` | view | Get full appraisal report |
| `get_appraisal_count()` | view | Total appraisals submitted |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Contract | Python (GenLayer Intelligent Contract) |
| Web Access | `gl.nondet.web.get()` — fetches live domains |
| AI Consensus | `gl.vm.run_nondet_unsafe` + grade match + value tolerance |
| Frontend | Next.js + TypeScript |
| SDK | GenLayerJS |

---

## License

MIT
