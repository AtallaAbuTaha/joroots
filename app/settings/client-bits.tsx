'use client';
import { useEffect, useState } from 'react';
// The Settings page is server-rendered, so it only knows about Vercel env vars.
// These bits read the browser-local keys too, so the page reflects what will actually happen on a request.
function browserKeys(): Record<string, string> { try { return JSON.parse(localStorage.getItem('jr-keys') || '{}'); } catch { return {}; } }
export function StatusBadge({ requiredEnv, serverStatus }: { requiredEnv: string[]; serverStatus: string }) {
  const [inBrowser, setInBrowser] = useState(false);
  useEffect(() => { const k = browserKeys(); setInBrowser(requiredEnv.length > 0 && requiredEnv.every(n => !!k[n])); }, [requiredEnv]);
  const ok = serverStatus === 'CONNECTED' || inBrowser;
  return <span className={'s ' + (ok ? 'ok' : 'no')} style={{ fontSize: 12, fontWeight: 600 }}>
    {serverStatus === 'CONNECTED' ? 'CONNECTED' : inBrowser ? 'CONNECTED — browser key' : serverStatus}
  </span>;
}
export function KeySourceNote() {
  const [names, setNames] = useState<string[]>([]);
  useEffect(() => { setNames(Object.keys(browserKeys())); }, []);
  if (!names.length) return <div className="meta" style={{ marginTop: 6 }}>No browser-local keys in this browser. Keys pasted in the Keys panel would appear here.</div>;
  return <div className="card" style={{ marginTop: 10 }}><h3>Keys in this browser ({names.length})</h3>
    <div className="meta">{names.join(', ')} — stored in this browser only, sent with your own requests. They work immediately but only for you, and they vanish if you clear site data. Move them to Vercel environment variables to cover the whole team.</div></div>;
}
export default function TestButton({ id, requiredEnv, serverStatus }: { id: string; requiredEnv: string[]; serverStatus: string }) {
  const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false); const [ready, setReady] = useState(serverStatus === 'CONNECTED');
  useEffect(() => { const k = browserKeys(); setReady(serverStatus === 'CONNECTED' || (requiredEnv.length > 0 && requiredEnv.every(n => !!k[n]))); }, [requiredEnv, serverStatus]);
  return (<><button className="btn ghost sm" disabled={!ready || busy} onClick={async () => {
    setBusy(true); setMsg(id === 'higgsfield' ? 'Generating a test image, up to 40s…' : 'Testing…');
    try {
      const r = await fetch('/api/connectors/test', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, keys: browserKeys() }) });
      const d = await r.json(); setMsg((d.ok ? 'OK — ' : 'Failed — ') + d.message);
    } catch (e: any) { setMsg('Failed — ' + e.message); }
    setBusy(false);
  }}>{busy ? 'Testing…' : 'Test connection'}</button><span className="meta" style={{ marginLeft: 10 }}>{msg}</span></>);
}
