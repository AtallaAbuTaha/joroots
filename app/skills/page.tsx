import { loadSkills, loadAgents } from '../../lib/agents/loader';
export const dynamic = 'force-dynamic';
export default async function Skills() {
  const skills = loadSkills(); const agents = await loadAgents();
  const depts = Array.from(new Set(Object.values(skills).map(s => s.department)));
  return (<div className="page">
    <h1 className="disp">Skills</h1>
    <p className="lede">Reusable instruction modules. An agent loads only the skills it has installed, per task — nothing lives in one giant prompt. Skills are files in the repo under <code>/skills</code>; edit them there.</p>
    {depts.map(d => (<div key={d}><h2>{d}</h2><table className="t"><thead><tr><th>Skill</th><th>What it does</th><th>Installed on</th></tr></thead><tbody>
      {Object.values(skills).filter(s => s.department === d).map(s => <tr key={s.id}><td><b>{s.name}</b><div className="meta">{s.id}</div></td><td style={{ maxWidth: 520 }}>{(s.body.match(/## Purpose\n([\s\S]*?)\n\n/) || [])[1] || s.body.slice(0, 200)}</td><td>{agents.filter(a => a.skills.includes(s.id)).map(a => a.name).join(', ') || <span className="meta">—</span>}</td></tr>)}
    </tbody></table></div>))}
  </div>);
}
