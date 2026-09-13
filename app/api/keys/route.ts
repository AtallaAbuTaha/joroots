import { NextResponse } from 'next/server';
import { saveServerKeys, deleteServerKey, serverKeyNames, canStoreServerKeys, ALLOWED_KEYS } from '../../../lib/keys';
export const dynamic = 'force-dynamic';
// The deployment sits behind Vercel Authentication. If APP_PASSWORD is set, it is additionally required here.
function guard(req: Request) {
  const pw = process.env.APP_PASSWORD; if (!pw) return null;
  if (req.headers.get('x-app-password') !== pw) return NextResponse.json({ error: 'APP_PASSWORD required' }, { status: 401 });
  return null;
}
export async function GET() {
  return NextResponse.json({ available: canStoreServerKeys(), names: await serverKeyNames(), allowed: ALLOWED_KEYS, protected: !!process.env.APP_PASSWORD });
}
export async function POST(req: Request) {
  const g = guard(req); if (g) return g;
  try { const b = await req.json(); const names = await saveServerKeys(b.keys || {}); return NextResponse.json({ ok: true, names }); }
  catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
export async function DELETE(req: Request) {
  const g = guard(req); if (g) return g;
  try { const b = await req.json(); const names = await deleteServerKey(b.name); return NextResponse.json({ ok: true, names }); }
  catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
