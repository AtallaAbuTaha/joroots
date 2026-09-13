import { registryView } from '../../lib/connectors/registry'; import { providerStatus } from '../../lib/providers'; import { persistent } from '../../lib/repo/store';
import TestButton, { StatusBadge, KeySourceNote } from './client-bits';
export const dynamic = 'force-dynamic';
export default function Settings() {
  const reg = registryView(); const prov = providerStatus();
  const build = (process.env.VERCEL_GIT_COMMIT_SHA || 'local').slice(0, 7);
  return (<div className="ws prof" style={{ maxWidth: 900, margin: '0 auto' }}>
    <a href="/" className="btn ghost sm" style={{ textDecoration: 'none' }}>← Workspace</a>
    <h1 className="disp" style={{ marginTop: 14 }}>Settings › Integrations</h1>
    <p className="meta">A key can live in two places. <b>Vercel environment variables</b> apply to everyone and survive forever — that is the production path, and it needs a redeploy to take effect. <b>The Keys panel</b> stores a key in your own browser for immediate testing. This page reads the server; the badges below also account for keys held in this browser. Build {build}.</p>
    <KeySourceNote />
    <div className="card"><h3>Model providers</h3>{prov.map(p => (<div key={p.id} className="tool">
        <div className="n">{p.name}<small>{p.key_env}{p.mcp ? ' · carries connector tools' : ''}{p.nativeSearch ? ' · native web search' : ''}</small></div>
        <StatusBadge requiredEnv={[p.key_env]} serverStatus={p.available ? 'CONNECTED' : 'MISSING_CREDENTIALS'} />
      </div>))}
      <div className="meta" style={{ marginTop: 6 }}>Tasks try these top to bottom and fail over on a rate limit or an error. Project memory: {persistent() ? 'Upstash KV connected' : 'in-memory (add KV_REST_API_URL + KV_REST_API_TOKEN)'}</div></div>
    {reg.filter(c => c.kind !== 'model').map(c => (<div key={c.id} className="card">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div><h3>{c.name} <span className="tag">{c.category}</span></h3><div className="meta">{c.provider} · {c.auth_type} · {c.available_actions.join(' · ')}</div></div>
        <StatusBadge requiredEnv={c.required_env} serverStatus={c.status} />
      </div>
      <dl className="kv" style={{ marginTop: 8 }}>
        <dt>Required env</dt><dd>{c.required_env.length ? c.required_env.map(k => <code key={k} style={{ marginRight: 8 }}>{k}{c.missing.includes(k) ? ' (not in Vercel)' : ' ✓'}</code>) : 'none'}</dd>
        <dt>Assigned agents</dt><dd>{c.assigned_agents.join(', ') || '—'}</dd>{c.notes && <><dt>Notes</dt><dd>{c.notes}</dd></>}
      </dl>
      <div className="row" style={{ marginTop: 8 }}><TestButton id={c.id} requiredEnv={c.required_env} serverStatus={c.status} /></div></div>))}
  </div>);
}
