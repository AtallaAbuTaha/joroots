import { NextResponse } from 'next/server'; import { loadAgents, loadSkills, loadDepartments, saveAgentOverride, addCustomAgent } from '../../../lib/agents/loader';
import { registryView } from '../../../lib/connectors/registry'; import { knowledgeIndex } from '../../../lib/knowledge/loader'; import { providerStatus } from '../../../lib/providers'; import { persistent } from '../../../lib/repo/store';
export const dynamic = 'force-dynamic';
export async function GET() {
  const agents = (await loadAgents()).map(({ doc, ...a }) => a);
  return NextResponse.json({ build: { sha: (process.env.VERCEL_GIT_COMMIT_SHA || 'local').slice(0, 7), env: process.env.VERCEL_ENV || 'local', deployment: process.env.VERCEL_DEPLOYMENT_ID || null }, agents, skills: loadSkills(), departments: await loadDepartments(), registry: registryView(), knowledge: knowledgeIndex(), providers: providerStatus(), persistent: persistent() });
}
export async function POST(req: Request) {
  const b = await req.json();
  if (b.action === 'update_agent') { await saveAgentOverride(b.id, b.patch); return NextResponse.json({ ok: true }); }
  if (b.action === 'add_agent') { const a = b.agent; if (!a?.name) return NextResponse.json({ error: 'name required' }, { status: 400 });
    a.id = a.id || a.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).slice(2, 6);
    a.status = 'active'; a.model = a.model || { provider: 'anthropic', model: 'default', fallback: 'openai' }; a.tools = a.tools || ['anthropic', 'knowledge']; a.skills = a.skills || []; a.knowledge = a.knowledge || ['company', 'brand']; a.permissions = a.permissions || {};
    a.instructions = a.instructions || `You are Joroots' ${a.name} (${a.role || 'specialist'}). Mission: ${a.mission || ''}. Responsibilities: ${a.responsibilities || ''}. Follow the Joroots voice: machine-plain, numbers over adjectives. Deliver in markdown.`;
    await addCustomAgent(a); return NextResponse.json({ ok: true, agent: a }); }
  return NextResponse.json({ error: 'unknown action' }, { status: 400 });
}
