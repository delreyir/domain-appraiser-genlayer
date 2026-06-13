# 🌐 DomainAppraiser

**Decentralized domain valuations, powered by AI consensus.**

Submit any domain name and get a multi-AI-verified appraisal stored on-chain. Validators fetch the site, analyze keywords, length, extension, current usage, and comparable sales — then agree on a grade and price range. No single appraiser's bias. Just consensus.

---

## How It Works

1. Submit a domain name + pay appraisal fee
2. AI validators independently fetch the domain's website
3. Each validator analyzes: length, keywords, extension, usage, industry, comparables
4. They agree on a grade (A-F) and price range (must match within 40%)
5. Valuation stored on-chain permanently

---

## Use Cases

- Domain investors evaluating purchases
- Sellers setting fair asking prices
- Dispute resolution over domain value
- Portfolio valuation for domain collections
- On-chain proof of value at a point in time

---

## Consensus Rules

- **Grade** must match exactly (A/B/C/D/F)
- **Estimated value** within 40% tolerance (domains are volatile)
- Multiple AI models must independently agree

---

## Quick Start

```bash
npm install -g genlayer
genlayer network set studionet
genlayer deploy --contract contracts/domain_appraiser.py

cd frontend && npm install && npm run dev
```

---

## License

MIT
