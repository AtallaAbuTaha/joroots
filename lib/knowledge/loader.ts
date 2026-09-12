import fs from 'fs'; import path from 'path';
export type KnowledgeItem = { id: string; title: string; category: string; source?: string; client?: string; tags: string[]; confidence?: string; visibility?: string; body: string };
function parse(file: string, cat: string): KnowledgeItem {
  const raw = fs.readFileSync(file, 'utf8'); const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const meta: any = {}; if (m) m[1].split('\n').forEach(l => { const i = l.indexOf(':'); if (i > 0) { const k = l.slice(0, i).trim(); const v = l.slice(i + 1).trim(); try { meta[k] = JSON.parse(v); } catch { meta[k] = v; } } });
  return { id: cat + '/' + path.basename(file, '.md'), title: meta.title || path.basename(file), category: meta.category || cat, source: meta.source, client: meta.client, tags: meta.tags || [], confidence: meta.confidence, visibility: meta.visibility, body: m ? m[2].trim() : raw };
}
let cache: KnowledgeItem[] | null = null;
export function allKnowledge(): KnowledgeItem[] {
  if (cache) return cache; const root = path.join(process.cwd(), 'knowledge'); const out: KnowledgeItem[] = [];
  for (const cat of fs.readdirSync(root)) { const d = path.join(root, cat); if (!fs.statSync(d).isDirectory()) continue; for (const f of fs.readdirSync(d)) if (f.endsWith('.md')) out.push(parse(path.join(d, f), cat)); }
  return (cache = out);
}
// Retrieval: category allowlist from the agent + keyword/tag scoring from the task. Voice rules always included.
export function retrieve(categories: string[], query: string, limit = 6): KnowledgeItem[] {
  const words = (query.toLowerCase().match(/[a-z][a-z0-9-]{2,}/g) || []); const items = allKnowledge();
  const scored = items.filter(k => categories.includes(k.category) || k.id === 'brand/voice').map(k => {
    const hay = (k.title + ' ' + k.tags.join(' ') + ' ' + k.body.slice(0, 600)).toLowerCase();
    let s = k.id === 'brand/voice' ? 100 : k.category === 'company' ? 3 : 0; words.forEach(w => { if (k.tags.includes(w)) s += 4; if (hay.includes(w)) s += 1; }); return { k, s };
  }).sort((a, b) => b.s - a.s);
  return scored.slice(0, limit).map(x => x.k);
}
export const knowledgeIndex = () => allKnowledge().map(({ body, ...m }) => ({ ...m, chars: body.length }));
