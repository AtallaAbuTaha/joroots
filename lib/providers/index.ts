import { anthropic } from './anthropic';
import { groq, gemini, openrouter, mistral, deepseek, openai } from './openai-compat';
import { ModelProvider } from './types';
export const PROVIDERS: ModelProvider[] = [groq, gemini, anthropic, openrouter, mistral, deepseek, openai];
export const byId = (id: string) => PROVIDERS.find(p => p.id === id);
// Default order puts the free-and-private tier first, then quality, then breadth. Override with PROVIDER_CHAIN.
const DEFAULT_CHAIN = ['groq', 'gemini', 'anthropic', 'openrouter', 'mistral', 'deepseek', 'openai'];
export const chainOrder = () => (process.env.PROVIDER_CHAIN || '').split(',').map(s => s.trim()).filter(Boolean).concat(DEFAULT_CHAIN).filter((v, i, a) => a.indexOf(v) === i);
/** Ordered list of providers to try. needsMcp restricts to providers that can carry MCP tools (Anthropic only). */
export function resolveChain(preferred?: string, fallback?: string, needsMcp = false): ModelProvider[] {
  const wanted = [preferred, fallback].filter(Boolean).filter(x => x !== 'auto') as string[];
  const ids = wanted.concat(chainOrder()).filter((v, i, a) => a.indexOf(v) === i);
  let list = ids.map(byId).filter(Boolean).filter(p => p!.available()) as ModelProvider[];
  if (needsMcp) list = list.filter(p => p.supportsMcp);
  if (!list.length) {
    if (needsMcp) throw new Error('Connector tools need the Anthropic provider (MCP is carried by the Anthropic API). Add ANTHROPIC_API_KEY, or run this task without connector tools.');
    throw new Error('No model provider configured. Add one key in Vercel → Settings → Environment Variables: GROQ_API_KEY (free), GEMINI_API_KEY, ANTHROPIC_API_KEY, OPENROUTER_API_KEY or MISTRAL_API_KEY.');
  }
  return list;
}
export const providerStatus = () => PROVIDERS.map(p => ({ id: p.id, name: p.name, available: p.available(), mcp: !!p.supportsMcp, nativeSearch: !!p.supportsNativeSearch }));
export const getProvider = (preferred: string, fallback?: string, needsMcp = false) => resolveChain(preferred, fallback, needsMcp)[0];
