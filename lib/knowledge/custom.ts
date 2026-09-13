import { store } from '../repo/store'; import type { KnowledgeItem } from './loader';
// Knowledge added from the app. Repo files stay the canonical base; these are layered on top at retrieval.
export const knowledgeRepo = {
  async list(): Promise<KnowledgeItem[]> { return (await store.get<KnowledgeItem[]>('knowledge-custom')) || []; },
  async save(item: Omit<KnowledgeItem, 'id'> & { id?: string }) {
    const all = await this.list(); const id = item.id || ('custom/' + item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).slice(2, 6));
    const rec: KnowledgeItem = { ...item, id, tags: item.tags || [] } as KnowledgeItem;
    const i = all.findIndex(x => x.id === id); if (i >= 0) all[i] = rec; else all.unshift(rec);
    await store.set('knowledge-custom', all.slice(0, 500)); return rec;
  },
  async remove(id: string) { const all = await this.list(); await store.set('knowledge-custom', all.filter(x => x.id !== id)); },
};
