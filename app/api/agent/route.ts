import { NextResponse } from 'next/server'; import { runTask } from '../../../lib/agents/run';
export const maxDuration = 60; export const dynamic = 'force-dynamic';
// Only these names are accepted as per-request keys. Nothing is stored server-side or logged.
const ALLOWED_KEYS = ['GROQ_API_KEY','GEMINI_API_KEY','ANTHROPIC_API_KEY','OPENROUTER_API_KEY','MISTRAL_API_KEY','DEEPSEEK_API_KEY','OPENAI_API_KEY','TAVILY_API_KEY','HIGGSFIELD_MCP_TOKEN','CANVA_MCP_TOKEN','SLACK_MCP_TOKEN','GMAIL_MCP_TOKEN','GDRIVE_MCP_TOKEN'];
const sanitizeKeys = (k: any) => {
  const out: Record<string, string> = {}; if (!k || typeof k !== 'object') return out;
  for (const n of ALLOWED_KEYS) if (typeof k[n] === 'string' && k[n].trim()) out[n] = k[n].trim();
  return out;
};
export async function POST(req: Request) {
  try {
    const t = await req.json(); if (!t.assigned_agent || !t.input) return NextResponse.json({ error: 'assigned_agent and input required' }, { status: 400 });
    const r = await runTask({ ...t, keys: sanitizeKeys(t.keys) });
    return NextResponse.json(r);
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
