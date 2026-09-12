import { NextResponse } from 'next/server';
import { generateImage, checkImage, higgsfieldReady } from '../../../lib/media/higgsfield';
export const maxDuration = 60; export const dynamic = 'force-dynamic';
const pick = (k: any) => { const o: Record<string, string> = {}; for (const n of ['HIGGSFIELD_API_KEY_ID', 'HIGGSFIELD_API_KEY_SECRET']) if (k && typeof k[n] === 'string' && k[n].trim()) o[n] = k[n].trim(); return o; };
export async function POST(req: Request) {
  try {
    const b = await req.json(); const keys = pick(b.keys);
    if (!higgsfieldReady(keys)) return NextResponse.json({ error: 'Higgsfield is not connected. Add HIGGSFIELD_API_KEY_ID and HIGGSFIELD_API_KEY_SECRET in the Keys panel or in Vercel.' }, { status: 400 });
    if (b.request_id) return NextResponse.json(await checkImage(b.request_id, keys));
    if (!b.prompt) return NextResponse.json({ error: 'prompt required' }, { status: 400 });
    return NextResponse.json(await generateImage(b.prompt, { aspect_ratio: b.aspect_ratio, keys }));
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
