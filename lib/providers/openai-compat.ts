import { ModelProvider, ModelCall, NormalizedResult, extractJSON } from './types';
// One adapter for every OpenAI-shaped provider: Groq, Gemini (OpenAI shim), OpenRouter, Mistral, DeepSeek, OpenAI.
// Verified shape: POST {baseUrl}/chat/completions with { model, messages, max_tokens }.
type Spec = { id: string; name: string; baseUrl: string; keyEnv: string; modelEnv: string; defaultModel: string; jsonMode?: boolean; headers?: () => Record<string, string> };
export function openaiCompat(s: Spec): ModelProvider {
  return {
    id: s.id, name: s.name, supportsMcp: false, supportsNativeSearch: false,
    available: () => !!process.env[s.keyEnv],
    async call(c: ModelCall): Promise<NormalizedResult> {
      const model = process.env[s.modelEnv] || s.defaultModel; const started = Date.now();
      const parts: any[] = []; const skipped: string[] = [];
      for (const b of c.content as any[]) {
        if (b.type === 'text') parts.push({ type: 'text', text: b.text });
        else if (b.type === 'image' && b.source?.data) parts.push({ type: 'image_url', image_url: { url: `data:${b.source.media_type};base64,${b.source.data}` } });
        else skipped.push(b.type);
      }
      if (skipped.length) parts.push({ type: 'text', text: `[Note: ${skipped.join(', ')} attachment(s) were not sent — this provider accepts text and images only.]` });
      const body: any = { model, max_tokens: c.maxTokens || 2000, messages: [{ role: 'system', content: c.system }, { role: 'user', content: parts.length === 1 && parts[0].type === 'text' ? parts[0].text : parts }] };
      if (typeof c.temperature === 'number') body.temperature = c.temperature;
      if (c.jsonMode && s.jsonMode !== false) body.response_format = { type: 'json_object' };
      const headers = { 'content-type': 'application/json', authorization: 'Bearer ' + process.env[s.keyEnv], ...(s.headers ? s.headers() : {}) };
      const post = async (payload: any) => {
        const r = await fetch(s.baseUrl.replace(/\/$/, '') + '/chat/completions', { method: 'POST', headers, body: JSON.stringify(payload) });
        const d = await r.json().catch(() => ({}));
        if (!r.ok || d.error) { const e: any = new Error(d.error?.message || d.message || `${s.name} HTTP ${r.status}`); e.status = r.status; throw e; }
        return d;
      };
      let data: any; const events: any[] = [];
      try { data = await post(body); }
      catch (e: any) {
        // Some providers (notably OpenRouter routes) reject response_format — retry once without it.
        if (body.response_format && /response_format|json_object|unsupported|invalid/i.test(e.message)) {
          delete body.response_format; events.push({ who: 'system', text: s.name + ' does not accept JSON mode — retried in plain mode', kind: 'info' });
          body.messages[0].content += '\n\nRespond with valid JSON only. No prose, no code fences.';
          data = await post(body);
        } else throw e;
      }
      const text = data.choices?.[0]?.message?.content || '';
      return { text, json: extractJSON(text), sources: [], tools: [], images: [], toolResults: [], events, ms: Date.now() - started, provider: s.id, model: data.model || model, usage: data.usage };
    }
  };
}
// Base URLs, key names and default model IDs as documented by each provider (Sept 2026). Override any model with its env var.
export const groq = openaiCompat({ id: 'groq', name: 'Groq', baseUrl: 'https://api.groq.com/openai/v1', keyEnv: 'GROQ_API_KEY', modelEnv: 'GROQ_MODEL', defaultModel: 'openai/gpt-oss-120b' });
export const gemini = openaiCompat({ id: 'gemini', name: 'Google Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', keyEnv: 'GEMINI_API_KEY', modelEnv: 'GEMINI_MODEL', defaultModel: 'gemini-2.5-flash' });
export const openrouter = openaiCompat({ id: 'openrouter', name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', keyEnv: 'OPENROUTER_API_KEY', modelEnv: 'OPENROUTER_MODEL', defaultModel: 'deepseek/deepseek-r1:free', headers: () => ({ 'HTTP-Referer': 'https://joroots-workforce.vercel.app', 'X-Title': 'Joroots Workforce' }) });
export const mistral = openaiCompat({ id: 'mistral', name: 'Mistral', baseUrl: 'https://api.mistral.ai/v1', keyEnv: 'MISTRAL_API_KEY', modelEnv: 'MISTRAL_MODEL', defaultModel: 'mistral-small-latest' });
export const deepseek = openaiCompat({ id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', keyEnv: 'DEEPSEEK_API_KEY', modelEnv: 'DEEPSEEK_MODEL', defaultModel: 'deepseek-chat' });
export const openai = openaiCompat({ id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', keyEnv: 'OPENAI_API_KEY', modelEnv: 'OPENAI_MODEL', defaultModel: 'gpt-4o-mini' });
