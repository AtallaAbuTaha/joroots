import { loadAgents, loadSkills } from './loader'; import { retrieve } from '../knowledge/loader';
import { getProvider } from '../providers'; import { ContentBlock } from '../providers/types';
import { mcpServersFor, isConnected } from '../connectors/registry'; import { logsRepo } from '../repo/store';
export type TaskContract = { task_id: string; parent_task_id?: string; objective: string; context?: string; input: ContentBlock[]; assigned_agent: string; required_skills?: string[]; allowed_tools?: string[]; expected_output?: string; success_criteria?: string; extra_system?: string; web_search?: boolean; mcp?: string[]; max_tokens?: number };
export async function runTask(t: TaskContract) {
  const agents = await loadAgents(); const a = agents.find(x => x.id === t.assigned_agent); if (!a) throw new Error('Unknown agent ' + t.assigned_agent);
  if (a.status !== 'active') throw new Error(a.name + ' is paused');
  const skills = loadSkills(); const use = (t.required_skills?.length ? t.required_skills : a.skills).filter(s => a.skills.includes(s) && skills[s]);
  const query = t.objective + ' ' + (t.context || '') + ' ' + t.input.filter((b: any) => b.type === 'text').map((b: any) => b.text).join(' ');
  const kn = retrieve(a.knowledge, query);
  const system = [a.instructions, `Role: ${a.role} (${a.name}, ${a.department}).`,
    use.length ? 'Skills to apply:\n' + use.map(s => `### ${skills[s].name}\n${skills[s].body}`).join('\n\n') : '',
    'Relevant Joroots knowledge:\n' + kn.map(k => `### ${k.title} [${k.confidence || 'n/a'}]\n${k.body}`).join('\n\n'),
    `Task contract: objective=${t.objective}; expected_output=${t.expected_output || 'as instructed'}; success_criteria=${t.success_criteria || 'Joroots voice rules'}`, t.extra_system || ''].filter(Boolean).join('\n\n');
  // least privilege: tool must be on the agent AND on the task allowlist (if given) AND connected
  const allowed = (id: string) => a.tools.includes(id) && (!t.allowed_tools || t.allowed_tools.includes(id));
  const webSearch = !!t.web_search && allowed('web_search') && isConnected('web_search');
  const mcpIds = (t.mcp || []).filter(allowed); const mcpServers = mcpServersFor(mcpIds);
  const unavailable = mcpIds.filter(id => !isConnected(id));
  const provider = getProvider(a.model?.provider || 'anthropic', a.model?.fallback, webSearch || mcpServers.length > 0);
  const started = Date.now();
  try {
    const r = await provider.call({ system, content: t.input, maxTokens: t.max_tokens || 2000, webSearch, mcpServers });
    await logsRepo.append({ task_id: t.task_id, agent: a.id, provider: r.provider, model: r.model, ms: r.ms, tools: r.tools.map(x => x.tool), usage: r.usage, ok: true });
    return { ...r, agent: a.id, agentName: a.name, skills_used: use, knowledge_used: kn.map(k => k.id), unavailable_connectors: unavailable, task_id: t.task_id };
  } catch (e: any) { await logsRepo.append({ task_id: t.task_id, agent: a.id, ms: Date.now() - started, ok: false, error: e.message }); throw e; }
}
