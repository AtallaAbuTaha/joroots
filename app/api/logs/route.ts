import { NextResponse } from 'next/server'; import { logsRepo, persistent } from '../../../lib/repo/store';
export const dynamic = 'force-dynamic';
export async function GET() { return NextResponse.json({ logs: await logsRepo.list(), persistent: persistent() }); }
