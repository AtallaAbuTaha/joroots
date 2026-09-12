import { registryView } from '../../lib/connectors/registry'; import { providerStatus } from '../../lib/providers'; import { persistent } from '../../lib/repo/store';
import TestButton from './test-button';
export const dynamic = 'force-dynamic';
export default function Settings() {
  const reg = registryView(); const prov = providerStatus();
  return (<div className="ws prof" style={{ maxWidth: 900, margin: '0 auto' }}>
    <a href="/" className="btn ghost sm" style={{ textDecoration: 'none' }}>← Workspace</a>
    <h1 className="disp" style={{ marginTop: 14 }}>Settings › Integrations</h1>
    <p className="meta">Credentials live only in server environment variables (Vercel → Project → Settings → Environment Variables). Nothing here is stored in the browser. After adding a variable, redeploy.</p>
    <div className="card"><h3>Model providers</h3>{prov.map(p => <div key={p.id} className="tool"><div className="n">{p.id}</div><span className={'s ' + (p.available ? 'ok' : 'no')} style={{ fontSize: 12 }}>{p.available ? 'CONNECTED' : 'MISSING_CREDENTIALS'}</span></div>)}
      <div className="meta" style={{ marginTop: 6 }}>Project memory: {persistent() ? 'Upstash KV connected' : 'in-memory (add KV_REST_API_URL + KV_REST_API_TOKEN)'}</div></div>
    {reg.map(c => (<div key={c.id} className="card"><div className="row" style={{ justifyContent: 'space-between' }}><div><h3>{c.name} <span className="tag">{c.category}</span></h3><div className="meta">{c.provider} · {c.auth_type} · {c.available_actions.join(' · ')}</div></div>
        <span className={'s ' + (c.status === 'CONNECTED' ? 'ok' : 'no')} style={{ fontSize: 12, fontWeight: 600 }}>{c.status}</span></div>
      <dl className="kv" style={{ marginTop: 8 }}><dt>Required env</dt><dd>{c.required_env.length ? c.required_env.map(k => <code key={k} style={{ marginRight: 8 }}>{k}{c.missing.includes(k) ? ' (missing)' : ' ✓'}</code>) : 'none'}</dd>
        <dt>Assigned agents</dt><dd>{c.assigned_agents.join(', ') || '—'}</dd>{c.notes && <><dt>Notes</dt><dd>{c.notes}</dd></>}</dl>
      <div className="row" style={{ marginTop: 8 }}><TestButton id={c.id} disabled={c.status !== 'CONNECTED'} /></div></div>))}
  </div>);
}
