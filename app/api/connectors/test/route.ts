import { NextResponse } from 'next/server'; import { testConnector } from '../../../../lib/connectors/test';
import { effectiveKeys } from '../../../../lib/keys';
export const maxDuration = 60; export const dynamic = 'force-dynamic';
export async function POST(req: Request) {
  const b = await req.json();
  return NextResponse.json({ id: b.id, ...(await testConnector(b.id, await effectiveKeys(b.keys))), last_tested: Date.now() });
}
