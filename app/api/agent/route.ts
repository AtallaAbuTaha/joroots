import { NextResponse } from 'next/server'; import { runTask } from '../../../lib/agents/run';
import { effectiveKeys } from '../../../lib/keys';
export const maxDuration = 60; export const dynamic = 'force-dynamic';
export async function POST(req: Request) {
  try {
    const t = await req.json(); if (!t.assigned_agent || !t.input) return NextResponse.json({ error: 'assigned_agent and input required' }, { status: 400 });
    const r = await runTask({ ...t, keys: await effectiveKeys(t.keys) });
    return NextResponse.json(r);
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
