import { NextResponse } from 'next/server'; import { testConnector } from '../../../../lib/connectors/test';
export const maxDuration = 60; export const dynamic = 'force-dynamic';
export async function POST(req: Request) { const { id } = await req.json(); return NextResponse.json({ id, ...(await testConnector(id)), last_tested: Date.now() }); }
