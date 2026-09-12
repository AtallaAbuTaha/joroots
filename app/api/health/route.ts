import { NextResponse } from 'next/server'; import { providerStatus } from '../../../lib/providers'; import { persistent } from '../../../lib/repo/store'; import { registryView } from '../../../lib/connectors/registry';
export const dynamic = 'force-dynamic';
export async function GET() { const reg = registryView(); return NextResponse.json({ ok: true, version: '0.1.0', providers: providerStatus(), persistent: persistent(), connected: reg.filter(c => c.status === 'CONNECTED').map(c => c.id), missing: reg.filter(c => c.status !== 'CONNECTED').map(c => c.id) }); }
