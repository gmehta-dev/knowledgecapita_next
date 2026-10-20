# knowledgecapita_next

Next.js (App Router) version of **Knowledge Capita**, replacing the separate
`sharecomReactJs` (CRA frontend) and `knowledgeCapita-API` (Express backend).
It uses the **same MongoDB database and the same uploaded files**.

- `app/(site)/*` – pages (same URLs as the CRA app)
- `app/api/*` – Route Handlers (same `/api/*` URLs and JSON responses as the Express API)
- `server/*` – server-only code: models, validators, controllers (ported from Express)
- `views/`, `components/`, `lib/`, `styles/` – UI code ported from CRA
- `tests/contract/` – API contract suite that runs against both old and new backends

```bash
cp .env.example .env.local   # fill in values
npm install
npm run dev                  # http://localhost:3000
npm run build && npm start   # production (standalone server)
```

See [MIGRATION.md](MIGRATION.md) for what changed and why, and
[DEPLOYMENT.md](DEPLOYMENT.md) for the production cutover and rollback.
