import fs from 'fs'; import path from 'path';
import { configRepo } from '../repo/store';
export type AgentDef = { id: string; name: string; department: string; role: string; status: string; model: { provider: string; model: string; fallback?: string; temperature?: number }; skills: string[]; tools: string[]; knowledge: string[]; permissions: any; instructions: string; doc: string; custom?: boolean };
export type Skill = { id: string; name: string; department: string; body: string; tool_requirements: string[] };
export const DEPARTMENTS = [{ id: 'operations', name: 'Operations' }, { id: 'research', name: 'Research' }, { id: 'marketing', name: 'Marketing' }];
function frontmatter(raw: string) { const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/); const meta: any = {}; if (m) m[1].split('\n').forEach(l => { const i = l.indexOf(':'); if (i > 0) { const v = l.slice(i + 1).trim(); try { meta[l.slice(0, i).trim()] = JSON.parse(v); } catch { meta[l.slice(0, i).trim()] = v; } } }); return { meta, body: m ? m[2] : raw }; }
export function loadSkills(): Record<string, Skill> {
  const root = path.join(process.cwd(), 'skills'); const out: Record<string, Skill> = {};
  for (const d of fs.readdirSync(root)) { const dir = path.join(root, d); if (!fs.statSync(dir).isDirectory()) continue; for (const f of fs.readdirSync(dir)) if (f.endsWith('.md')) { const { meta, body } = frontmatter(fs.readFileSync(path.join(dir, f), 'utf8')); out[meta.id] = { id: meta.id, name: meta.name, department: d, body: body.trim(), tool_requirements: meta.tool_requirements || [] }; } }
  return out;
}
function loadBaseAgents(): AgentDef[] {
  const root = path.join(process.cwd(), 'agents'); const out: AgentDef[] = [];
  for (const d of fs.readdirSync(root)) { const dir = path.join(root, d); if (!fs.existsSync(path.join(dir, 'config.json'))) continue;
    const cfg = JSON.parse(fs.readFileSync(path.join(dir, 'config.json'), 'utf8')); const doc = fs.readFileSync(path.join(dir, 'agent.md'), 'utf8');
    const instr = (doc.match(/## System instructions\n([\s\S]*?)\n## /) || [])[1] || ''; out.push({ ...cfg, instructions: instr.trim(), doc }); }
  return out;
}
export async function loadAgents(): Promise<AgentDef[]> {
  const o = await configRepo.overrides(); const base = loadBaseAgents().map(a => ({ ...a, ...(o.agents?.[a.id] || {}) }));
  return base.concat((o.customAgents || []).map((a: any) => ({ ...a, custom: true })));
}
export async function loadDepartments() { const o = await configRepo.overrides(); return DEPARTMENTS.concat(o.departments || []); }
export async function saveAgentOverride(id: string, patch: any) { const o = await configRepo.overrides(); const ci = (o.customAgents || []).findIndex((a: any) => a.id === id); if (ci >= 0) o.customAgents[ci] = { ...o.customAgents[ci], ...patch }; else o.agents[id] = { ...(o.agents[id] || {}), ...patch }; await configRepo.saveOverrides(o); }
export async function addCustomAgent(a: any) { const o = await configRepo.overrides(); o.customAgents = (o.customAgents || []).concat([a]); if (a.department && !DEPARTMENTS.concat(o.departments || []).find(d => d.id === a.department)) { o.departments = (o.departments || []).concat([{ id: a.department, name: a.department[0].toUpperCase() + a.department.slice(1) }]); } await configRepo.saveOverrides(o); }
