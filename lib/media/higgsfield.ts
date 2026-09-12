// Direct Higgsfield REST API — no MCP, no Anthropic needed.
// Docs: POST https://api.higgsfield.ai/{model_id} with Authorization: Key {id}:{secret}, then poll /requests/{id}/status.
const BASE = 'https://api.higgsfield.ai';
const MODEL = process.env.HIGGSFIELD_MODEL || 'higgsfield-ai/soul/v2/standard';
export const higgsfieldReady = (keys?: Record<string, string>) =>
  !!((keys?.HIGGSFIELD_API_KEY_ID || process.env.HIGGSFIELD_API_KEY_ID) && (keys?.HIGGSFIELD_API_KEY_SECRET || process.env.HIGGSFIELD_API_KEY_SECRET));
const authHeader = (keys?: Record<string, string>) =>
  'Key ' + (keys?.HIGGSFIELD_API_KEY_ID || process.env.HIGGSFIELD_API_KEY_ID) + ':' + (keys?.HIGGSFIELD_API_KEY_SECRET || process.env.HIGGSFIELD_API_KEY_SECRET);
export type ImageResult = { images: string[]; status: string; request_id?: string; error?: string; ms: number; model: string };
/** Submit a prompt and poll until terminal. Vercel Hobby caps a function at 60s, so budget stays under that. */
export async function generateImage(prompt: string, opts: { aspect_ratio?: string; keys?: Record<string, string>; budgetMs?: number } = {}): Promise<ImageResult> {
  const started = Date.now(); const budget = opts.budgetMs ?? 45000;
  const headers = { authorization: authHeader(opts.keys), 'content-type': 'application/json' };
  const sub = await fetch(`${BASE}/${MODEL}`, { method: 'POST', headers, body: JSON.stringify({ prompt, aspect_ratio: opts.aspect_ratio || '4:5' }) });
  const body = await sub.json().catch(() => ({}));
  if (!sub.ok) throw new Error('Higgsfield submit failed: ' + (body.message || body.error || 'HTTP ' + sub.status));
  const id = body.request_id; const statusUrl = body.status_url || `${BASE}/requests/${id}/status`;
  if (!id) throw new Error('Higgsfield returned no request_id');
  let delay = 2000;
  while (Date.now() - started < budget) {
    await new Promise(r => setTimeout(r, delay)); delay = Math.min(delay * 1.4, 6000);
    const st = await fetch(statusUrl, { headers: { authorization: authHeader(opts.keys) } });
    const d = await st.json().catch(() => ({}));
    if (d.status === 'completed') return { images: (d.images || []).map((x: any) => x.url).filter(Boolean), status: 'completed', request_id: id, ms: Date.now() - started, model: MODEL };
    if (['failed', 'nsfw', 'canceled'].includes(d.status)) return { images: [], status: d.status, request_id: id, error: d.message || ('generation ' + d.status), ms: Date.now() - started, model: MODEL };
  }
  // Still running when the budget ran out — hand back the id so the UI can resume instead of losing the job.
  return { images: [], status: 'in_progress', request_id: id, error: 'still generating after ' + Math.round(budget / 1000) + 's', ms: Date.now() - started, model: MODEL };
}
export async function checkImage(requestId: string, keys?: Record<string, string>): Promise<ImageResult> {
  const st = await fetch(`${BASE}/requests/${requestId}/status`, { headers: { authorization: authHeader(keys) } });
  const d = await st.json().catch(() => ({}));
  if (!st.ok) throw new Error('Higgsfield status failed: HTTP ' + st.status);
  return { images: (d.images || []).map((x: any) => x.url).filter(Boolean), status: d.status, request_id: requestId, error: d.message, ms: 0, model: MODEL };
}
