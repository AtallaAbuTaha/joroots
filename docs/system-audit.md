# System audit — Joroots Workforce (13 Sep 2026)

## Current stack (before this build)
- **Joroots Workforce v1** — single-file HTML app running inside Claude.ai artifacts: Orchestrator + Research + Marketing + Creative, knowledge layer, skills, capability registry, project library on `window.storage`. Works today with every connector because Claude.ai injects the API key and connector sessions. Not deployable as-is: those injections do not exist outside Claude.ai.
- **Joroots OS v2** — earlier single-file HTML command deck wired to Gmail, Calendar, Drive, Canva, Higgs MCP. Same constraint.
- **joroots.com redesign** — single-file React site; its `/intelligence` module depends on `window.claude.complete` and is blocked by the same missing server-side proxy.
- **Knowledge** — portfolio Rev 01 2026 (PDF), site content reference (PDF), `joroots-knowledge-layer.md` on Google Drive (folder `1bRaxfJkiW7xRpmIzWTpLN0sQYvoyqsDV`) with VERIFIED / PROPOSED / OPEN / CONFLICT tags.
- **Connectors authenticated in Claude.ai** — Gmail, Google Calendar, Google Drive, Canva, Higgsfield, Slack, Figma, Vercel. These are the user's OAuth sessions; none transfer to a server.
- **GitHub** — `AtallaAbuTaha/JSTA`, `AtallaAbuTaha/million-travel` exist. No repo for this system yet.
- **Vercel** — account connected via MCP. No project for this system yet.
- **Database / env vars** — none.

## Reuse decisions
- Reused: the v1 UI (ported 1:1 to `public/app.js` + `app/globals.css`), the knowledge content (split into `/knowledge/**` with metadata), the 20 skills (`/skills/**.md`), the four agent definitions (`/agents/*/agent.md + config.json`), the voice rules and banned-word list, the pipeline logic.
- Replaced: direct browser calls to Anthropic → `/api/agent` with a provider abstraction; `window.storage` → repository layer (Upstash KV, in-memory fallback); artifact-injected MCP sessions → per-connector bearer tokens in server env.
- Not rebuilt: joroots.com, Joroots OS, the brand analyzer.

## Deployment state
Local `next build` passes. Local smoke test passes with no credentials: honest MISSING_CREDENTIALS states, Add Employee registers a live agent and department, project save works in memory.
