'use client';
import { useState } from 'react';
export default function TestButton({ id, disabled }: { id: string; disabled: boolean }) {
  const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  return (<><button className="btn ghost sm" disabled={disabled || busy} onClick={async () => { setBusy(true); setMsg('Testing…'); try { const r = await fetch('/api/connectors/test', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id }) }); const d = await r.json(); setMsg((d.ok ? 'OK — ' : 'Failed — ') + d.message); } catch (e: any) { setMsg('Failed — ' + e.message); } setBusy(false); }}>{busy ? 'Testing…' : 'Test connection'}</button><span className="meta" style={{ marginLeft: 10 }}>{msg}</span></>);
}
