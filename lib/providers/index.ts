import { anthropic } from './anthropic'; import { openai } from './openai'; import { ModelProvider } from './types';
const providers: Record<string, ModelProvider> = { anthropic, openai };
export function getProvider(preferred: string, fallback?: string, needsAnthropicTools = false): ModelProvider {
  if (needsAnthropicTools && anthropic.available()) return anthropic;
  const p = providers[preferred]; if (p?.available()) return p;
  const f = fallback ? providers[fallback] : null; if (f?.available()) return f;
  const any = Object.values(providers).find(x => x.available()); if (any) return any;
  throw new Error('No model provider configured. Add ANTHROPIC_API_KEY (or OPENAI_API_KEY) in Vercel → Settings → Environment Variables.');
}
export const providerStatus = () => Object.values(providers).map(p => ({ id: p.id, available: p.available() }));
