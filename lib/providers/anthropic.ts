import { ModelProvider, ModelCall, NormalizedResult, extractJSON } from './types';
export const anthropic: ModelProvider = {
  id: 'anthropic', name: 'Anthropic (Claude)', supportsMcp: true, supportsNativeSearch: true,
  available: (keys) => !!(keys?.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY),
  async call(c: ModelCall): Promise<NormalizedResult> {
    const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';
    const started = Date.now();
    const body: any = { model, max_tokens: c.maxTokens || 2000, system: c.system, messages: [{ role: 'user', content: c.content }] };
    if (typeof c.temperature === 'number') body.temperature = c.temperature;
    if (c.webSearch) body.tools = [{ type: 'web_search_20250305', name: 'web_search', max_uses: 4 }];
    const apiKey = c.keys?.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('Anthropic: no key');
    const headers: any = { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' };
    if (c.mcpServers?.length) { body.mcp_servers = c.mcpServers; headers['anthropic-beta'] = 'mcp-client-2025-04-04'; }
    const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers, body: JSON.stringify(body) });
    const data = await r.json();
    if (!r.ok || data.error) throw new Error(data.error?.message || 'Anthropic HTTP ' + r.status);
    const out: NormalizedResult = { text: '', json: null, sources: [], tools: [], images: [], toolResults: [], events: [], ms: 0, provider: 'anthropic', model, usage: data.usage };
    const seen = new Set<string>(); const add = (u: string, t?: string) => { if (u && !seen.has(u)) { seen.add(u); out.sources.push({ url: u, title: t || u }); } };
    for (const b of data.content || []) {
      if (b.type === 'text') { out.text += b.text; (b.citations || []).forEach((x: any) => add(x.url, x.title)); }
      if (b.type === 'server_tool_use') { out.tools.push({ tool: 'web_search', input: b.input }); out.events.push({ who: 'tool', text: 'Searching: ' + (b.input?.query || ''), kind: 'tool' }); }
      if (b.type === 'web_search_tool_result') (Array.isArray(b.content) ? b.content : []).forEach((x: any) => add(x.url, x.title));
      if (b.type === 'mcp_tool_use') { out.tools.push({ tool: b.name, input: b.input }); out.events.push({ who: 'tool', text: 'Tool: ' + b.name, kind: 'tool' }); }
      if (b.type === 'mcp_tool_result') {
        const txt = (b.content || []).map((x: any) => x.text || JSON.stringify(x)).join('\n');
        (txt.match(/https?:\/\/[^\s"'<>)\]\\]+/g) || []).forEach((u: string) => { u = u.replace(/[",}]+$/, ''); if (/\.(png|jpe?g|webp|gif)(\?|$)/i.test(u) || /higgsfield|cdn|storage|image|media|result/i.test(u)) out.images.push(u); });
        out.toolResults.push(txt); out.events.push({ who: 'tool', text: 'Tool result: ' + txt.replace(/\s+/g, ' ').slice(0, 160), kind: 'tool' });
      }
    }
    out.json = extractJSON(out.text); out.ms = Date.now() - started; return out;
  }
};
