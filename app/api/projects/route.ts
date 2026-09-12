import { NextResponse } from 'next/server'; import { projectsRepo, persistent } from '../../../lib/repo/store';
export const dynamic = 'force-dynamic';
export async function GET() { return NextResponse.json({ projects: await projectsRepo.list(), persistent: persistent() }); }
export async function POST(req: Request) { const b = await req.json(); if (b.action === 'clear') { await projectsRepo.clear(); return NextResponse.json({ ok: true }); } if (!b.project?.id) return NextResponse.json({ error: 'project.id required' }, { status: 400 }); await projectsRepo.save(b.project); return NextResponse.json({ ok: true, persistent: persistent() }); }
