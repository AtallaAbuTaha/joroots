import { projectsRepo, persistent } from '../../lib/repo/store';
export const dynamic = 'force-dynamic';
export default async function Projects() {
  const projects = await projectsRepo.list();
  return (<div className="page">
    <h1 className="disp">Projects</h1>
    <p className="lede">Every request the workforce has run: brief, research, sources, copy, creative, decisions, versions and the full trace.</p>
    {!persistent() && <div className="note">Project memory is in-memory on this deployment — the library resets on every redeploy. Add Upstash KV to keep it.</div>}
    {projects.length === 0 ? <div className="meta">Nothing yet. Run a request from the <a href="/">Workspace</a>.</div> :
    <table className="t"><thead><tr><th>Project</th><th>Type</th><th>Status</th><th>Agents</th><th>Sources</th><th>Image</th><th>Created</th></tr></thead><tbody>
      {projects.map((p: any) => <tr key={p.id}><td><a href={'/?project=' + p.id}>{p.title}</a></td><td>{p.type || '—'}</td><td>{p.status || '—'}{p.approved ? ' · approved' : ''}</td><td>{(p.agents || []).length}</td><td>{(p.sources || []).length}</td><td>{(p.images || []).length ? 'yes' : '—'}</td><td className="meta">{new Date(p.created).toLocaleString()}</td></tr>)}
    </tbody></table>}
  </div>);
}
