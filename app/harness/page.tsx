import { logsRepo, projectsRepo, persistent } from '../../lib/repo/store'; import { registryView } from '../../lib/connectors/registry'; import { loadAgents } from '../../lib/agents/loader';
export const dynamic = 'force-dynamic';
const pct = (a: number, b: number) => b ? Math.round(100 * a / b) : 0;
// Rough public list prices per 1M tokens (in/out). Groq free tier is $0 until you add a card. Used only for an estimate label.
const PRICE: Record<string, [number, number]> = { anthropic: [3, 15], openai: [0.15, 0.6], gemini: [0.3, 2.5], groq: [0, 0], openrouter: [0, 0], mistral: [0.1, 0.3], deepseek: [0.27, 1.1] };
export default async function Harness() {
  const logs = await logsRepo.list(); const projects = await projectsRepo.list(); const agents = await loadAgents(); const reg = registryView();
  const ok = logs.filter(l => l.ok); const fail = logs.filter(l => !l.ok);
  const byProv: Record<string, number> = {}; const byAgent: Record<string, { n: number; fail: number; ms: number }> = {};
  let inTok = 0, outTok = 0, cost = 0, failovers = 0, ms = 0;
  for (const l of logs) {
    if (l.provider) byProv[l.provider] = (byProv[l.provider] || 0) + 1;
    const a = byAgent[l.agent] = byAgent[l.agent] || { n: 0, fail: 0, ms: 0 }; a.n++; if (!l.ok) a.fail++; a.ms += l.ms || 0;
    const u = l.usage || {}; const i = u.input_tokens ?? u.prompt_tokens ?? 0; const o = u.output_tokens ?? u.completion_tokens ?? 0; inTok += i; outTok += o;
    const pr = PRICE[l.provider] || [0, 0]; cost += (i * pr[0] + o * pr[1]) / 1e6;
    if (l.attempts) failovers += l.attempts; ms += l.ms || 0;
  }
  const name = (id: string) => agents.find(a => a.id === id)?.name || id;
  const qcIssues = projects.filter((p: any) => p.qc && !p.qc.approved).length;
  return (<div className="page">
    <h1 className="disp">Harness</h1>
    <p className="lede">The executive layer: what the workforce did, what it cost, where it failed. Every task the engine runs writes a log line — this reads them.</p>
    {!persistent() && <div className="note">Logs are in-memory on this deployment and reset on redeploy — you are seeing this server instance only. Add Upstash KV for a permanent record.</div>}
    <div className="kpis">
      <div className="kpi"><div className="n">{logs.length}</div><div className="l">agent runs</div></div>
      <div className="kpi"><div className="n">{pct(ok.length, logs.length)}%</div><div className="l">succeeded</div></div>
      <div className={'kpi' + (fail.length ? ' alert' : '')}><div className="n">{fail.length}</div><div className="l">failed</div></div>
      <div className={'kpi' + (failovers ? ' alert' : '')}><div className="n">{failovers}</div><div className="l">provider failovers</div></div>
      <div className="kpi"><div className="n">{logs.length ? (ms / logs.length / 1000).toFixed(1) + 's' : '—'}</div><div className="l">avg latency</div></div>
      <div className="kpi"><div className="n">{((inTok + outTok) / 1000).toFixed(1)}k</div><div className="l">tokens</div></div>
      <div className="kpi"><div className="n">${cost.toFixed(2)}</div><div className="l">est. model cost</div></div>
    </div>
    <div className="grid2" style={{ marginTop: 24 }}>
      <div><h2>Work by employee</h2><table className="t"><thead><tr><th>Employee</th><th>Runs</th><th>Failed</th><th>Avg</th></tr></thead><tbody>
        {Object.entries(byAgent).sort((a, b) => b[1].n - a[1].n).map(([id, v]) => <tr key={id}><td>{name(id)}</td><td>{v.n}</td><td>{v.fail || '—'}</td><td>{(v.ms / v.n / 1000).toFixed(1)}s</td></tr>)}
        {!logs.length && <tr><td colSpan={4} className="meta">No runs on this instance yet</td></tr>}
      </tbody></table></div>
      <div><h2>Model providers used</h2>{Object.entries(byProv).sort((a, b) => b[1] - a[1]).map(([p, n]) => <div key={p} style={{ marginBottom: 8 }}><div className="row" style={{ justifyContent: 'space-between' }}><span>{p}</span><span className="meta">{n} · {pct(n, ok.length)}%</span></div><div className="bar-h"><i style={{ width: pct(n, ok.length) + '%' }} /></div></div>)}
        {!Object.keys(byProv).length && <div className="meta">—</div>}
        <h2>Connector health</h2><table className="t"><tbody>{reg.filter(c => c.kind !== 'model').map(c => <tr key={c.id}><td>{c.name}</td><td><span className={'tag ' + (c.status === 'CONNECTED' ? 'v' : '')}>{c.status === 'CONNECTED' ? 'CONNECTED' : 'NOT IN VERCEL'}</span></td></tr>)}</tbody></table>
        <div className="meta" style={{ marginTop: 6 }}>Server view only — browser-local keys are not visible here.</div></div>
    </div>
    <h2>Projects</h2>
    <div className="kpis"><div className="kpi"><div className="n">{projects.length}</div><div className="l">total</div></div><div className="kpi"><div className="n">{projects.filter((p: any) => p.status === 'COMPLETED').length}</div><div className="l">completed</div></div><div className="kpi"><div className="n">{projects.filter((p: any) => p.approved).length}</div><div className="l">approved</div></div><div className={'kpi' + (qcIssues ? ' alert' : '')}><div className="n">{qcIssues}</div><div className="l">delivered with QC issues</div></div><div className={'kpi' + (projects.filter((p: any) => p.status === 'FAILED').length ? ' alert' : '')}><div className="n">{projects.filter((p: any) => p.status === 'FAILED').length}</div><div className="l">failed</div></div></div>
    <h2>Recent failures</h2>
    <table className="t"><thead><tr><th>When</th><th>Employee</th><th>Error</th></tr></thead><tbody>
      {fail.slice(0, 12).map((l, i) => <tr key={i}><td className="meta">{new Date(l.at).toLocaleString()}</td><td>{name(l.agent)}</td><td className="issue">{l.error || (l.attempts || []).map((x: any) => x.provider + ': ' + x.error).join(' | ')}</td></tr>)}
      {!fail.length && <tr><td colSpan={3} className="meta">None</td></tr>}
    </tbody></table>
    <h2>Recent runs</h2>
    <table className="t"><thead><tr><th>When</th><th>Employee</th><th>Provider / model</th><th>Latency</th><th>Tokens</th><th>Tools</th></tr></thead><tbody>
      {logs.slice(0, 25).map((l, i) => <tr key={i}><td className="meta">{new Date(l.at).toLocaleTimeString()}</td><td>{name(l.agent)}</td><td className="meta">{l.ok ? (l.provider + ' / ' + l.model) : <span className="issue">failed</span>}</td><td className="meta">{l.ms ? (l.ms / 1000).toFixed(1) + 's' : '—'}</td><td className="meta">{l.usage ? ((l.usage.input_tokens ?? l.usage.prompt_tokens ?? 0) + (l.usage.output_tokens ?? l.usage.completion_tokens ?? 0)) : '—'}</td><td className="meta">{(l.tools || []).join(', ') || '—'}</td></tr>)}
    </tbody></table>
  </div>);
}
