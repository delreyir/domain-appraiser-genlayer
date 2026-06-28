# 🌐 DomainAppraiser

**Know what a domain is really worth. AI consensus, not guesswork.**

🔗 **Live app:** https://domain-appraiser.pages.dev

---

## The Problem

Domain valuation is subjective — ask three appraisers and get three wildly different numbers. Sellers inflate, buyers lowball, and automated tools use simple formulas that can't see what's actually on the site or understand industry context.

DomainAppraiser uses multiple AI validators that independently fetch and analyze a domain, then must agree before a valuation is written on-chain.

---

## How It Works

1. **Connect your wallet** (MetaMask, Rabby, or any EVM wallet — no Snap required)
2. **Submit a domain** + a small appraisal fee.
3. **Run the AI appraisal** — validators fetch the live site and assess length, keywords, extension, usage, brandability, and comparable sales.
4. **Read the result** — a grade (A–F), a price range, strengths, weaknesses, and comparables — stored permanently on-chain.

---

## What You Get

```json
{
  "grade": "B",
  "estimated_value_usd": 15000,
  "estimated_value_high_usd": 35000,
  "strengths": ["Short, memorable", "High-value keyword"],
  "weaknesses": [".io limits mass-market appeal"],
  "comparable_sales": "similar 2-word .io domains sold for $10k–$50k",
  "summary": "Strong brandable domain with active usage."
}
```

---

## Why GenLayer?

Domain valuation requires fetching live web data **and** subjective judgment about brandability — neither possible on a normal blockchain. GenLayer validators each fetch the domain and value it independently; the grade must match exactly and the estimated value must agree within 40% (domains are volatile) before the appraisal finalizes.

---

## Wallet & Network

Standard EVM wallet, normal signing popup — **no GenLayer Snap**. On connect it adds/switches to the **GenLayer Studio Network** (chain `61999`, RPC `https://studio.genlayer.com/api`).

---

## Contract API

| Method | Type | Description |
|--------|------|-------------|
| `request_appraisal(domain)` | payable | Submit a domain + fee |
| `appraise(appraisal_id)` | write (AI) | Run the multi-AI valuation |
| `get_appraisal(appraisal_id)` | view | Full appraisal report |
| `get_appraisal_count()` | view | Total appraisals |

**Consensus rule:** `grade` must match exactly; `estimated_value_usd` within 40% across validators.

---

## Project Structure

```
domain-appraiser-genlayer/
├── contracts/
│   └── domain_appraiser.py  # GenLayer Intelligent Contract (Python)
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx     # Analytics-dashboard UI
│   │   └── lib/
│   │       └── genlayer.ts  # Wallet connect (no Snap) + read client
│   ├── next.config.js
│   └── package.json
└── README.md
```

---

## Run Locally

```bash
npm install -g genlayer
genlayer network set studionet
genlayer account create --name deployer --password "yourpass"
genlayer account unlock --password "yourpass"
genlayer deploy --contract contracts/domain_appraiser.py

cd frontend
npm install
npm run dev
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart contract | Python — GenLayer Intelligent Contract |
| Web access | `gl.nondet.web.get()` |
| AI consensus | `gl.vm.run_nondet_unsafe` + numeric tolerance |
| Frontend | Next.js (static export) + TypeScript |
| SDK | genlayer-js |
| Hosting | Cloudflare Pages |

---

## License

MIT
