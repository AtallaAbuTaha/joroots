// Repository layer: Upstash REST when configured, in-memory otherwise. Swap for Postgres later without touching agents.
const mem = new Map<string, any>();
export const persistent = () => !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
async function kv(cmd: any[]) { const r = await fetch(process.env.KV_REST_API_URL!, { method: 'POST', headers: { authorization: 'Bearer ' + process.env.KV_REST_API_TOKEN, 'content-type': 'application/json' }, body: JSON.stringify(cmd) }); const d = await r.json(); if (d.error) throw new Error(d.error); return d.result; }
export const store = {
  async get<T>(key: string): Promise<T | null> { if (persistent()) { const v = await kv(['GET', key]); return v ? JSON.parse(v) : null; } return mem.get(key) ?? null; },
  async set(key: string, val: any) { if (persistent()) await kv(['SET', key, JSON.stringify(val)]); else mem.set(key, val); },
  async del(key: string) { if (persistent()) await kv(['DEL', key]); else mem.delete(key); },
};
export const projectsRepo = {
  async list() { return (await store.get<any[]>('projects')) || []; },
  async save(p: any) { const all = await this.list(); const i = all.findIndex(x => x.id === p.id); if (i >= 0) all[i] = p; else all.unshift(p); await store.set('projects', all.slice(0, 200)); return p; },
  async clear() { await store.del('projects'); },
};
export const configRepo = {
  async overrides() { return (await store.get<any>('config-overrides')) || { agents: {}, customAgents: [], departments: [] }; },
  async saveOverrides(o: any) { await store.set('config-overrides', o); },
};
export const logsRepo = {
  async append(e: any) { const all = (await store.get<any[]>('logs')) || []; all.unshift({ ...e, at: Date.now() }); await store.set('logs', all.slice(0, 500)); },
  async list() { return (await store.get<any[]>('logs')) || []; },
};
