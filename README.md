# Joroots Workforce

Production multi-agent system for Joroots: one Orchestrator, Research Agent, Marketing Strategist, Content & Creative Agent — reusable skills, shared knowledge base, connector registry, project memory, three-panel workspace.

## Run
```
npm install
cp .env.example .env.local   # fill in what you have
npm run dev                  # http://localhost:3000
```
`npm run build` must pass before pushing.

## Layout
```
agents/<id>/agent.md + config.json   agent definitions (mission, boundaries, skills, tools, knowledge, permissions)
skills/<dept>/<skill>.md             reusable skill modules, loaded per task
knowledge/<category>/*.md            shared knowledge base with metadata; retrieved per task, never injected whole
lib/providers                        model provider layer (anthropic, openai) — agents reference a provider, not code
lib/connectors                       registry + status + tests; every external service goes through here
lib/repo                             repository layer (Upstash KV or in-memory) — swap for Postgres without touching agents
lib/agents/run.ts                    task contract → skills + knowledge + least-privilege tools → provider call → log
app/api/*                            agent, config, projects, connectors, connectors/test, health
public/app.js                        client runtime: orchestration pipeline, workspace, employee management
app/settings                         Integrations: status, required env, Test connection
docs/system-audit.md                 audit and reuse decisions
```

## Credentials (Vercel → Project → Settings → Environment Variables → redeploy)

**One key is enough to run the system.** Providers are tried in order and fail over automatically; the default chain is Groq → Gemini → Anthropic → OpenRouter → Mistral → DeepSeek → OpenAI (override with `PROVIDER_CHAIN`).

| Variable | Unlocks | Free? | Where |
|---|---|---|---|
| `GROQ_API_KEY` | **start here** — all four agents | Free, no card, does not train on your inputs | console.groq.com |
| `TAVILY_API_KEY` | web search for the Research Agent | 1,000 searches/month free, no card | tavily.com |
| `GEMINI_API_KEY` | quality tier, 1M context, vision | Free tier **trains on your inputs** and is barred for EU/UK production — enable billing for client-confidential work | aistudio.google.com |
| `HIGGSFIELD_API_KEY_ID` + `HIGGSFIELD_API_KEY_SECRET` | image generation, via Higgsfield's own REST API — no Anthropic key needed | Paid by credits | cloud.higgsfield.ai |
| `ANTHROPIC_API_KEY` | Canva/Gmail/Slack/Drive share buttons + native web search | Paid | console.anthropic.com |
| `OPENROUTER_API_KEY` | breadth fallback | Free routes may train on inputs unless disabled in account settings | openrouter.ai |
| `MISTRAL_API_KEY` | EU hosting, zero-retention option | Free evaluation tier | console.mistral.ai |
| `DEEPSEEK_API_KEY` | cheap fallback — data processed in China | Paid, very cheap | platform.deepseek.com |
| `OPENAI_API_KEY` | paid fallback | Paid | platform.openai.com |

Model IDs are overridable per provider (`GROQ_MODEL`, `GEMINI_MODEL`, …) because free-tier model names change often.

**Two constraints worth knowing:** MCP connector tools are carried by the Anthropic API, so image generation and the Gmail/Slack/Drive share buttons need `ANTHROPIC_API_KEY` — every other agent runs fine on Groq alone. And search is routed to Tavily whenever the serving model is not Anthropic; with neither connected, the Research Agent says so instead of inventing sources.

| Variable | Unlocks | Where |
|---|---|---|
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | persistent projects, config, logs | Upstash Redis (free) or Vercel KV |
| `HIGGSFIELD_MCP_TOKEN` | image / video generation | OAuth bearer from mcp.higgsfield.ai |
| `CANVA_MCP_TOKEN` | Canva designs | OAuth bearer from mcp.canva.com |
| `SLACK_MCP_TOKEN` | Slack share | OAuth bearer from mcp.slack.com |
| `GMAIL_MCP_TOKEN`, `GDRIVE_MCP_TOKEN` | Gmail drafts, Drive docs | Google MCP OAuth |
| `FIGMA_MCP_TOKEN`, `VERCEL_MCP_TOKEN` | registered, unassigned | provider OAuth |
| `GITHUB_TOKEN`, `GITHUB_REPO` | GitHub connector test | github.com/settings/tokens |

Missing credentials never break the app: the connector shows `MISSING_CREDENTIALS`, the agent delivers what it can and names the missing connector.

## Security
Secrets are server-only; the browser never receives keys or tokens. Tools are allowlisted per agent and per task. Logs record provider, latency, tool names and token usage — never secrets.

## Deploy
Push to `main` → Vercel builds automatically. Health check: `GET /api/health`.
