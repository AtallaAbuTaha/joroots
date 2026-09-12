import { getConnector, connectorStatus, mcpServersFor } from './registry';
import { byId, getProvider } from '../providers';
export async function testConnector(id: string): Promise<{ ok: boolean; message: string }> {
  const c = getConnector(id); if (!c) return { ok: false, message: 'Unknown connector' };
  const s = connectorStatus(c); if (s.status !== 'CONNECTED') return { ok: false, message: 'Missing: ' + s.missing.join(', ') };
  try {
    if (c.kind === 'model' || c.id === 'web_search') {
      const p = byId(c.id === 'web_search' ? 'anthropic' : c.id); if (!p) return { ok: false, message: 'No adapter' };
      const r = await p.call({ system: 'Reply with the single word OK.', content: [{ type: 'text', text: 'ping' }], maxTokens: 8 });
      return { ok: /ok/i.test(r.text), message: r.model + ' replied in ' + r.ms + 'ms' };
    }
    if (c.id === 'tavily') { const { tavilySearch } = await import('../search'); const r = await tavilySearch('Joroots Amman', 2); return { ok: r.hits.length > 0, message: r.hits.length + ' results — search is live' }; }
    if (c.kind === 'storage') { const r = await fetch(process.env.KV_REST_API_URL + '/ping', { headers: { authorization: 'Bearer ' + process.env.KV_REST_API_TOKEN } }); return { ok: r.ok, message: r.ok ? 'Upstash reachable' : 'HTTP ' + r.status }; }
    if (c.kind === 'mcp') { const p = getProvider('anthropic', undefined, true); const r = await p.call({ system: 'List the names of the tools available to you, comma separated. Do not call any tool.', content: [{ type: 'text', text: 'list tools' }], maxTokens: 200, mcpServers: mcpServersFor([id]) }); return { ok: true, message: r.text.slice(0, 200) }; }
    if (c.id === 'github') { const r = await fetch('https://api.github.com/repos/' + process.env.GITHUB_REPO, { headers: { authorization: 'Bearer ' + process.env.GITHUB_TOKEN, 'user-agent': 'joroots-workforce' } }); return { ok: r.ok, message: r.ok ? 'Repo reachable' : 'HTTP ' + r.status }; }
    return { ok: true, message: 'Configured' };
  } catch (e: any) { return { ok: false, message: e.message }; }
}
