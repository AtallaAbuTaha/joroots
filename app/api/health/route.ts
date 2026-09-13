import { NextResponse } from 'next/server'; import { providerStatus } from '../../../lib/providers'; import { persistent } from '../../../lib/repo/store'; import { registryView } from '../../../lib/connectors/registry';
export const dynamic = 'force-dynamic';
const EXPECTED = ['GROQ_API_KEY','GEMINI_API_KEY','ANTHROPIC_API_KEY','OPENROUTER_API_KEY','MISTRAL_API_KEY','DEEPSEEK_API_KEY','OPENAI_API_KEY','TAVILY_API_KEY','KV_REST_API_URL','KV_REST_API_TOKEN','HIGGSFIELD_API_KEY_ID','HIGGSFIELD_API_KEY_SECRET','CANVA_MCP_TOKEN','SLACK_MCP_TOKEN','GMAIL_MCP_TOKEN','GDRIVE_MCP_TOKEN'];
export async function GET(req: Request) {
  const reg = registryView();
  const base: any = { ok: true, version: '0.3.0',
    build: { sha: (process.env.VERCEL_GIT_COMMIT_SHA || 'local').slice(0, 7), message: process.env.VERCEL_GIT_COMMIT_MESSAGE || null, deployment: process.env.VERCEL_DEPLOYMENT_ID || null, env: process.env.VERCEL_ENV || 'local', url: process.env.VERCEL_URL || null, built_at: process.env.BUILD_TIME || null }, providers: providerStatus(), persistent: persistent(), connected: reg.filter(c => c.status === 'CONNECTED').map(c => c.id), missing: reg.filter(c => c.status !== 'CONNECTED').map(c => c.id) };
  if (new URL(req.url).searchParams.get('debug') === '1') {
    // Names and shape only — never values. Helps diagnose a typo or wrong-environment variable.
    base.debug = {
      expected: Object.fromEntries(EXPECTED.map(k => {
        const v = process.env[k];
        return [k, v ? { present: true, length: v.length, starts: v.slice(0, 4), trailing_space: /\s$/.test(v), quoted: /^["']/.test(v) } : { present: false }];
      })),
      key_like_names_visible: Object.keys(process.env).filter(k => /KEY|TOKEN|SECRET|API/i.test(k) && !/^(npm_|NEXT_RUNTIME|AWS_|VERCEL_OIDC)/.test(k)).sort(),
      vercel_env: process.env.VERCEL_ENV || null
    };
  }
  return NextResponse.json(base);
}
