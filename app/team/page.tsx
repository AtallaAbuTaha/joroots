import { loadAgents, loadDepartments, loadSkills } from '../../lib/agents/loader';
export const dynamic = 'force-dynamic';
export default async function Team() {
  const [agents, depts, skills] = [await loadAgents(), await loadDepartments(), loadSkills()];
  return (<div className="page">
    <h1 className="disp">Team</h1>
    <p className="lede">Four employees to start. Each has a mission, a skill set, a tool allowlist and a knowledge scope — open one to change any of it, or add a new employee.</p>
    {depts.map(d => (<div key={d.id}><h2>{d.name}</h2><div className="grid3">
      {agents.filter(a => a.department === d.id).map(a => (<a key={a.id} className="itemcard" href={'/?agent=' + a.id}>
        <h3>{a.name} {a.status !== 'active' && <span className="tag a">PAUSED</span>}{a.custom && <span className="tag">CUSTOM</span>}</h3>
        <p>{a.role}</p>
        <p style={{ marginTop: 8 }}>{a.skills.length} skills · {a.tools.length} tools · {a.knowledge.length} knowledge areas · model: {a.model?.provider || 'auto'}</p>
        <p style={{ marginTop: 6 }}>{a.skills.map(s => skills[s]?.name).filter(Boolean).join(' · ')}</p>
      </a>))}
    </div></div>))}
    <div style={{ marginTop: 26 }}><a className="btn" href="/?add=1" style={{ textDecoration: 'none' }}>+ Add employee</a></div>
  </div>);
}
