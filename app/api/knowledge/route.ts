import { NextResponse } from 'next/server'; import { knowledgeRepo } from '../../../lib/knowledge/custom'; import { allKnowledge } from '../../../lib/knowledge/loader';
export const dynamic = 'force-dynamic';
export async function GET() { return NextResponse.json({ items: allKnowledge().concat(await knowledgeRepo.list()) }); }
export async function POST(req: Request) {
  const b = await req.json();
  if (!b.title || !b.body || !b.category) return NextResponse.json({ error: 'title, category and body are required' }, { status: 400 });
  const rec = await knowledgeRepo.save({ id: b.id, title: String(b.title).slice(0, 140), category: String(b.category).toLowerCase().replace(/[^a-z-]/g, ''), body: String(b.body).slice(0, 12000), tags: String(b.tags || '').split(',').map((x: string) => x.trim().toLowerCase()).filter(Boolean), source: b.source || 'added in app', client: b.client || undefined, confidence: b.confidence || 'stated', visibility: 'internal' });
  return NextResponse.json({ ok: true, item: rec });
}
export async function DELETE(req: Request) { const b = await req.json(); if (!String(b.id || '').startsWith('custom/')) return NextResponse.json({ error: 'only app-added items can be removed here' }, { status: 400 }); await knowledgeRepo.remove(b.id); return NextResponse.json({ ok: true }); }
