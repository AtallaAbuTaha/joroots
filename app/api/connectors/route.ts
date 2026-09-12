import { NextResponse } from 'next/server'; import { registryView } from '../../../lib/connectors/registry';
export const dynamic = 'force-dynamic';
export async function GET() { return NextResponse.json({ connectors: registryView() }); }
