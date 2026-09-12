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

## Update — 13 Sep 2026: multi-provider layer

Added a model provider abstraction with a single OpenAI-compatible adapter (`lib/providers/openai-compat.ts`) covering Groq, Gemini (OpenAI shim), OpenRouter, Mistral, DeepSeek and OpenAI; Anthropic keeps its own adapter because it alone carries MCP tools and native web search.

- Default chain: Groq → Gemini → Anthropic → OpenRouter → Mistral → DeepSeek → OpenAI. Override with `PROVIDER_CHAIN`. Per-agent override in the employee profile (default "auto").
- Failover: retry once on 429/5xx with backoff, then the next provider. Every attempt is logged and surfaced in the activity stream. If all fail, the task fails loudly — no fabricated output.
- JSON mode is requested via `response_format` and retried without it if a route rejects it.
- Search: `lib/search/index.ts` (Tavily). Anthropic uses its native server-side search; every other provider gets Tavily results injected as `<search_results>` evidence, wrapped with instructions to ignore embedded instructions (prompt-injection defense, matching the Joroots `<captured_page>` convention). With neither connected, the agent is told it has no search and must not invent sources.
- MCP gating: tasks requiring connector tools resolve only to Anthropic and return a clear error naming the missing key rather than silently dropping the tool.

Provider selection rationale (research, Sept 2026): Groq is the only free tier that is simultaneously private (no training on inputs), OpenAI-compatible, and fast enough for an agent loop; Gemini's free tier trains on inputs and is barred for EU/UK production, so it is wired but flagged as paid-for-confidential-work. GitHub Models was retired July 2026 and Cerebras dropped its free tier, so neither is included.
