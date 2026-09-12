import { NextResponse } from 'next/server'; import { testConnector } from '../../../../lib/connectors/test';
export const maxDuration = 60; export const dynamic = 'force-dynamic';
const ALLOWED = ['GROQ_API_KEY','GEMINI_API_KEY','ANTHROPIC_API_KEY','OPENROUTER_API_KEY','MISTRAL_API_KEY','DEEPSEEK_API_KEY','OPENAI_API_KEY','TAVILY_API_KEY','HIGGSFIELD_API_KEY_ID','HIGGSFIELD_API_KEY_SECRET','CANVA_MCP_TOKEN','SLACK_MCP_TOKEN','GMAIL_MCP_TOKEN','GDRIVE_MCP_TOKEN'];
export async function POST(req: Request) {
  const b = await req.json(); const keys: Record<string, string> = {};
  if (b.keys && typeof b.keys === 'object') for (const n of ALLOWED) if (typeof b.keys[n] === 'string' && b.keys[n].trim()) keys[n] = b.keys[n].trim();
  return NextResponse.json({ id: b.id, ...(await testConnector(b.id, keys)), last_tested: Date.now() });
}
