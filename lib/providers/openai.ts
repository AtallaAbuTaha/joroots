import { ModelProvider, ModelCall, NormalizedResult, extractJSON } from './types';
// Text-only adapter. Web search and MCP tools are Anthropic-side; agents needing them are routed to anthropic.
export const openai: ModelProvider = {
  id: 'openai',
  available: () => !!process.env.OPENAI_API_KEY,
  async call(c: ModelCall): Promise<NormalizedResult> {
    const model = process.env.OPENAI_MODEL || 'gpt-4o'; const started = Date.now();
    const userText = c.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n');
    const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + process.env.OPENAI_API_KEY }, body: JSON.stringify({ model, max_tokens: c.maxTokens || 2000, messages: [{ role: 'system', content: c.system }, { role: 'user', content: userText }] }) });
    const data = await r.json(); if (!r.ok || data.error) throw new Error(data.error?.message || 'OpenAI HTTP ' + r.status);
    const text = data.choices?.[0]?.message?.content || '';
    return { text, json: extractJSON(text), sources: [], tools: [], images: [], toolResults: [], events: [], ms: Date.now() - started, provider: 'openai', model, usage: data.usage };
  }
};
