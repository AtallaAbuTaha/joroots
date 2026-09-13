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
  const headers = { authorization: authHeader(opts.keys), 'content-type': 'application/json', accept: 'application/json' };
  // Higgsfield's docs disagree on the accepted body, and a rejected body returns 422 with the reason inside.
  // So: try the richer body, then fall back to the documented minimal one, and always surface their message.
  const bodies: any[] = [
    { prompt, aspect_ratio: opts.aspect_ratio || '4:5', resolution: process.env.HIGGSFIELD_RESOLUTION || '1080p' },
    { prompt, aspect_ratio: opts.aspect_ratio || '4:5' },
    { prompt },
    { params: { prompt, width_and_height: process.env.HIGGSFIELD_SIZE || '1152x2048', quality: '1080p', enhance_prompt: false, batch_size: 1 } },
  ];
  let body: any = null, detail = '';
  for (const attempt of bodies) {
    const r = await fetch(`${BASE}/${MODEL}`, { method: 'POST', headers, body: JSON.stringify(attempt) });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.request_id) { body = j; break; }
    // Keep the most informative message Higgsfield gave us (FastAPI-style detail arrays included).
    const msg = typeof j.detail === 'string' ? j.detail
      : Array.isArray(j.detail) ? j.detail.map((d: any) => (d.loc ? d.loc.join('.') + ': ' : '') + (d.msg || JSON.stringify(d))).join('; ')
      : j.message || j.error || JSON.stringify(j).slice(0, 300);
    detail = `HTTP ${r.status} — ${msg}`;
    if (r.status === 401 || r.status === 403) break; // auth problem: no point trying other shapes
  }
  if (!body) throw new Error('Higgsfield rejected the request. ' + detail + ' (model: ' + MODEL + ')');
  const id = body.request_id; const statusUrl = body.status_url || `${BASE}/requests/${id}/status`;
  let delay = 2000;
  while (Date.now() - started < budget) {
    await new Promise(r => setTimeout(r, delay)); delay = Math.min(delay * 1.4, 6000);
    const st = await fetch(statusUrl, { headers: { authorization: authHeader(opts.keys), accept: 'application/json' } });
    const d = await st.json().catch(() => ({}));
    const urls = (d.images || d.results || []).map((x: any) => x?.url || x?.image_url || x).filter((u: any) => typeof u === 'string');
    if (d.status === 'completed' || (urls.length && d.status !== 'queued')) return { images: urls, status: 'completed', request_id: id, ms: Date.now() - started, model: MODEL };
    if (['failed', 'nsfw', 'canceled'].includes(d.status)) return { images: [], status: d.status, request_id: id, error: d.message || d.detail || ('generation ' + d.status), ms: Date.now() - started, model: MODEL };
  }
  return { images: [], status: 'in_progress', request_id: id, error: 'still generating after ' + Math.round(budget / 1000) + 's', ms: Date.now() - started, model: MODEL };
}
export async function checkImage(requestId: string, keys?: Record<string, string>): Promise<ImageResult> {
  const st = await fetch(`${BASE}/requests/${requestId}/status`, { headers: { authorization: authHeader(keys), accept: 'application/json' } });
  const d = await st.json().catch(() => ({}));
  if (!st.ok) throw new Error('Higgsfield status failed: HTTP ' + st.status + ' — ' + (d.detail || d.message || ''));
  const urls = (d.images || d.results || []).map((x: any) => x?.url || x?.image_url || x).filter((u: any) => typeof u === 'string');
  return { images: urls, status: d.status, request_id: requestId, error: d.message || d.detail, ms: 0, model: MODEL };
}
