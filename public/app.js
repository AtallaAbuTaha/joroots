// Joroots Workforce — client runtime. All model/tool calls go through server routes; no secrets here.
const STEPS=['Understand','Knowledge','Research','Marketing','Review','Creative','Image','Done'];
const BANNED=['leverage','synergy','seamless','game-changer','game changer','revolutionize','revolutionise','unlock','transform your','cutting-edge','empower','elevate','supercharge','next-level','harness the power','unleash'];
const S={ step:-1, cfg:null, projects:[], busy:false, files:[], view:{mode:'empty'}, tab:'depts', events:[], current:null, agentBusy:{}, persistent:false };
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const agent=id=>S.cfg.agents.find(a=>a.id===id);
const reg=id=>S.cfg.registry.find(r=>r.id===id);
const KEY_ENV={groq:'GROQ_API_KEY',gemini:'GEMINI_API_KEY',anthropic:'ANTHROPIC_API_KEY',openrouter:'OPENROUTER_API_KEY',mistral:'MISTRAL_API_KEY',deepseek:'DEEPSEEK_API_KEY',openai:'OPENAI_API_KEY',tavily:'TAVILY_API_KEY',higgsfield:'HIGGSFIELD_API_KEY_ID',canva:'CANVA_MCP_TOKEN',slack:'SLACK_MCP_TOKEN',gmail:'GMAIL_MCP_TOKEN',gdrive:'GDRIVE_MCP_TOKEN'};
function storageOK(){ try{ localStorage.setItem('jr-probe','1'); localStorage.removeItem('jr-probe'); return true; }catch(e){ return false; } }
let memKeys={};
function localKeys(){ try{ return JSON.parse(localStorage.getItem('jr-keys')||'{}'); }catch(e){ return memKeys; } }
function setLocalKeys(o){ memKeys=o; try{ localStorage.setItem('jr-keys',JSON.stringify(o)); }catch(e){} updateKeysBadge(); }
function updateKeysBadge(){ const b=document.getElementById('keyslink'); if(!b) return; const n=Object.keys(localKeys()).length; b.textContent=n?'Keys ('+n+')':'Keys'; }
const hasKey=id=>id==='higgsfield'?!!(localKeys().HIGGSFIELD_API_KEY_ID&&localKeys().HIGGSFIELD_API_KEY_SECRET):!!localKeys()[KEY_ENV[id]];
const providerReady=p=>p.available||hasKey(p.id);
const connReady=r=>r.status==='CONNECTED'||hasKey(r.id);
const api=async(url,body)=>{ const r=await fetch(url,body?{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}:undefined); const d=await r.json(); if(!r.ok||d.error) throw new Error(d.error||('HTTP '+r.status)); return d; };
const uid=()=>'t'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);

async function loadCfg(){ S.cfg=await api('/api/config'); S.persistent=S.cfg.persistent; }
async function boot(){
  try{ await loadCfg(); const p=await api('/api/projects'); S.projects=p.projects; }catch(e){ sysMsg('Could not load config: '+e.message); return; }
  const noModel=!S.cfg.providers.some(providerReady); const b=$('#banner');
  if(noModel){ b.style.display='block'; b.innerHTML='No model connected yet. <b>Press Keys in the top bar</b> and paste a Groq key (free, no card, console.groq.com) — it stays in this browser. For the whole team, add GROQ_API_KEY in Vercel instead.'; }
  else if(!S.persistent){ b.style.display='block'; b.textContent='Running without persistent storage — projects are lost on redeploy. Add KV_REST_API_URL and KV_REST_API_TOKEN (Upstash) to keep them.'; }
  renderRight(); renderCenter(); updateKeysBadge();
  const av=S.cfg.providers.filter(providerReady);
  sysMsg('Ready. '+S.cfg.agents.filter(a=>a.status==='active').length+' employees active, '+S.projects.length+' projects. Models: '+(av.length?av.map(p=>p.name).join(' → '):'none yet')+'. Search: '+(hasKey('tavily')||S.cfg.registry.find(r=>r.id==='tavily'&&r.status==='CONNECTED')?'Tavily':hasKey('anthropic')||S.cfg.registry.find(r=>r.id==='web_search'&&r.status==='CONNECTED')?'Anthropic':'not connected')+'.');
}
async function updateAgent(id,patch){ Object.assign(agent(id),patch); await api('/api/config',{action:'update_agent',id,patch}); }
async function saveProject(p){ try{ await api('/api/projects',{project:p}); }catch(e){ ev('System','Save failed: '+e.message,'err'); } }

// ---- chat & activity
function userMsg(t){ const d=document.createElement('div'); d.className='msg user'; d.textContent=t; $('#chat').appendChild(d); scrollChat(); }
function sysMsg(t){ const d=document.createElement('div'); d.className='msg sys'; d.textContent=t; $('#chat').appendChild(d); scrollChat(); return d; }
let streamEl=null;
function newStream(){ streamEl=document.createElement('div'); streamEl.className='stream'; $('#chat').appendChild(streamEl); }
function ev(who,text,kind){ const e={t:Date.now(),who,text,kind:kind||'info'}; S.events.push(e); if(S.current) S.current.activity.push(e);
  if(streamEl){ const d=document.createElement('div'); d.className='ev '+e.kind; d.innerHTML='<span class="who">'+esc(who)+'</span><span class="t">'+esc(text)+'</span>'; streamEl.appendChild(d); scrollChat(); } }
function scrollChat(){ const c=$('#chat'); c.scrollTop=c.scrollHeight; }
function setBusy(b,label){ S.busy=b; $('#send').disabled=b; if(!b) S.step=-1; drawProg(label); }
function step(name,label){ S.step=STEPS.indexOf(name); S.busy=true; drawProg(label); }
function drawProg(label){ const s=S.step; $('#bar').innerHTML=STEPS.map((n,i)=>'<i class="'+(i<s?'done':i===s?'now':'')+'" title="'+n+'"></i>').join(''); $('#stat').innerHTML=s<0?(S.busy?esc(label||'Working'):'Idle'):'<b>'+esc(STEPS[s])+'</b> · '+esc(label||''); }
function agentState(id,busy){ S.agentBusy[id]=busy; if(S.tab==='depts') renderRight(); }

// ---- task execution (server does model + tools; we keep the contract)
async function runTask(t){
  const a=agent(t.assigned_agent); if(!a) throw new Error('No agent '+t.assigned_agent);
  const task={task_id:uid(),parent_task_id:S.current?S.current.id:null,status:'RUNNING',created_at:Date.now(),...t};
  if(S.current) S.current.tasks.push(task); agentState(a.id,true);
  try{ const r=await api('/api/agent',Object.assign({},task,{keys:localKeys()})); (r.events||[]).forEach(e=>ev(a.name,e.text,e.kind)); task.status='COMPLETED'; task.completed_at=Date.now(); task.result={provider:r.provider,model:r.model,ms:r.ms,tools:r.tools,skills:r.skills_used,knowledge:r.knowledge_used,unavailable:r.unavailable_connectors,usage:r.usage};
    if(S.current){ S.current.models=(S.current.models||[]).concat([r.provider+'/'+r.model]); if(!S.current.tools.includes(r.provider)) S.current.tools.push(r.provider); }
    (r.attempts||[]).forEach(x=>ev('System',x.provider+' failed over: '+String(x.error).slice(0,90),'err'));
    if(r.unavailable_connectors&&r.unavailable_connectors.length) ev(a.name,'Not connected: '+r.unavailable_connectors.join(', ')+' — connect in Settings','err');
    return r; }
  catch(e){ task.status='FAILED'; task.error=e.message; task.completed_at=Date.now(); throw e; }
  finally{ agentState(a.id,false); }
}
const roster=()=>S.cfg.agents.filter(a=>a.id!=='orchestrator'&&a.status==='active').map(a=>a.id+' ('+a.name+', '+a.role+')').join('\n');
const projectContext=()=>S.projects.slice(0,8).map(p=>'- '+p.title+' ['+p.type+']: '+(p.summary||'')).join('\n')||'(none)';
const bannedFound=t=>{ t=(t||'').toLowerCase(); return BANNED.filter(w=>t.includes(w)); };
const text=b=>[{type:'text',text:b}];

async function run(request){
  if(S.busy||!request.trim()) return;
  userMsg(request+(S.files.length?'\n['+S.files.map(f=>f.name).join(', ')+']':''));
  const p={id:'p'+Date.now(),title:request.slice(0,80),brief:request,created:Date.now(),status:'PLANNING',type:'',plan:null,research:null,marketing:null,creative:null,qc:null,final:null,images:[],sources:[],agents:['orchestrator'],tools:['knowledge'],models:[],activity:[],tasks:[],versions:[],decisions:[],summary:'',files:S.files.map(f=>f.name)};
  S.current=p; S.view={mode:'work',project:p}; renderCenter(); newStream(); step('Understand','reading the request');
  try{
    ev('Orchestrator','Understanding request'); step('Knowledge','checking knowledge and project library'); ev('Orchestrator','Checking Joroots knowledge and project library');
    const plan=await runTask({assigned_agent:'orchestrator',objective:'Plan the execution for: '+request,required_skills:['ops.routing','ops.project-memory'],expected_output:'JSON plan',
      input:[{type:'text',text:`Request from Atalla: "${request}"\n\nActive employees:\n${roster()}\n\nRecent projects:\n${projectContext()}\n\nReturn JSON only:\n{"objective":"one sentence","deliverable_type":"social_post|research_report|strategy|campaign|email|creative_brief|other","format":"e.g. LinkedIn post 1080x1350","audience":"who","needs_research":true|false,"research_question":"specific question or empty","chain":["research","marketing-strategist","content-creative"] (only agents actually needed, in order),"context_for_agents":"2-3 sentences","reuse":"what to reuse from the library, or empty"}`}].concat(S.files.map(f=>f.block)),
      extra_system:'You are planning. Route minimally. Use research only if facts outside the knowledge base are needed.'});
    if(!plan.json) throw new Error('Orchestrator returned no plan');
    p.plan=plan.json; p.type=p.plan.deliverable_type||'other'; p.status='RUNNING';
    p.decisions.push({at:Date.now(),by:'orchestrator',decision:'route '+(p.plan.chain||[]).join(' → ')+(p.plan.needs_research?' with research':' without research')});
    ev('Orchestrator','Objective: '+p.plan.objective); ev('Orchestrator',(p.plan.needs_research?'Research required':'No research required')+' · route: '+(p.plan.chain||[]).join(' → ')); renderCenter();
    const chain=(p.plan.chain||[]).filter(id=>agent(id)&&agent(id).status==='active');

    if(p.plan.needs_research&&chain.includes('research')){
      step('Research','web search running'); ev('Orchestrator','Research Agent assigned','handoff'); p.agents.push('research');
      const r=await runTask({assigned_agent:'research',objective:p.plan.research_question||request,context:p.plan.context_for_agents,web_search:true,allowed_tools:['knowledge','web_search','tavily','gdrive'],expected_output:'JSON findings with sources',success_criteria:'every verified fact has a URL',
        input:text(`Research question: ${p.plan.research_question||request}\nAudience: ${p.plan.audience||''}\n\nUse web search (2–4 searches). Return JSON only:\n{"verified_facts":[{"fact":"with number and date","source":"publisher","url":"https://..."}],"derived_insights":["..."],"assumptions":["..."],"unknowns":["..."],"recommendations":["..."],"one_line_summary":"..."}`)});
      p.research=r.json||{verified_facts:[],derived_insights:[],assumptions:[r.text],unknowns:[]}; p.sources=r.sources; p.tools.push(r.tools.some(x=>x.tool==='web_search')?'web_search':'tavily');
      ev('Research Agent',(p.research.verified_facts||[]).length+' verified facts, '+p.sources.length+' sources collected','done'); renderCenter();
    }

    let issues='';
    for(let round=0;round<2;round++){
      if(!chain.includes('marketing-strategist')) break;
      step('Marketing',round?'revising after review':'writing strategy and copy'); ev('Orchestrator',round?'Sending review issues back to Marketing Strategist':'Marketing Strategist assigned','handoff'); if(!p.agents.includes('marketing-strategist')) p.agents.push('marketing-strategist');
      const m=await runTask({assigned_agent:'marketing-strategist',objective:p.plan.objective,context:p.plan.context_for_agents,expected_output:'JSON messaging',success_criteria:'Joroots voice, sourced numbers',
        input:text(`Deliverable: ${p.type} · ${p.plan.format||''}\nAudience: ${p.plan.audience||''}\n${p.research?'Research findings (cite numbers exactly):\n'+JSON.stringify(p.research):'No external research — use the knowledge base only.'}\n${issues?'\nREVISION REQUIRED. Fix:\n'+issues:''}\n\nReturn JSON only:\n{"key_message":"one sentence","angle":"...","headline":"hook, max 12 words, sentence case, with a number or mechanism","body":"3-6 short lines separated by \\n","cta":"one concrete ask","hashtags":["#..."],"proof_points":["number + source"],"channel":"LinkedIn|Instagram|both","creative_brief":"2-3 sentences for the art director"${p.type!=='social_post'?',"document":"full deliverable in markdown"':''}}`)});
      p.marketing=m.json||{headline:'',body:m.text,cta:'',hashtags:[]}; const bw=bannedFound(JSON.stringify(p.marketing));
      ev('Marketing Strategist','Messaging ready'+(bw.length?' — banned words: '+bw.join(', '):''),'done'); renderCenter();
      step('Review','checking voice rules and sources'); ev('Orchestrator','Final review');
      const q=await runTask({assigned_agent:'orchestrator',objective:'Quality review',required_skills:['ops.quality-control'],expected_output:'JSON verdict',
        input:text(`Review this draft.\nDraft: ${JSON.stringify(p.marketing)}\nAllowed numbers: knowledge base, or research facts: ${p.research?JSON.stringify(p.research.verified_facts):'(none)'}\nBanned words detected: ${bw.join(', ')||'none'}\n\nReturn JSON only: {"approved":true|false,"issues":["precise issue"],"suggested_fixes":["..."]}`),extra_system:'Reject for banned words, unsourced numbers, invented client results, or pitchy tone.'});
      p.qc=q.json||{approved:true,issues:[]};
      if(p.qc.approved||round===1){ ev('Orchestrator',p.qc.approved?'Approved':'Delivering with open issues: '+(p.qc.issues||[]).join('; '),p.qc.approved?'done':'err'); p.decisions.push({at:Date.now(),by:'orchestrator',decision:p.qc.approved?'approved':'delivered with issues'}); break; }
      issues=(p.qc.issues||[]).concat(p.qc.suggested_fixes||[]).join('\n'); ev('Orchestrator','Rejected: '+(p.qc.issues||[]).join('; '),'err'); p.versions.push({at:Date.now(),marketing:p.marketing,qc:p.qc,rejected:true});
    }

    if(chain.includes('content-creative')){
      step('Creative','writing the production brief'); ev('Orchestrator','Content & Creative Agent assigned','handoff'); p.agents.push('content-creative');
      const c=await runTask({assigned_agent:'content-creative',objective:'Creative brief for: '+p.plan.objective,expected_output:'JSON creative brief',
        input:text(`Format: ${p.plan.format||'Instagram/LinkedIn post 1080x1350'}\nHeadline to place: ${p.marketing?p.marketing.headline:p.plan.objective}\nBrief: ${p.marketing?(p.marketing.creative_brief||p.marketing.key_message):p.plan.context_for_agents}\n\nReturn JSON only:\n{"format":"...","dimensions":"1080x1350","concept":"one sentence","visual_direction":"...","image_prompt":"complete text-to-image prompt, no text in image, lower-left negative space","layout":"...","typography":"...","video_prompt":"optional 5-8s clip"}`)});
      p.creative=c.json||{concept:c.text}; ev('Content & Creative Agent','Brief ready: '+(p.creative.concept||''),'done'); renderCenter();
      const ca=agent('content-creative'), hig=reg('higgsfield');
      if(ca.tools.includes('higgsfield')&&p.creative.image_prompt){
        if(connReady(hig)){
          step('Image','Higgsfield generating'); ev('Content & Creative Agent','Generating image with Higgsfield','tool'); p.tools.push('higgsfield');
          try{
            const g=await api('/api/image',{prompt:p.creative.image_prompt,aspect_ratio:'4:5',keys:localKeys()});
            if(g.images&&g.images.length){ p.images=g.images; ev('Content & Creative Agent','Image generated in '+Math.round((g.ms||0)/1000)+'s','done'); }
            else if(g.status==='in_progress'){ p.imageRequestId=g.request_id; p.creativeNote='Still generating — press Check image below.'; ev('Content & Creative Agent','Generation still running — resume with Check image','err'); }
            else { p.creativeNote='Higgsfield: '+(g.error||g.status); ev('Content & Creative Agent',p.creativeNote,'err'); }
          }catch(e){ p.creativeNote='Image generation failed: '+e.message; ev('Content & Creative Agent',p.creativeNote,'err'); }
        } else { p.creativeNote='Add your Higgsfield key ID and secret in Keys to generate this asset.'; ev('Content & Creative Agent','Higgsfield not connected — production prompt delivered instead','err'); }
        renderCenter();
      }
    }
    for(const id of chain){ if(['research','marketing-strategist','content-creative'].includes(id)) continue;
      setBusy(true,agent(id).name); ev('Orchestrator',agent(id).name+' assigned','handoff'); p.agents.push(id);
      const g=await runTask({assigned_agent:id,objective:p.plan.objective,context:p.plan.context_for_agents,input:text(`Task: ${p.plan.objective}\n${p.research?'Research: '+JSON.stringify(p.research):''}\n${p.marketing?'Marketing draft: '+JSON.stringify(p.marketing):''}\nDeliver in markdown.`)});
      p.extra=(p.extra||[]).concat([{agent:agent(id).name,text:g.text}]); ev(agent(id).name,'Done','done');
    }
    if(p.type!=='social_post'&&!(p.marketing&&p.marketing.document)&&chain.length&&!chain.includes('marketing-strategist')){
      step('Done','composing deliverable'); ev('Orchestrator','Composing final deliverable');
      const f=await runTask({assigned_agent:'orchestrator',objective:'Compose final deliverable: '+p.plan.objective,expected_output:'markdown',input:text(`Type: ${p.type}\n${p.research?'Research: '+JSON.stringify(p.research):''}\n${p.extra?'Agent outputs: '+JSON.stringify(p.extra):''}\nBe concise, machine-plain, every number sourced.`)});
      p.final=f.text;
    }
    p.summary=p.plan.objective; p.status='COMPLETED'; step('Done','output ready'); ev('Orchestrator','Output ready','done');
    S.projects.unshift(p); await saveProject(p); renderCenter(); if(S.tab==='projects') renderRight();
    sysMsg('Done — '+p.agents.length+' employees, '+[...new Set(p.tools)].length+' tools, '+p.sources.length+' sources.'+(S.persistent?' Saved.':' Saved in memory only (no KV configured).'));
  }catch(e){ p.status='FAILED'; p.error=e.message; ev('System','Error: '+e.message,'err'); sysMsg('Stopped: '+e.message); renderCenter(); S.projects.unshift(p); await saveProject(p); }
  finally{ setBusy(false); S.files=[]; $('#filelist').textContent=''; streamEl=null; }
}

// ---- share (user-triggered, real connectors)
function postText(p){ const m=p.marketing||{}; return [m.headline,'',m.body,'',m.cta,(m.hashtags||[]).join(' ')].filter(x=>x!==undefined).join('\n').trim()||p.final||p.brief; }
async function share(p,kind){
  if(S.busy) return; const note=t=>{ p.shareNote=t; const n=$('#sharenote'); if(n) n.textContent=t; };
  if(kind==='copy'){ try{ await navigator.clipboard.writeText(postText(p)); note('Caption copied'); }catch(e){ note('Copy blocked — select the text manually'); } return; }
  const conn={gmail:'gmail',slack:'slack',gdrive:'gdrive',canva:'canva'}[kind]; const c=reg(conn);
  if(!c||!connReady(c)){ note((c?c.name:kind)+' is not connected. Add '+(c?c.required_env.join(', '):'credentials')+' in Settings.'); return; }
  const t=postText(p), img=p.images[0]||''; let task='', who='orchestrator';
  if(kind==='gmail'){ const to=prompt('Draft to (email)'); if(!to) return; task=`Create a Gmail DRAFT (do not send) to ${to}. Subject: "Joroots post — ${(p.marketing||{}).headline||p.title}". Body:\n${t}${img?'\nImage: '+img:''}\nReply with the draft link or id.`; }
  if(kind==='slack'){ const ch=prompt('Slack channel','#general'); if(!ch) return; task=`Post to Slack channel ${ch}:\n${t}${img?'\n'+img:''}\nReply with the permalink or "posted".`; }
  if(kind==='gdrive'){ task=`Create a Google Doc named "Joroots — ${(p.marketing||{}).headline||p.title}" with:\n${t}\n\nCreative brief: ${JSON.stringify(p.creative||{})}\nSources: ${p.sources.map(s=>s.url).join(', ')}\nReply with the document link.`; }
  if(kind==='canva'){ who='content-creative'; task=`Create a Canva Instagram portrait design 1080x1350. Headline: "${(p.marketing||{}).headline||''}". Footer: "joroots.com". Palette paper #F2F0EB, ink #161616, vermilion #E8461E. ${img?'Background image URL if supported: '+img:''} Reply with the design edit URL only.`; }
  setBusy(true,'Sharing via '+kind); note('Working…'); newStream(); ev('Orchestrator','Share: '+kind,'tool');
  try{ const r=await runTask({assigned_agent:who,objective:'Share via '+kind,mcp:[conn],input:text(task),extra_system:'Execute the share action the user requested. Call the tool. Reply with the resulting link or id, or FAILED and the reason.'});
    const link=(r.text.match(/https?:\/\/[^\s"'<>)]+/)||[])[0]; if(kind==='canva'&&link) p.canvaUrl=link;
    note(link||r.text.slice(0,200)); ev('Orchestrator',link?'Shared: '+link:r.text.slice(0,120),link?'done':'err'); await saveProject(p); if(link&&kind==='canva') renderCenter();
  }catch(e){ note('Failed: '+e.message); ev('Orchestrator','Share failed: '+e.message,'err'); } finally{ setBusy(false); streamEl=null; }
}

// ---- center
function renderCenter(){
  const v=S.view, w=$('#ws');
  if(v.mode==='employee') return w.innerHTML=employeeHTML(v.id), bindEmployee(v.id);
  if(v.mode==='add') return w.innerHTML=addHTML(), bindAdd();
  if(v.mode==='keys') return w.innerHTML=keysHTML(), bindKeys();
  if(v.mode!=='work'||!v.project){
    w.innerHTML=`<div class="empty"><h1 class="disp">What do you need built?</h1><p>The Orchestrator reads the request, checks the Joroots knowledge base, and routes to Research, Marketing and Creative only when needed. The result lands here.</p><p>Try one:</p>
    <button class="ex" data-ex="Create a Joroots social media post explaining how AI orchestration can help SMEs in Jordan.">Create a Joroots social media post explaining how AI orchestration can help SMEs in Jordan.</button>
    <button class="ex" data-ex="Research the AI adoption rate among SMEs in Jordan and the Gulf in 2025–2026, with sources.">Research AI adoption among SMEs in Jordan and the Gulf, with sources.</button>
    <button class="ex" data-ex="Write a 2-week LinkedIn content plan for Joroots built on the LeanGene and Millian case numbers.">Write a 2-week LinkedIn content plan built on the LeanGene and Millian case numbers.</button></div>`;
    w.querySelectorAll('.ex').forEach(b=>b.onclick=()=>{ $('#input').value=b.dataset.ex; $('#input').focus(); }); return;
  }
  w.innerHTML=projectHTML(v.project);
  w.querySelectorAll('[data-share]').forEach(b=>b.onclick=()=>share(v.project,b.dataset.share));
  const rg=w.querySelector('#regen'); if(rg) rg.onclick=()=>run(v.project.brief);
  const ap=w.querySelector('#approve'); if(ap) ap.onclick=async()=>{ v.project.approved=!v.project.approved; v.project.decisions.push({at:Date.now(),by:'user',decision:v.project.approved?'approved':'approval removed'}); await saveProject(v.project); renderCenter(); };
  const ci=w.querySelector('#checkimg'); if(ci) ci.onclick=async()=>{ ci.textContent='Checking…';
    try{ const g=await api('/api/image',{request_id:v.project.imageRequestId,keys:localKeys()});
      if(g.images&&g.images.length){ v.project.images=g.images; v.project.creativeNote=''; await saveProject(v.project); renderCenter(); }
      else { ci.textContent='Still '+g.status+' — check again'; } }catch(e){ ci.textContent='Failed: '+e.message; } };
  const ex=w.querySelector('#export'); if(ex) ex.onclick=()=>{ const blob=new Blob([JSON.stringify(v.project,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=v.project.id+'.json'; a.click(); };
}
function projectHTML(p){
  const m=p.marketing,c=p.creative,r=p.research; let h=`<div class="ws">`;
  h+=`<div class="meta">${esc(p.type||'planning')} · ${esc(p.status||'')} · ${new Date(p.created).toLocaleString()}${p.approved?' · approved':''}</div>`;
  h+=p.plan?`<h1 class="disp">${esc(p.plan.objective)}</h1><div class="meta">Audience: ${esc(p.plan.audience||'')} · ${esc(p.plan.format||'')}</div>`:`<h1 class="disp">${esc(p.title)}</h1>`;
  if(p.error) h+=`<div class="card issue"><h3>Stopped</h3>${esc(p.error)}</div>`;
  if(p.type==='social_post'||m){
    h+=`<div class="post"><div><div class="canvas">`+(p.images[0]?`<img src="${esc(p.images[0])}" alt="">`:`<div class="ph">${esc(p.creativeNote||(c?'Image pending':'Creative direction pending'))}</div>`)+(m?`<div class="ovl"><div class="h disp">${esc(m.headline||'')}</div><div class="m">JOROOTS.COM · AMMAN</div></div>`:'')+`</div>
      <div class="meta" style="margin-top:8px">${esc(c?c.dimensions||'1080×1350':'1080×1350')}${p.images[0]?' · <a href="'+esc(p.images[0])+'" target="_blank">open image</a>':''}${p.canvaUrl?' · <a href="'+esc(p.canvaUrl)+'" target="_blank">open in Canva</a>':''}</div></div>`;
    h+=`<div class="copy">`+(m?`<div class="hook">${esc(m.headline||'')}</div><div class="body">${esc(m.body||'')}</div><div class="cta">${esc(m.cta||'')}</div><div class="tags">${esc((m.hashtags||[]).join(' '))}</div>${m.proof_points&&m.proof_points.length?`<h2>Proof points</h2><ul class="list">${m.proof_points.map(x=>'<li>'+esc(x)+'</li>').join('')}</ul>`:''}`:'<div class="meta">Copy pending</div>')+`</div></div>`;
    if(m&&m.document) h+=`<h2>Document</h2><div class="md">${md(m.document)}</div>`;
  }
  if(p.final) h+=`<h2>Deliverable</h2><div class="md">${md(p.final)}</div>`;
  (p.extra||[]).forEach(x=>{ h+=`<h2>${esc(x.agent)}</h2><div class="md">${md(x.text)}</div>`; });
  if(c) h+=`<h2>Creative direction</h2><div class="card"><dl class="kv">${['concept','visual_direction','layout','typography','image_prompt','video_prompt'].filter(k=>c[k]).map(k=>`<dt>${esc(k.replace('_',' '))}</dt><dd>${esc(c[k])}</dd>`).join('')}</dl></div>`;
  if(r) h+=`<h2>Research</h2><div class="grid2"><div class="card"><h3>Verified facts <span class="tag v">SOURCED</span></h3><ul class="list">${(r.verified_facts||[]).map(f=>`<li>${esc(f.fact)} <span class="src">— ${f.url?`<a href="${esc(f.url)}" target="_blank">${esc(f.source||f.url)}</a>`:esc(f.source||'')}</span></li>`).join('')||'<li>None</li>'}</ul></div>
    <div><div class="card"><h3>Derived insights</h3><ul class="list">${(r.derived_insights||[]).map(x=>'<li>'+esc(x)+'</li>').join('')||'<li>None</li>'}</ul></div><div class="card"><h3>Assumptions <span class="tag a">UNVERIFIED</span></h3><ul class="list">${(r.assumptions||[]).map(x=>'<li>'+esc(x)+'</li>').join('')||'<li>None</li>'}</ul></div><div class="card"><h3>Unknowns</h3><ul class="list">${(r.unknowns||r.missing||[]).map(x=>'<li>'+esc(x)+'</li>').join('')||'<li>None</li>'}</ul></div>${r.recommendations&&r.recommendations.length?`<div class="card"><h3>Recommendations</h3><ul class="list">${r.recommendations.map(x=>'<li>'+esc(x)+'</li>').join('')}</ul></div>`:''}</div></div>`;
  if(p.sources.length) h+=`<h2>Sources</h2><ul class="list src">${p.sources.map(s=>`<li><a href="${esc(s.url)}" target="_blank">${esc(s.title)}</a></li>`).join('')}</ul>`;
  if(p.qc) h+=`<h2>Quality review</h2><div class="card">${p.qc.approved?'Approved.':'<span class="issue">Open issues:</span>'}<ul class="list">${(p.qc.issues||[]).map(x=>'<li>'+esc(x)+'</li>').join('')}</ul></div>`;
  if(p.status!=='PLANNING'&&p.status!=='RUNNING') h+=`<div class="share"><button class="btn ghost" id="approve">${p.approved?'Remove approval':'Approve'}</button><button class="btn ghost" id="regen">Regenerate</button><button class="btn ghost" id="export">Export JSON</button>${p.imageRequestId&&!p.images.length?'<button class="btn verm" id="checkimg">Check image</button>':''}<button class="btn ghost" data-share="gmail">Email draft</button><button class="btn ghost" data-share="slack">Slack</button><button class="btn ghost" data-share="gdrive">Drive</button><button class="btn ghost" data-share="canva">Canva</button><button class="btn ghost" data-share="copy">Copy caption</button><span class="note" id="sharenote">${esc(p.shareNote||'')}</span></div>`;
  h+=`<h2>Trace</h2><div class="card"><dl class="kv"><dt>Agents</dt><dd>${esc(p.agents.map(a=>agent(a)?agent(a).name:a).join(' → '))}</dd><dt>Tools</dt><dd>${esc([...new Set(p.tools)].map(t=>reg(t)?reg(t).name:t).join(', '))}</dd><dt>Tasks</dt><dd>${(p.tasks||[]).map(t=>esc(t.assigned_agent+' · '+t.status+(t.result?' · '+t.result.provider+'/'+t.result.model+' · '+t.result.ms+'ms':'')+(t.error?' · '+t.error:''))).join('<br>')}</dd>${p.models&&p.models.length?`<dt>Models used</dt><dd>${esc([...new Set(p.models)].join(', '))}</dd>`:''}${p.versions.length?`<dt>Versions</dt><dd>${p.versions.length+1}</dd>`:''}</dl></div>`;
  h+=`<div class="activity card"><h3>Activity</h3>${p.activity.map(e=>`<div class="ev ${e.kind}"><span class="who">${esc(e.who)}</span><span class="t">${esc(e.text)}</span></div>`).join('')}</div>`;
  return h+'</div>';
}
function md(t){ t=esc(t||''); t=t.replace(/^### (.*)$/gm,'<h3>$1</h3>').replace(/^## (.*)$/gm,'<h2>$1</h2>').replace(/^# (.*)$/gm,'<h1>$1</h1>').replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/`([^`]+)`/g,'<code>$1</code>');
  t=t.replace(/^(?:\|.*\|\s*\n?)+/gm,tb=>{ const rows=tb.trim().split('\n').filter(r=>!/^\|[\s:\-|]+\|$/.test(r)); return '<table>'+rows.map((r,i)=>'<tr>'+r.split('|').slice(1,-1).map(c=>(i?'<td>':'<th>')+c.trim()+(i?'</td>':'</th>')).join('')+'</tr>').join('')+'</table>'; });
  t=t.replace(/^(?:[-*] .*\n?)+/gm,b=>'<ul>'+b.trim().split('\n').map(l=>'<li>'+l.replace(/^[-*] /,'')+'</li>').join('')+'</ul>').replace(/^(?:\d+\. .*\n?)+/gm,b=>'<ol>'+b.trim().split('\n').map(l=>'<li>'+l.replace(/^\d+\. /,'')+'</li>').join('')+'</ol>');
  return t.split(/\n{2,}/).map(x=>/^<(h\d|ul|ol|table)/.test(x.trim())?x:'<p>'+x.replace(/\n/g,'<br>')+'</p>').join(''); }

// ---- employee profile
function employeeHTML(id){
  const a=agent(id), init=a.name.split(' ').map(x=>x[0]).slice(0,2).join('');
  const installed=(a.skills||[]).map(s=>[s,S.cfg.skills[s]]).filter(x=>x[1]); const available=Object.entries(S.cfg.skills).filter(([k])=>!a.skills.includes(k));
  const cats=[...new Set(S.cfg.knowledge.map(k=>k.category))]; const projs=S.projects.filter(p=>p.agents.includes(id)); const acts=S.events.filter(e=>e.who===a.name).slice(-12).reverse();
  const dept=(S.cfg.departments.find(d=>d.id===a.department)||{}).name||a.department; const cur=Object.values(S.agentBusy).some(Boolean)&&S.agentBusy[id]?(S.current?S.current.title:'working'):'—';
  return `<div class="ws prof"><button class="btn ghost sm" id="back">← Workspace</button>
  <div class="head" style="margin-top:14px"><div class="av">${esc(init)}</div><div><h1 class="disp">${esc(a.name)}</h1><div class="sub">${esc(a.role)} · ${esc(dept)} · ${S.agentBusy[id]?'Working':a.status==='active'?'Active':'Paused'} · current task: ${esc(cur)}</div></div>
    <div style="margin-left:auto" class="row"><span style="font-size:12px;color:var(--mute)">Active</span><button class="sw ${a.status==='active'?'on':''}" id="status"></button></div></div>
  <div class="grid2">
  <section><h2>Skills</h2>${installed.map(([k,s])=>`<div class="tool"><div class="n">${esc(s.name)}<small>${esc(s.body.slice(0,100))}…</small></div><button class="btn ghost sm" data-rm="${k}">Remove</button></div>`).join('')||'<div class="meta">No skills installed</div>'}
    <div class="row" style="margin-top:8px"><select class="add" id="addskill"><option value="">Add skill…</option>${available.map(([k,s])=>`<option value="${k}">${esc(s.name)} (${s.department})</option>`).join('')}</select></div></section>
  <section><h2>Tools <span class="meta">(least privilege — only what this employee needs)</span></h2>${S.cfg.registry.filter(r=>r.kind!=='model').map(r=>`<div class="tool"><div class="n">${esc(r.name)}<small>${esc(r.status)}${r.missing&&r.missing.length?' · needs '+esc(r.missing.join(', ')):''}${r.notes?' · '+esc(r.notes):''}</small></div><button class="sw ${a.tools.includes(r.id)?'on':''}" data-tool="${r.id}"></button></div>`).join('')}</section>
  <section><h2>Knowledge</h2>${cats.map(k=>`<div class="tool"><div class="n">${esc(k)}<small>${S.cfg.knowledge.filter(x=>x.category===k).map(x=>esc(x.title)).join(' · ')}</small></div><button class="sw ${a.knowledge.includes(k)?'on':''}" data-know="${k}"></button></div>`).join('')}</section>
  <section><h2>Projects (${projs.length})</h2>${projs.slice(0,10).map(p=>`<button class="proj" data-open="${p.id}"><div class="t">${esc(p.title)}</div><div class="d">${esc(p.type)} · ${esc(p.status||'')} · ${new Date(p.created).toLocaleDateString()}</div></button>`).join('')||'<div class="meta">No projects yet</div>'}</section>
  </div>
  <section><h2>Activity</h2><div class="activity">${acts.map(e=>`<div class="ev ${e.kind}"><span class="who">${new Date(e.t).toLocaleTimeString()}</span><span class="t">${esc(e.text)}</span></div>`).join('')||'<div class="meta">Nothing yet this session</div>'}</div></section>
  <section><h2>Configuration</h2><div class="form"><label>Model provider</label><select id="prov"><option value="auto" ${!a.model||a.model.provider==='auto'?'selected':''}>Auto — first available, with fallback</option>${S.cfg.providers.map(p=>`<option value="${p.id}" ${a.model&&a.model.provider===p.id?'selected':''} ${providerReady(p)?'':'disabled'}>${esc(p.name)}${providerReady(p)?'':' — no key'}</option>`).join('')}</select>
  <div class="meta" style="margin-top:4px">Fallback order: ${esc(S.cfg.providers.filter(providerReady).map(p=>p.name).join(' → ')||'none configured')}. Gmail, Slack, Drive and Canva need Anthropic. Higgsfield images do not.</div>
  <label>Instructions</label><textarea id="instr" style="min-height:140px">${esc(a.instructions)}</textarea></div>
  <dl class="kv" style="margin-top:10px"><dt>Permissions</dt><dd>${esc(JSON.stringify(a.permissions||{}))}</dd></dl>
  <div class="row" style="margin-top:10px"><button class="btn" id="saveinstr">Save configuration</button><span class="meta" id="savedmsg"></span></div></section></div>`;
}
function bindEmployee(id){
  const a=agent(id), w=$('#ws');
  $('#back').onclick=()=>{ S.view={mode:S.current?'work':'empty',project:S.current}; renderCenter(); };
  $('#status').onclick=async()=>{ await updateAgent(id,{status:a.status==='active'?'paused':'active'}); renderCenter(); renderRight(); };
  w.querySelectorAll('[data-rm]').forEach(b=>b.onclick=async()=>{ await updateAgent(id,{skills:a.skills.filter(s=>s!==b.dataset.rm)}); renderCenter(); });
  $('#addskill').onchange=async e=>{ if(e.target.value){ await updateAgent(id,{skills:a.skills.concat([e.target.value])}); renderCenter(); } };
  w.querySelectorAll('[data-tool]').forEach(b=>b.onclick=async()=>{ const t=b.dataset.tool; await updateAgent(id,{tools:a.tools.includes(t)?a.tools.filter(x=>x!==t):a.tools.concat([t])}); renderCenter(); });
  w.querySelectorAll('[data-know]').forEach(b=>b.onclick=async()=>{ const t=b.dataset.know; await updateAgent(id,{knowledge:a.knowledge.includes(t)?a.knowledge.filter(x=>x!==t):a.knowledge.concat([t])}); renderCenter(); });
  w.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openProject(b.dataset.open));
  $('#saveinstr').onclick=async()=>{ await updateAgent(id,{instructions:$('#instr').value,model:{...(a.model||{}),provider:$('#prov').value}}); $('#savedmsg').textContent='Saved'; };
}
function openProject(id){ const p=S.projects.find(x=>x.id===id); if(!p) return; S.view={mode:'work',project:p}; renderCenter(); }

// ---- keys (browser-local)
function keysHTML(){
  const k=localKeys(); const mask=v=>v?v.slice(0,6)+'…'+v.slice(-4):'';
  const rows=[['groq','Groq — free, no card, start here','console.groq.com'],['tavily','Tavily — web search for Research, 1,000/month free','tavily.com'],['higgsfield_id','Higgsfield key ID — image generation','cloud.higgsfield.ai'],['higgsfield_secret','Higgsfield key secret','cloud.higgsfield.ai'],['gemini','Google Gemini — free tier trains on your inputs; use a billing-enabled key for client work','aistudio.google.com'],['anthropic','Anthropic — only for the Gmail/Slack/Drive/Canva share buttons','console.anthropic.com'],['openrouter','OpenRouter — fallback','openrouter.ai'],['mistral','Mistral — EU hosting','console.mistral.ai']];
  const ENV={...KEY_ENV,higgsfield_id:'HIGGSFIELD_API_KEY_ID',higgsfield_secret:'HIGGSFIELD_API_KEY_SECRET'};
  return `<div class="ws prof"><button class="btn ghost sm" id="back">← Workspace</button>
  <h1 class="disp" style="margin-top:14px">Keys</h1>
  ${storageOK()?'':'<p class="meta" style="color:#A32B12">This browser is blocking local storage (private window, or cookies disabled). Keys will work for this session but disappear when you close the tab. Use Vercel environment variables for anything lasting.</p>'}
  <p class="meta">Keys save automatically as you type — you can leave this page and come back. Saved in this browser only and sent with your own requests. It is never written to the repo and never stored on the server. Good for testing on your own machine. For the team, or for anything permanent, put the same key in Vercel → Settings → Environment Variables instead — then you can clear it here.</p>
  <div class="form">${rows.map(([id,label,where])=>`<label>${esc(label)} <span class="meta">· ${esc(where)}</span></label>
    <div class="row"><input id="k-${id}" type="password" placeholder="${esc(ENV[id])}" value="${esc(k[ENV[id]]||'')}" style="flex:1">
    ${id==='higgsfield_secret'?'<button class="btn ghost sm" data-test="higgsfield">Test</button>':id==='higgsfield_id'?'':`<button class="btn ghost sm" data-test="${id}">Test</button>`}</div>
    <div class="meta" id="m-${id}">${k[ENV[id]]?'saved in this browser · '+esc(mask(k[ENV[id]])):''}</div>`).join('')}
  <div class="row" style="margin-top:16px"><button class="btn" id="ksave">Save keys</button><button class="btn ghost" id="kclear">Clear all</button><span class="meta" id="kmsg"></span></div></div></div>`;
}
function bindKeys(){
  const w=$('#ws'); const ENV={...KEY_ENV,higgsfield_id:'HIGGSFIELD_API_KEY_ID',higgsfield_secret:'HIGGSFIELD_API_KEY_SECRET'};
  const ids=['groq','tavily','higgsfield_id','higgsfield_secret','gemini','anthropic','openrouter','mistral'];
  $('#back').onclick=()=>{ S.view={mode:S.current?'work':'empty',project:S.current}; renderCenter(); };
  const collect=()=>{ const o=localKeys(); ids.forEach(id=>{ const el=$('#k-'+id); if(!el) return; const v=el.value.trim(); if(v) o[ENV[id]]=v; else delete o[ENV[id]]; }); return o; };
  // Auto-save on every keystroke (debounced) so a key can never be lost by navigating away.
  let t=null;
  ids.forEach(id=>{ const el=$('#k-'+id); if(!el) return;
    const persist=()=>{ setLocalKeys(collect()); const m=$('#m-'+id); if(m&&el.value.trim()) m.textContent='saved in this browser'; else if(m) m.textContent=''; $('#kmsg').textContent='Saved'; if(Object.keys(localKeys()).length) $('#banner').style.display='none'; };
    el.addEventListener('input',()=>{ clearTimeout(t); t=setTimeout(persist,400); });
    el.addEventListener('blur',persist);
    el.addEventListener('paste',()=>setTimeout(persist,50));
  });
  $('#ksave').onclick=()=>{ setLocalKeys(collect()); $('#kmsg').textContent='Saved in this browser'; $('#banner').style.display='none'; renderRight(); };
  $('#kclear').onclick=()=>{ if(!confirm('Remove all keys from this browser?')) return; setLocalKeys({}); renderCenter(); renderRight(); };
  w.querySelectorAll('[data-test]').forEach(b=>b.onclick=async()=>{ const id=b.dataset.test, m=$('#m-'+(id==='higgsfield'?'higgsfield_secret':id)); m.textContent=id==='higgsfield'?'Generating a test image, up to 40s…':'Testing…'; setLocalKeys(collect());
    try{ const r=await api('/api/connectors/test',{id,keys:localKeys()}); m.textContent=(r.ok?'Works — ':'Failed — ')+r.message; if(r.ok) $('#banner').style.display='none'; }catch(e){ m.textContent='Failed — '+e.message; } });
}

// ---- add employee
function addHTML(){
  return `<div class="ws prof"><button class="btn ghost sm" id="back">← Workspace</button><h1 class="disp" style="margin-top:14px">Add employee</h1><div class="form">
  <label>Name</label><input id="f-name" placeholder="Proposal Writer"><label>Department</label><select id="f-dept">${S.cfg.departments.map(d=>`<option value="${d.id}">${esc(d.name)}</option>`).join('')}<option value="__new">New department…</option></select>
  <label>Role</label><input id="f-role" placeholder="Writes tender proposals from the capability base"><label>Mission</label><input id="f-mission"><label>Responsibilities</label><textarea id="f-resp"></textarea>
  <label>Model</label><select id="f-model"><option value="auto">Auto — first available</option>${S.cfg.providers.map(p=>`<option value="${p.id}" ${providerReady(p)?'':'disabled'}>${esc(p.name)}${providerReady(p)?'':' — no key'}</option>`).join('')}</select>
  <label>Skills</label><div>${Object.entries(S.cfg.skills).map(([k,s])=>`<label class="chk"><input type="checkbox" name="sk" value="${k}"> ${esc(s.name)}</label>`).join('')}</div>
  <label>Tools</label><div>${S.cfg.registry.filter(r=>r.kind!=='model').map(r=>`<label class="chk"><input type="checkbox" name="tl" value="${r.id}" ${r.id==='knowledge'?'checked':''}> ${esc(r.name)}</label>`).join('')}</div>
  <label>Knowledge access</label><div>${[...new Set(S.cfg.knowledge.map(k=>k.category))].map(k=>`<label class="chk"><input type="checkbox" name="kn" value="${k}" ${['company','brand'].includes(k)?'checked':''}> ${esc(k)}</label>`).join('')}</div>
  <label>Permissions</label><div><label class="chk"><input type="checkbox" id="f-email"> can send email</label><label class="chk"><input type="checkbox" id="f-media"> can generate media</label><label class="chk"><input type="checkbox" id="f-web"> can search web</label></div>
  <div class="row" style="margin-top:14px"><button class="btn" id="f-save">Create employee</button><span class="meta" id="f-msg"></span></div></div></div>`;
}
function bindAdd(){
  $('#back').onclick=()=>{ S.view={mode:S.current?'work':'empty',project:S.current}; renderCenter(); };
  $('#f-save').onclick=async()=>{ const g=id=>$('#'+id).value.trim(); const ck=n=>[...document.querySelectorAll('input[name="'+n+'"]:checked')].map(x=>x.value);
    let dept=g('f-dept'); if(dept==='__new'){ dept=(prompt('New department id (e.g. sales)')||'').toLowerCase().replace(/[^a-z0-9]+/g,'-'); if(!dept) return; }
    if(!g('f-name')) return $('#f-msg').textContent='Name is required';
    const a={name:g('f-name'),department:dept,role:g('f-role'),mission:g('f-mission'),responsibilities:g('f-resp'),model:{provider:g('f-model'),model:'default',fallback:'auto'},skills:ck('sk'),tools:['anthropic'].concat(ck('tl')),knowledge:ck('kn'),permissions:{can_send_email:$('#f-email').checked,can_generate_media:$('#f-media').checked,can_search_web:$('#f-web').checked}};
    try{ const r=await api('/api/config',{action:'add_agent',agent:a}); await loadCfg(); renderRight(); S.view={mode:'employee',id:r.agent.id}; renderCenter(); }catch(e){ $('#f-msg').textContent=e.message; } };
}

// ---- right panel
function renderRight(){
  document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===S.tab)); const r=$('#rbody');
  if(S.tab==='depts'){
    r.innerHTML=S.cfg.departments.map(d=>`<div class="dept"><h4>${esc(d.name)}</h4>${S.cfg.agents.filter(a=>a.department===d.id).map(a=>`<button class="emp" data-id="${a.id}"><div class="av ${a.status==='active'?'':'off'}">${esc(a.name.split(' ').map(x=>x[0]).slice(0,2).join(''))}</div><div><div class="nm">${esc(a.name)}</div><div class="rl">${esc(a.role)}</div></div><div class="st ${S.agentBusy[a.id]?'busy':''}"></div></button>`).join('')}</div>`).join('')+`<button class="plus" id="addemp">+ Add employee</button>`;
    r.querySelectorAll('.emp').forEach(b=>b.onclick=()=>{ S.view={mode:'employee',id:b.dataset.id}; renderCenter(); }); $('#addemp').onclick=()=>{ S.view={mode:'add'}; renderCenter(); };
  } else if(S.tab==='projects'){
    r.innerHTML=(S.projects.map(p=>`<button class="proj" data-open="${p.id}"><div class="t">${esc(p.title)}</div><div class="d">${esc(p.type||'')} · ${esc(p.status||'')} · ${new Date(p.created).toLocaleDateString()}${p.images.length?' · image':''}</div></button>`).join('')||'<div class="meta">No projects yet.</div>')+(S.projects.length?`<button class="plus" id="clearproj">Clear library</button>`:'');
    r.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openProject(b.dataset.open)); const c=$('#clearproj'); if(c) c.onclick=async()=>{ if(confirm('Delete all projects?')){ await api('/api/projects',{action:'clear'}); S.projects=[]; renderRight(); S.view={mode:'empty'}; renderCenter(); } };
  } else {
    r.innerHTML=S.cfg.registry.map(x=>`<div class="reg"><b>${esc(x.name)}</b><span class="s ${connReady(x)?'ok':'no'}">${connReady(x)?(x.status==='CONNECTED'?'CONNECTED':'CONNECTED (browser key)'):esc(x.status)}${!connReady(x)&&x.missing&&x.missing.length?' · '+esc(x.missing.join(', ')):''}</span><div>${esc((x.available_actions||[]).join(' · '))}</div><div class="s">Used by: ${esc(x.assigned_agents.map(a=>agent(a)?agent(a).name:a).join(', ')||'—')}</div></div>`).join('')+`<a class="plus" href="/settings" style="display:block;text-decoration:none">Manage in Settings</a>`;
  }
}

// ---- input
$('#send').onclick=()=>{ const t=$('#input').value; $('#input').value=''; run(t); };
$('#input').addEventListener('keydown',e=>{ if(e.key==='Enter'&&(e.metaKey||e.ctrlKey)) $('#send').click(); });
$('#attach').onclick=()=>$('#file').click();
$('#file').onchange=async e=>{ for(const f of e.target.files){ const b64=await new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result.split(',')[1]); r.onerror=rej; r.readAsDataURL(f); });
    S.files.push({name:f.name,block:f.type.startsWith('image/')?{type:'image',source:{type:'base64',media_type:f.type,data:b64}}:f.type==='application/pdf'?{type:'document',source:{type:'base64',media_type:'application/pdf',data:b64}}:{type:'text',text:'Attached file '+f.name+':\n'+atob(b64)}}); }
  $('#filelist').textContent=S.files.map(f=>f.name).join(', '); e.target.value=''; };
$('#mic').onclick=()=>{ const SR=window.SpeechRecognition||window.webkitSpeechRecognition; if(!SR) return sysMsg('Voice input is not available in this browser.'); try{ const r=new SR(); r.lang='en-US'; r.onresult=e=>{ $('#input').value+=(($('#input').value?' ':'')+e.results[0][0].transcript); }; r.onerror=e=>sysMsg('Voice failed: '+e.error); r.start(); sysMsg('Listening…'); }catch(e){ sysMsg('Voice failed: '+e.message); } };
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{ S.tab=b.dataset.tab; renderRight(); });
const keysLink=document.getElementById('keyslink'); if(keysLink) keysLink.onclick=e=>{ e.preventDefault(); S.view={mode:'keys'}; renderCenter(); };
boot();
