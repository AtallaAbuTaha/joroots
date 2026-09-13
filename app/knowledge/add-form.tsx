'use client';
import { useState } from 'react';
export default function AddForm({ categories }: { categories: string[] }) {
  const [f, setF] = useState<any>({ category: 'case-studies', confidence: 'stated' }); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  return (<div className="card form" style={{ marginTop: 10 }}>
    <h3>Add knowledge</h3>
    <div className="grid2">
      <div><label>Title</label><input value={f.title || ''} onChange={set('title')} placeholder="Millian Travel — Q3 results" />
        <label>Category</label><select value={f.category} onChange={set('category')}>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select>
        <label>Tags (comma separated)</label><input value={f.tags || ''} onChange={set('tags')} placeholder="millian, tourism, results" /></div>
      <div><label>Client (optional)</label><input value={f.client || ''} onChange={set('client')} />
        <label>Source</label><input value={f.source || ''} onChange={set('source')} placeholder="client email 12 Sep, signed report, etc." />
        <label>Confidence</label><select value={f.confidence} onChange={set('confidence')}><option value="verified">verified — checked against a document</option><option value="stated">stated — told to us, not yet verified</option><option value="proposed">proposed — our own hypothesis</option></select></div>
    </div>
    <label>Body</label><textarea value={f.body || ''} onChange={set('body')} style={{ minHeight: 140 }} placeholder="Plain facts. Numbers with their source. Agents will quote this." />
    <div className="row" style={{ marginTop: 10 }}><button className="btn" disabled={busy} onClick={async () => { setBusy(true); setMsg('');
      try { const r = await fetch('/api/knowledge', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(f) }); const d = await r.json(); if (!r.ok) throw new Error(d.error); setMsg('Added: ' + d.item.id + '. Agents can use it on the next task.'); setF({ category: f.category, confidence: 'stated' }); setTimeout(() => location.reload(), 900); }
      catch (e: any) { setMsg('Failed — ' + e.message); } setBusy(false); }}>Add to knowledge base</button><span className="meta">{msg}</span></div>
  </div>);
}
