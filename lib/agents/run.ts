import { loadAgents, loadSkills } from './loader'; import { retrieve } from '../knowledge/loader';
import { resolveChain } from '../providers'; import { ContentBlock, isRetryable } from '../providers/types';
import { mcpServersFor, isConnectedWith } from '../connectors/registry'; import { logsRepo } from '../repo/store';
import { tavilyReady, tavilySearch, evidenceBlock } from '../search';
export type TaskContract = { task_id: string; parent_task_id?: string; objective: string; context?: string; input: ContentBlock[]; assigned_agent: string; required_skills?: string[]; allowed_tools?: string[]; expected_output?: string; success_criteria?: string; extra_system?: string; web_search?: boolean; mcp?: string[]; max_tokens?: number; keys?: Record<string, string> };
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
export async function runTask(t: TaskContract) {
  const agents = await loadAgents(); const a = agents.find(x => x.id === t.assigned_agent); if (!a) throw new Error('Unknown agent ' + t.assigned_agent);
  if (a.status !== 'active') throw new Error(a.name + ' is paused');
  const skills = loadSkills(); const use = (t.required_skills?.length ? t.required_skills : a.skills).filter(s => a.skills.includes(s) && skills[s]);
  const inputText = t.input.filter((b: any) => b.type === 'text').map((b: any) => b.text).join(' ');
  const kn = retrieve(a.knowledge, t.objective + ' ' + (t.context || '') + ' ' + inputText);
  const events: any[] = []; const sources: { url: string; title: string }[] = []; const unavailable: string[] = [];
  // least privilege: tool must be granted to the agent AND allowed by the task AND actually connected
  const allowed = (id: string) => a.tools.includes(id) && (!t.allowed_tools || t.allowed_tools.includes(id));
  const mcpIds = (t.mcp || []).filter(allowed); const needsMcp = mcpIds.length > 0;
  mcpIds.filter(id => !isConnectedWith(id, t.keys)).forEach(id => unavailable.push(id));
  const chain = resolveChain(a.model?.provider, a.model?.fallback, needsMcp, t.keys);
  const mcpServers = mcpServersFor(mcpIds, t.keys);
  // Search: Anthropic runs it server-side; every other provider gets Tavily evidence injected instead.
  let content = t.input.slice(); let nativeSearch = false;
  if (t.web_search && allowed('web_search')) {
    if (chain[0].supportsNativeSearch) { nativeSearch = true; }
    else if (tavilyReady(t.keys) && allowed('tavily')) {
      const q = (t.objective || inputText).slice(0, 380);
      try {
        const res = await tavilySearch(q, 5, t.keys); res.hits.forEach(h => sources.push({ url: h.url, title: h.title }));
        content = ([{ type: 'text', text: evidenceBlock(q, res) }] as ContentBlock[]).concat(content);
        events.push({ who: 'tool', text: `Tavily search: ${res.hits.length} results for "${q.slice(0, 60)}"`, kind: 'tool' });
      } catch (e: any) { events.push({ who: 'tool', text: 'Tavily search failed: ' + e.message, kind: 'err' }); unavailable.push('tavily'); }
    } else { unavailable.push('web_search'); events.push({ who: 'system', text: 'No search tool connected — answering without live sources', kind: 'err' }); }
  }
  const wantsJson = /json/i.test(t.expected_output || '') || /return json/i.test(inputText);
  const system = [a.instructions, `Role: ${a.role} (${a.name}, ${a.department}).`,
    use.length ? 'Skills to apply:\n' + use.map(s => `### ${skills[s].name}\n${skills[s].body}`).join('\n\n') : '',
    'Relevant Joroots knowledge:\n' + kn.map(k => `### ${k.title} [${k.confidence || 'n/a'}]\n${k.body}`).join('\n\n'),
    !nativeSearch && t.web_search ? 'You have no live search tool on this run. Use only the evidence provided and the knowledge base. Never invent a source or a URL.' : '',
    `Task contract: objective=${t.objective}; expected_output=${t.expected_output || 'as instructed'}; success_criteria=${t.success_criteria || 'Joroots voice rules'}`,
    t.extra_system || ''].filter(Boolean).join('\n\n');
  const attempts: { provider: string; error: string }[] = [];
  for (let i = 0; i < chain.length; i++) {
    const p = chain[i];
    for (let retry = 0; retry < 2; retry++) {
      try {
        const r = await p.call({ keys: t.keys, system, content, maxTokens: t.max_tokens || 2000, temperature: a.model?.temperature, jsonMode: wantsJson, webSearch: nativeSearch, mcpServers });
        await logsRepo.append({ task_id: t.task_id, agent: a.id, provider: r.provider, model: r.model, ms: r.ms, tools: r.tools.map(x => x.tool), usage: r.usage, attempts: attempts.length, ok: true });
        return { ...r, sources: sources.concat(r.sources), events: events.concat(r.events), attempts, agent: a.id, agentName: a.name, skills_used: use, knowledge_used: kn.map(k => k.id), unavailable_connectors: [...new Set(unavailable)], task_id: t.task_id };
      } catch (e: any) {
        const msg = e.message || String(e);
        if (isRetryable(msg) && retry === 0) { events.push({ who: 'system', text: `${p.name} rate-limited — retrying`, kind: 'err' }); await sleep(1500); continue; }
        attempts.push({ provider: p.id, error: msg });
        events.push({ who: 'system', text: `${p.name} failed: ${msg.slice(0, 120)}${i < chain.length - 1 ? ' — switching to ' + chain[i + 1].name : ''}`, kind: 'err' });
        break;
      }
    }
  }
  await logsRepo.append({ task_id: t.task_id, agent: a.id, ok: false, attempts });
  throw new Error('All providers failed. ' + attempts.map(x => x.provider + ': ' + x.error).join(' | '));
}
