import Script from 'next/script';
export const dynamic = 'force-dynamic';
export default function Page() {
  return (<>
    <div id="banner" className="banner" style={{display:'none'}}></div>
<div id="top">
  <div className="brand"><b className="disp">JOROOTS</b><span>AI workforce · v0.3</span></div>
  <div id="prog">
    <div className="bar" id="bar"></div>
    <div className="lbl" id="stat">Idle</div>
    <button className="btn verm sm" id="keyslink">Keys</button>
    <button className="btn ghost sm" id="debuglink">Debug</button>
    <a className="set" href="/settings">Settings</a>
  </div>
</div>
<div id="app">
  <div className="col" id="left">
    <div className="colhead"><b>Orchestrator</b><span id="lefthint">Talk to the system here</span></div>
    <div id="chat"></div>
    <div id="composer">
      <textarea id="input" placeholder="What do you need? e.g. Create a Joroots LinkedIn post about AI orchestration for SMEs in Jordan."></textarea>
      <div className="row">
        <button className="btn" id="send">Run</button>
        <button className="btn ghost sm" id="attach">Attach file</button>
        <button className="btn ghost sm" id="mic" title="Experimental">Voice</button>
        <input type="file" id="file" multiple accept="image/*,application/pdf,.txt,.md" style={{display:"none"}} />
        <span className="files" id="filelist"></span>
      </div>
    </div>
  </div>
  <div className="col" id="center"><div id="ws"></div></div>
  <div className="col" id="right">
    <div className="tabs">
      <button className="on" data-tab="depts">Departments</button>
      <button data-tab="projects">Projects</button>
      <button data-tab="registry">Tools</button>
    </div>
    <div id="rbody"></div>
  </div>
</div>
    <Script src={`/app.js?v=${(process.env.VERCEL_GIT_COMMIT_SHA || 'dev').slice(0, 7)}`} strategy="afterInteractive" />
  </>);
}
