import crypto from 'crypto';
import { store, persistent } from './repo/store';
// Keys saved through the UI are stored server-side (Upstash KV), encrypted at rest, and apply to every
// agent and every user without a redeploy. Precedence at call time: browser key > server key > env var.
export const ALLOWED_KEYS = ['GROQ_API_KEY','GEMINI_API_KEY','ANTHROPIC_API_KEY','OPENROUTER_API_KEY','MISTRAL_API_KEY','DEEPSEEK_API_KEY','OPENAI_API_KEY','TAVILY_API_KEY','HIGGSFIELD_API_KEY_ID','HIGGSFIELD_API_KEY_SECRET','CANVA_MCP_TOKEN','SLACK_MCP_TOKEN','GMAIL_MCP_TOKEN','GDRIVE_MCP_TOKEN'];
export const sanitizeKeys = (k: any): Record<string, string> => {
  const out: Record<string, string> = {}; if (!k || typeof k !== 'object') return out;
  for (const n of ALLOWED_KEYS) if (typeof k[n] === 'string' && k[n].trim()) out[n] = k[n].trim();
  return out;
};
// Encryption secret: a dedicated APP_SECRET if set, else the KV token (already a server-only secret).
// Without either we refuse to store — a plaintext secret at rest is worse than no feature.
const secretSource = () => process.env.APP_SECRET || process.env.KV_REST_API_TOKEN || null;
export const canStoreServerKeys = () => persistent() && !!secretSource();
const cipherKey = () => crypto.scryptSync(secretSource()!, 'joroots-workforce-keys', 32);
function encrypt(text: string) {
  const iv = crypto.randomBytes(12); const c = crypto.createCipheriv('aes-256-gcm', cipherKey(), iv);
  const enc = Buffer.concat([c.update(text, 'utf8'), c.final()]);
  return [iv.toString('base64'), c.getAuthTag().toString('base64'), enc.toString('base64')].join('.');
}
function decrypt(blob: string) {
  const [iv, tag, data] = blob.split('.');
  const d = crypto.createDecipheriv('aes-256-gcm', cipherKey(), Buffer.from(iv, 'base64'));
  d.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([d.update(Buffer.from(data, 'base64')), d.final()]).toString('utf8');
}
export async function getServerKeys(): Promise<Record<string, string>> {
  if (!canStoreServerKeys()) return {};
  try { const blob = await store.get<string>('server-keys'); return blob ? sanitizeKeys(JSON.parse(decrypt(blob))) : {}; }
  catch { return {}; } // wrong secret or corrupt blob — behave as if unset rather than crashing a task
}
export async function saveServerKeys(partial: Record<string, string>) {
  if (!canStoreServerKeys()) throw new Error('Server key storage needs Upstash KV. Add KV_REST_API_URL and KV_REST_API_TOKEN in Vercel, then redeploy.');
  const merged = { ...(await getServerKeys()), ...sanitizeKeys(partial) };
  await store.set('server-keys', encrypt(JSON.stringify(merged)));
  return Object.keys(merged);
}
export async function deleteServerKey(name: string) {
  if (!canStoreServerKeys()) throw new Error('Server key storage is not configured.');
  const cur = await getServerKeys(); delete cur[name];
  await store.set('server-keys', encrypt(JSON.stringify(cur)));
  return Object.keys(cur);
}
export const serverKeyNames = async () => Object.keys(await getServerKeys());
/** Effective keys for one request: browser overrides server, server overrides env (env is read by adapters). */
export async function effectiveKeys(requestKeys: any): Promise<Record<string, string>> {
  return { ...(await getServerKeys()), ...sanitizeKeys(requestKeys) };
}
