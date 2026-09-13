import { allKnowledge } from '../../lib/knowledge/loader'; import { knowledgeRepo } from '../../lib/knowledge/custom'; import { persistent } from '../../lib/repo/store';
import AddForm from './add-form';
export const dynamic = 'force-dynamic';
export default async function Knowledge() {
  const base = allKnowledge(); const custom = await knowledgeRepo.list(); const all = base.concat(custom);
  const cats = Array.from(new Set(all.map(k => k.category)));
  return (<div className="page">
    <h1 className="disp">Knowledge</h1>
    <p className="lede">One shared base every agent retrieves from by relevance — nothing is injected whole. Each item carries its source and a confidence tag. Claimed and verified are never merged.</p>
    {!persistent() && <div className="note">Items added here are held in memory on this deployment and reset on redeploy. Repo files are permanent. Add Upstash KV to keep app-added items.</div>}
    <div className="kpis"><div className="kpi"><div className="n">{all.length}</div><div className="l">items</div></div><div className="kpi"><div className="n">{base.length}</div><div className="l">from repo</div></div><div className="kpi"><div className="n">{custom.length}</div><div className="l">added in app</div></div><div className="kpi"><div className="n">{all.filter(k => k.confidence === 'verified').length}</div><div className="l">verified</div></div></div>
    <AddForm categories={cats.concat(['company', 'services', 'positioning', 'brand', 'design-system', 'case-studies', 'clients', 'methodologies', 'internal', 'projects']).filter((v, i, a) => a.indexOf(v) === i)} />
    {cats.map(c => (<div key={c}><h2>{c}</h2><table className="t"><thead><tr><th>Item</th><th>Tags</th><th>Source</th><th>Confidence</th><th>Size</th></tr></thead><tbody>
      {all.filter(k => k.category === c).map(k => <tr key={k.id}><td><b>{k.title}</b><div className="meta">{k.id}{k.client ? ' · ' + k.client : ''}</div><details><summary className="meta" style={{ cursor: 'pointer' }}>show</summary><pre className="body" style={{ marginTop: 8 }}>{k.body}</pre></details></td><td className="meta">{k.tags.join(', ')}</td><td className="meta">{k.source || '—'}</td><td><span className={'tag ' + (k.confidence === 'verified' ? 'v' : k.confidence === 'proposed' ? 'a' : '')}>{(k.confidence || 'n/a').toUpperCase()}</span></td><td className="meta">{k.body.length}</td></tr>)}
    </tbody></table></div>))}
  </div>);
}
