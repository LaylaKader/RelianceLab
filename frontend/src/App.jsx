import { useEffect, useMemo, useState } from "react";
import { api } from "./api";

const ACTIONS = { accept: "Accepted AI", reject: "Rejected AI", verify: "Chose to verify" };
const initialDraft = { title: "", domain: "Education", prompt: "", recommendation: "", confidence: 70, uncertainty: "", evidence: "", question: "", options: ["", "", ""] };

function download(name, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = name; link.click();
  URL.revokeObjectURL(url);
}
function csvCell(value) { return '"' + String(value ?? "").replaceAll('"', '""') + '"'; }

function Metric({ value, label }) {
  return <div className="metric"><strong>{value}</strong><span>{label}</span></div>;
}
function TabButton({ active, onClick, children }) {
  return <button className={"tab " + (active ? "active" : "")} onClick={onClick}>{children}</button>;
}

function Lab({ scenarios, session, index, setIndex, choice, setChoice, action, feedback, loading, onStart, onDecide, onNext, onClear, orderCondition }) {
  const current = scenarios[index];
  if (!session) return <section className="welcome">
    <div className="welcome-copy"><p className="eyebrow">PARTICIPANT WORKSPACE</p><h1>Explore how people<br/><em>rely on AI.</em></h1><p>Inspect a recommendation, look at the evidence, make your own judgement, and decide whether to accept, reject, or verify the AI. Then see a clear explanation of your choices.</p><button className="primary" onClick={onStart} disabled={loading || !scenarios.length}>{loading ? "Preparing session…" : "Begin a new session →"}</button><small>Anonymous session · Four scenarios · You can delete your session at any time</small></div>
    <div className="welcome-side"><span className="side-icon">◎</span><p className="eyebrow">WHAT YOU WILL DO</p><ol><li><b>Inspect</b><span>Read the AI claim, confidence and evidence.</span></li><li><b>Judge</b><span>Choose the conclusion supported by the evidence.</span></li><li><b>Decide</b><span>Accept, reject or verify the recommendation.</span></li><li><b>Reflect</b><span>See feedback and a descriptive session report.</span></li></ol><div className="notice">This is a scripted research prototype. It does not call a live AI model.</div></div>
  </section>;
  if (!current) return <section className="panel">Loading scenarios…</section>;
  return <section className="panel lab-panel">
    <div className="panel-head"><div><p className="eyebrow">GUIDED DECISION STUDY</p><h2>{current.title}</h2></div><span className="pill">{index + 1} / {scenarios.length}</span></div>
    <div className="progress"><i style={{ width: ((index + 1) / scenarios.length * 100) + "%" }}/></div>
    <div className="scenario-meta"><span>{current.category}</span><span>Order condition: {orderCondition}</span></div>
    <p className="scenario-prompt">{current.prompt}</p>
    <div className="ai-card"><div className="ai-top"><span>AI RECOMMENDATION</span><span className="confidence">Stated confidence: {Math.round(current.confidence * 100)}%</span></div><h3>{current.ai_recommendation}</h3><div className="evidence-grid"><div><b>Uncertainty disclosure</b><p>{current.uncertainty}</p></div><div><b>Evidence provided</b><p>{current.evidence}</p></div></div><small>Confidence is a fixed scenario attribute, not a calibrated model probability.</small></div>
    <div className="choice-columns"><div><p className="eyebrow">1 · YOUR EVIDENCE JUDGEMENT</p><h3>Which conclusion is best supported?</h3><div className="options">{current.options.map(o=><button key={o.id} disabled={!!action} className={"option "+(choice===o.id?"chosen":"")} onClick={()=>setChoice(o.id)}>{o.label}<b>{choice===o.id?"✓":"＋"}</b></button>)}</div></div>
      <div className="reliance-choice"><p className="eyebrow">2 · YOUR RELIANCE DECISION</p><h3>What would you do with the AI recommendation?</h3><p>These are separate measures: your answer is not the same thing as your willingness to rely on the AI.</p><div className="actions"><button disabled={!!action||loading} onClick={()=>onDecide("accept")}>Accept AI</button><button disabled={!!action||loading} onClick={()=>onDecide("reject")}>Reject AI</button><button disabled={!!action||loading} onClick={()=>onDecide("verify")}>Verify first</button></div></div></div>
    {feedback && <div className="feedback"><p className="eyebrow">FEEDBACK · {ACTIONS[feedback.action]}</p><h3>{feedback.ai_recommendation_correct?"The AI recommendation is supported":"The AI recommendation is not supported"}</h3><p>{feedback.rationale}</p><div className="evidence-grid"><div><b>Your answer</b><p>{feedback.answer_feedback}</p></div><div><b>Reliance interpretation</b><p>{feedback.reliance_explanation}</p></div></div><button className="primary" onClick={onNext}>{index + 1 === scenarios.length ? "Open session report →" : "Next scenario →"}</button></div>}
    <div className="panel-foot"><span>Responses are linked to a random session ID, not your name.</span><button className="text-button" onClick={onClear}>End session & delete data</button></div>
  </section>;
}

function Report({ report, onDelete }) {
  if (!report) return null;
  const total = report.decision_count;
  const answerRate = report.scored_decisions ? Math.round(report.correct_selected_count / report.scored_decisions * 100) + "%" : "—";
  const rows = report.decisions.map(d=>({scenario:d.scenario_title,category:d.category,action:ACTIONS[d.action],answer:d.selected_option_label||"No answer",answer_alignment:d.answer_feedback,reliance:d.reliance_explanation,ai_supported:d.ai_recommendation_correct?"Supported":"Unsupported",confidence:""}));
  const exportCSV = () => {
    const keys = ["scenario","category","action","answer","answer_alignment","reliance","ai_supported"];
    download("reliancelab-session.csv",[keys.join(","),...rows.map(row=>keys.map(k=>csvCell(row[k])).join(","))].join("\n"),"text/csv;charset=utf-8");
  };
  return <div className="report-view"><div className="panel-head"><div><p className="eyebrow">SESSION REPORT</p><h2>Your decision summary</h2><p className="subtle-text">Descriptive results from {total} of {report.scenario_count} scenarios.</p></div><span className="pill">{report.order_condition} order</span></div>
    <div className="metrics"><Metric value={total+"/"+report.scenario_count} label="Scenarios completed"/><Metric value={report.actions.accept} label="Accepted AI"/><Metric value={report.actions.verify} label="Verified first"/><Metric value={answerRate} label="Answer-key alignment"/></div>
    <div className="report-columns"><div className="report-card"><h3>Reliance actions</h3>{Object.entries(report.actions).map(([key,value])=><div className="bar-row" key={key}><span>{ACTIONS[key]}</span><div><i style={{width:(total?value/total*100:0)+"%"}}/></div><b>{value}</b></div>)}</div><div className="report-card"><h3>Acceptance versus evidence</h3><p>Accepted a supported recommendation: <b>{report.accepted_supported_recommendations}</b></p><p>Accepted an unsupported recommendation: <b>{report.accepted_unsupported_recommendations}</b></p><p>Did not accept a supported recommendation: <b>{report.did_not_accept_supported_recommendations}</b></p><p>Did not accept an unsupported recommendation: <b>{report.did_not_accept_unsupported_recommendations}</b></p></div></div>
    <div className="report-card"><div className="card-title-row"><h3>Scenario-level analysis</h3><button className="secondary" onClick={exportCSV}>Export CSV ↓</button></div>{report.decisions.map(d=><article className="analysis-row" key={d.id}><div><span className="eyebrow">{d.category}</span><h4>{d.scenario_title}</h4></div><span className="pill">{ACTIONS[d.action]}</span><p><b>Evidence:</b> {d.rationale}</p><p><b>Your answer:</b> {d.selected_option_label||"Not selected"} — {d.answer_feedback}</p><p><b>Interpretation:</b> {d.reliance_explanation}</p></article>)}</div>
    <p className="notice">{report.interpretation_note}</p><div className="report-actions"><button className="secondary" onClick={()=>download("reliancelab-session.json",JSON.stringify(report,null,2),"application/json")}>Export full report JSON ↓</button><button className="primary" onClick={onDelete}>Delete session & start over</button></div>
  </div>;
}

function Researcher({ report, session, orderCondition }) {
  const [studyName,setStudyName]=useState(()=>localStorage.getItem("rl-study-name")||"Pilot study");
  const [notes,setNotes]=useState(()=>localStorage.getItem("rl-study-notes")||"");
  const [purpose,setPurpose]=useState(()=>localStorage.getItem("rl-study-purpose")||"Explore how confidence and evidence relate to acceptance, rejection and verification.");
  const [copied,setCopied]=useState(false);
  const save=()=>{localStorage.setItem("rl-study-name",studyName);localStorage.setItem("rl-study-notes",notes);localStorage.setItem("rl-study-purpose",purpose);setCopied(true);setTimeout(()=>setCopied(false),1500)};
  return <div className="workspace-grid"><section className="panel"><p className="eyebrow">RESEARCHER WORKSPACE</p><h2>Study setup & data tools</h2><p className="subtle-text">Keep local study notes, inspect the active session condition and export participant-level results. These settings stay in this browser only.</p><label>Study label<input value={studyName} onChange={e=>setStudyName(e.target.value)}/></label><label>Research question<textarea rows="3" value={purpose} onChange={e=>setPurpose(e.target.value)}/></label><label>Researcher notes<textarea rows="5" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Recruitment notes, pilot observations, changes to test…"/></label><button className="primary" onClick={save}>{copied?"Saved locally ✓":"Save study notes"}</button></section>
  <section className="panel"><p className="eyebrow">ACTIVE SESSION</p><h2>Session diagnostics</h2><div className="diagnostic"><span>Session ID</span><b>{session||"No active session"}</b></div><div className="diagnostic"><span>Order condition</span><b>{orderCondition||"Not assigned"}</b></div><div className="diagnostic"><span>Report available</span><b>{report?"Yes":"Complete a session first"}</b></div><div className="diagnostic"><span>Export format</span><b>CSV + JSON</b></div><div className="notice">Counterbalancing alternates newly created sessions between standard and reverse scenario order. This is a simple demonstration allocation, not a full randomised assignment service. Clear the server session table only with an approved retention procedure; deleting a participant session is available in the Lab tab.</div></section></div>;
}

function ScenarioStudio({ scenarios }) {
  const [draft,setDraft]=useState(initialDraft);
  const [drafts,setDrafts]=useState(()=>JSON.parse(localStorage.getItem("rl-scenario-drafts")||"[]"));
  const [showPreview,setShowPreview]=useState(false);
  const update=(key,value)=>setDraft(d=>({...d,[key]:value}));
  const save=()=>{if(!draft.title.trim()||!draft.prompt.trim()||!draft.recommendation.trim()||!draft.evidence.trim())return;const item={...draft,id:"custom-"+Date.now(),options:draft.options.filter(Boolean).map((label,i)=>({id:"option-"+(i+1),label})),confidence:Number(draft.confidence)/100,source:"researcher-authored draft"};const next=[...drafts,item];setDrafts(next);localStorage.setItem("rl-scenario-drafts",JSON.stringify(next));setDraft(initialDraft);setShowPreview(false)};
  const remove=id=>{const next=drafts.filter(d=>d.id!==id);setDrafts(next);localStorage.setItem("rl-scenario-drafts",JSON.stringify(next))};
  return <div className="workspace-grid"><section className="panel"><p className="eyebrow">SCENARIO STUDIO</p><h2>Draft your own scenario</h2><p className="subtle-text">Create and preview additional study prompts. Drafts are stored locally and are not automatically included in the live participant experiment.</p><label>Scenario title<input value={draft.title} onChange={e=>update("title",e.target.value)} placeholder="e.g. An AI summary of a research paper"/></label><label>Domain<select value={draft.domain} onChange={e=>update("domain",e.target.value)}>{["Education","Health information","Civic information","Workplace","Other"].map(x=><option key={x}>{x}</option>)}</select></label><label>Participant prompt<textarea rows="3" value={draft.prompt} onChange={e=>update("prompt",e.target.value)} placeholder="Describe the decision context…"/></label><label>AI recommendation<textarea rows="3" value={draft.recommendation} onChange={e=>update("recommendation",e.target.value)}/></label><label>Stated confidence: {draft.confidence}%<input type="range" min="1" max="99" value={draft.confidence} onChange={e=>update("confidence",e.target.value)}/></label><label>Uncertainty disclosure<textarea rows="2" value={draft.uncertainty} onChange={e=>update("uncertainty",e.target.value)}/></label><label>Evidence shown<textarea rows="3" value={draft.evidence} onChange={e=>update("evidence",e.target.value)}/></label><label>Answer options (up to 3)</label>{draft.options.map((value,i)=><input key={i} value={value} onChange={e=>update("options",draft.options.map((x,j)=>i===j?e.target.value:x))} placeholder={"Option "+(i+1)}/>)}<div className="actions"><button className="secondary" onClick={()=>setShowPreview(!showPreview)}>Preview</button><button className="primary" onClick={save}>Save draft scenario</button></div>{showPreview&&<div className="preview-box"><b>{draft.title||"Untitled scenario"}</b><p>{draft.prompt}</p><p><b>AI:</b> {draft.recommendation}</p><p><b>Evidence:</b> {draft.evidence}</p></div>}</section>
  <section className="panel"><p className="eyebrow">SCENARIO LIBRARY</p><h2>Available material</h2><p className="subtle-text">The four fixed participant scenarios plus your own local drafts.</p>{scenarios.map(s=><article className="library-item" key={s.id}><span className="pill">{s.category}</span><h4>{s.title}</h4><p>{s.prompt}</p></article>)}<div className="card-title-row"><h3>Your draft scenarios ({drafts.length})</h3><button className="secondary" onClick={()=>download("reliancelab-scenario-drafts.json",JSON.stringify(drafts,null,2),"application/json")} disabled={!drafts.length}>Export drafts ↓</button></div>{drafts.map(d=><article className="library-item" key={d.id}><h4>{d.title}</h4><p>{d.domain} · {d.options.length} answer options · {d.confidence*100}% confidence</p><button className="text-button" onClick={()=>remove(d.id)}>Delete draft</button></article>)}</section></div>;
}

function Methods() {
  return <div className="methods-grid"><section className="panel"><p className="eyebrow">RESEARCH OVERVIEW</p><h2>What RelianceLab investigates</h2><p>RelianceLab is a Human–AI Interaction prototype for exploring how people respond to AI recommendations when confidence, uncertainty and evidence are visible.</p><div className="method-step"><b>1. Information conditions</b><p>Each vignette presents a recommendation, a fixed confidence value, an uncertainty statement and an evidence summary.</p></div><div className="method-step"><b>2. Two outcome types</b><p>Answer-key alignment captures the participant's evidence judgement. Reliance action captures whether they accept, reject or verify the recommendation.</p></div><div className="method-step"><b>3. Scenario feedback</b><p>The app reveals the authored answer key and explains the evidence after the participant responds.</p></div><div className="method-step"><b>4. Descriptive analysis</b><p>Session reports show action counts, answer-key alignment, acceptance of supported or unsupported AI, and scenario-level explanations.</p></div></section><section className="panel"><p className="eyebrow">METHOD & LIMITATIONS</p><h2>Read before research use</h2><ul className="method-list"><li>Four fixed, authored scenarios; not a validated instrument.</li><li>AI outputs and confidence values are scripted, not live model generations.</li><li>Answer keys are scenario-specific judgements and need expert review and pilot testing.</li><li>Order is counterbalanced between standard and reverse across newly created sessions.</li><li>Small convenience samples and domain familiarity can influence choices.</li><li>Do not interpret a verification choice as inherently better or worse.</li><li>Do not use results to diagnose, evaluate staff, or make consequential decisions.</li></ul><div className="notice">For formal studies: obtain ethics approval where required, write a consent and debrief protocol, review scenarios with domain experts, pre-register outcomes, plan secure data retention, and pilot the counterbalancing and export workflow.</div></section></div>;
}

export default function App() {
  const [scenarios,setScenarios]=useState([]);
  const [tab,setTab]=useState("lab");
  const [session,setSession]=useState("");
  const [orderCondition,setOrderCondition]=useState("");
  const [index,setIndex]=useState(0);
  const [choice,setChoice]=useState("");
  const [action,setAction]=useState("");
  const [feedback,setFeedback]=useState(null);
  const [report,setReport]=useState(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  useEffect(()=>{api.scenarios().then(setScenarios).catch(e=>setError(e.message));},[]);
  const start=async()=>{try{setLoading(true);setError("");const created=await api.createSession();const byId=Object.fromEntries(scenarios.map(s=>[s.id,s]));setScenarios(created.scenario_order.map(id=>byId[id]).filter(Boolean));setSession(created.session_id);setOrderCondition(created.order_condition);setIndex(0);setChoice("");setAction("");setFeedback(null);setReport(null);}catch(e){setError(e.message)}finally{setLoading(false)}};
  const decide=async kind=>{try{setLoading(true);const result=await api.decide(session,{scenario_id:scenarios[index].id,action:kind,selected_option_id:choice||null});setFeedback(result);setAction(kind);}catch(e){setError(e.message)}finally{setLoading(false)}};
  const next=async()=>{if(index+1<scenarios.length){setIndex(index+1);setChoice("");setAction("");setFeedback(null);window.scrollTo({top:0,behavior:"smooth"});}else{try{setLoading(true);setReport(await api.report(session));setTab("report");}catch(e){setError(e.message)}finally{setLoading(false)}}};
  const clear=async()=>{try{if(session)await api.deleteSession(session)}catch{}setSession("");setOrderCondition("");setReport(null);setIndex(0);setChoice("");setAction("");setFeedback(null);api.scenarios().then(setScenarios);setTab("lab")};
  const tabs=[["lab","Decision Lab"],["report","Session Report"],["researcher","Researcher"],["studio","Scenario Studio"],["methods","Methods & Ethics"]];
  return <main className="app-shell"><header className="topbar"><a className="brand" href="#"><span className="brand-mark">R</span><span>Reliance<span>Lab</span></span></a><span className="top-caption">HUMAN–AI INTERACTION RESEARCH TOOL</span></header>
    <nav className="tabs" aria-label="Main navigation">{tabs.map(([id,label])=><TabButton key={id} active={tab===id} onClick={()=>setTab(id)}>{label}{id==="report"&&report?" · ✓":""}</TabButton>)}</nav>
    {error&&<div className="error" role="alert">{error}</div>}
    {tab==="lab"&&<Lab scenarios={scenarios} session={session} index={index} setIndex={setIndex} choice={choice} setChoice={setChoice} action={action} feedback={feedback} loading={loading} onStart={start} onDecide={decide} onNext={next} onClear={clear} orderCondition={orderCondition}/>}
    {tab==="report"&&(report?<Report report={report} onDelete={clear}/>:<section className="panel empty-state"><h2>No completed report yet</h2><p>Complete a guided session to see the report and export its data.</p><button className="primary" onClick={()=>setTab("lab")}>Go to Decision Lab</button></section>)}
    {tab==="researcher"&&<Researcher report={report} session={session} orderCondition={orderCondition}/>}
    {tab==="studio"&&<ScenarioStudio scenarios={scenarios}/>}
    {tab==="methods"&&<Methods/>}
    <footer><span>RelianceLab · Exploratory Human–AI Interaction prototype</span><span>Scripted stimuli · Anonymous session IDs · Descriptive analysis</span></footer>
  </main>;
}
