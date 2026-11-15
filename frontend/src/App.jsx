import { useEffect, useMemo, useState } from "react";
import { api } from "./api";

const actionLabels = { accept: "Accepted AI", reject: "Rejected AI", verify: "Chose to verify" };

function Bar({ label, value, total, tone = "" }) {
  const width = total ? Math.round((value / total) * 100) : 0;
  return <div className="bar-row">
    <div className="bar-label"><span>{label}</span><strong>{value}</strong></div>
    <div className="bar-track"><i className={tone} style={{ width: width + "%" }} /></div>
    <small>{width}%</small>
  </div>;
}

export default function App() {
  const [scenarios, setScenarios] = useState([]);
  const [session, setSession] = useState("");
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState("");
  const [action, setAction] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const current = scenarios[index];

  useEffect(() => {
    api.scenarios().then(setScenarios).catch((e) => setError(e.message));
  }, []);

  const start = async () => {
    try {
      setLoading(true); setError("");
      const created = await api.createSession();
      setSession(created.session_id); setIndex(0); setChoice("");
      setAction(""); setFeedback(null); setReport(null);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const submit = async (kind) => {
    if (!current || !session) return;
    try {
      setLoading(true); setError("");
      const result = await api.decide(session, {
        scenario_id: current.id, action: kind, selected_option_id: choice || null
      });
      setFeedback(result); setAction(kind);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const next = async () => {
    if (index + 1 < scenarios.length) {
      setIndex(index + 1); setChoice(""); setAction(""); setFeedback(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      try { setLoading(true); setReport(await api.report(session)); }
      catch (e) { setError(e.message); }
      finally { setLoading(false); }
    }
  };

  const clear = async () => {
    try { if (session) await api.deleteSession(session); } catch {}
    setSession(""); setReport(null); setIndex(0); setChoice("");
    setAction(""); setFeedback(null);
  };

  const completed = report?.decision_count || 0;
  const actionTotal = report?.decision_count || 0;
  const accuracy = report?.scored_decisions
    ? Math.round(report.correct_selected_count / report.scored_decisions * 100) : null;
  const distribution = useMemo(() => report ? [
    ["Accepted AI", report.actions.accept],
    ["Rejected AI", report.actions.reject],
    ["Verified first", report.actions.verify]
  ] : [], [report]);

  return <main className="shell">
    <header className="top">
      <a className="brand" href="#"><span className="mark">R</span> RelianceLab</a>
      <div className="top-meta"><span>HUMAN–AI INTERACTION</span><span className="live-dot" /> SCRIPTED STUDY PROTOTYPE</div>
    </header>

    <section className="hero">
      <div>
        <p className="eyebrow">A HUMAN–AI DECISION LAB</p>
        <h1>When should you<br /><em>rely on AI?</em></h1>
        <p className="intro">Make decisions across four transparent scenarios. Inspect the evidence, decide whether to accept, reject, or verify an AI recommendation, then receive an explanation of how your choice relates to the scenario evidence.</p>
        <div className="hero-actions">
          {!session ? <button className="primary" onClick={start} disabled={loading || !scenarios.length}>{loading ? "Starting…" : "Start guided session →"}</button>
            : <button className="subtle" onClick={clear}>End session & delete my data</button>}
          <span className="privacy">Anonymous session · no account required</span>
        </div>
      </div>
      <aside className="hero-card">
        <p className="card-kicker">THE RESEARCH QUESTION</p>
        <h3>Does confidence match the evidence?</h3>
        <p>A recommendation can sound certain and still be unsupported. The task is to judge the evidence—not the confidence number alone.</p>
        <div className="hero-stat"><strong>4</strong><span>fixed, scripted scenarios</span></div>
      </aside>
    </section>

    {error && <div className="error" role="alert">{error}</div>}

    {!session && <section className="intro-panel">
      <div><span className="step">01</span><h2>Inspect the recommendation</h2><p>Read the AI's claim, its stated confidence, uncertainty disclosure, and the evidence provided.</p></div>
      <div><span className="step">02</span><h2>Make two distinct choices</h2><p>Select the answer best supported by the evidence, then say whether you would accept, reject, or verify the AI recommendation.</p></div>
      <div><span className="step">03</span><h2>Understand the result</h2><p>See scenario-by-scenario feedback, answer-key alignment, and patterns in how you relied on the scripted AI.</p></div>
      <div className="method-note"><strong>Important:</strong> This prototype does not call a live AI model. The AI statements and confidence values are scripted so every participant sees the same material. The scenario order is fixed—not random.</div>
    </section>}

    {session && current && !report && <section className="workspace">
      <div className="section-head">
        <div><p className="eyebrow">SCENARIO {index + 1} OF {scenarios.length}</p><h2>{current.title}</h2></div>
        <span className="category">{current.category}</span>
      </div>
      <div className="progress"><span style={{ width: ((index + 1) / scenarios.length * 100) + "%" }} /></div>
      <p className="prompt">{current.prompt}</p>
      <div className="recommendation">
        <div className="rec-head"><span>SCRIPTED AI ASSISTANT</span><span className="confidence">{Math.round(current.confidence * 100)}% stated confidence</span></div>
        <h3>{current.ai_recommendation}</h3>
        <div className="info-grid">
          <div><b>What the AI admits it does not know</b><p>{current.uncertainty}</p></div>
          <div><b>Evidence available to you</b><p>{current.evidence}</p></div>
        </div>
        <p className="confidence-note">The confidence value is a fixed scenario attribute, not a probability produced by a calibrated model.</p>
      </div>

      <div className="choices">
        <div className="choice-section">
          <span className="step">YOUR ANSWER</span><h3>Which conclusion is best supported?</h3>
          <p className="muted">Choose the option that follows from the evidence—not simply the AI's preferred answer.</p>
          <div className="option-grid">{current.options.map((option) =>
            <button key={option.id} className={"option " + (choice === option.id ? "selected" : "")} onClick={() => setChoice(option.id)} disabled={!!action}>
              <span>{option.label}</span><b>{choice === option.id ? "✓" : "○"}</b>
            </button>)}</div>
        </div>
        <div className="choice-section decision-box">
          <span className="step">YOUR RELIANCE DECISION</span><h3>What would you do with this AI recommendation?</h3>
          <p className="muted">Your answer and your reliance decision are recorded separately, so the report can distinguish answer accuracy from reliance behaviour.</p>
          <div className="decision-row">
            <button disabled={loading || !!action} onClick={() => submit("accept")}>Accept AI</button>
            <button disabled={loading || !!action} onClick={() => submit("reject")}>Reject AI</button>
            <button disabled={loading || !!action} onClick={() => submit("verify")}>Verify first</button>
          </div>
          {!choice && <small className="hint">You may record a reliance decision without selecting an answer.</small>}
        </div>
      </div>

      {feedback && <div className="feedback-panel">
        <p className="eyebrow">SCENARIO FEEDBACK · {actionLabels[feedback.action]}</p>
        <h3>{feedback.ai_recommendation_correct ? "The AI recommendation is supported" : "The AI recommendation is not supported"}</h3>
        <p>{feedback.rationale}</p>
        <div className="feedback-grid">
          <div><b>Reliance interpretation</b><p>{feedback.reliance_explanation}</p></div>
          <div><b>Your answer</b><p>{feedback.answer_feedback}</p><p><strong>Answer key:</strong> {feedback.correct_option_labels.join(", ")}</p></div>
        </div>
        <button className="primary" onClick={next} disabled={loading}>{index + 1 === scenarios.length ? "View my analysis →" : "Continue to next scenario →"}</button>
      </div>}
    </section>}

    {report && <section className="workspace report">
      <p className="eyebrow">SESSION ANALYSIS</p><h2>What your decisions show</h2>
      <p className="muted">A descriptive summary of your choices in {completed} of {report.scenario_count} fixed scenarios. This is not a psychological score.</p>
      <div className="stats">
        <div><strong>{completed}/{report.scenario_count}</strong><span>Scenarios completed</span></div>
        <div><strong>{report.actions.accept}</strong><span>AI recommendations accepted</span></div>
        <div><strong>{report.actions.verify}</strong><span>Decisions to verify first</span></div>
        <div><strong>{accuracy === null ? "—" : accuracy + "%"}</strong><span>Selected answers matching key</span></div>
      </div>
      <div className="report-grid">
        <div className="report-card"><h3>Your reliance decisions</h3>
          {distribution.map(([label, value]) => <Bar key={label} label={label} value={value} total={actionTotal} />)}
        </div>
        <div className="report-card"><h3>Did acceptance match the evidence?</h3>
          <Bar label="Accepted supported AI" value={report.accepted_supported_recommendations} total={completed} tone="good" />
          <Bar label="Accepted unsupported AI" value={report.accepted_unsupported_recommendations} total={completed} tone="warning" />
          <Bar label="Did not accept supported AI" value={report.did_not_accept_supported_recommendations} total={completed} />
          <Bar label="Did not accept unsupported AI" value={report.did_not_accept_unsupported_recommendations} total={completed} tone="good" />
        </div>
      </div>
      <div className="report-card detail-card">
        <h3>Scenario-by-scenario analysis</h3>
        {report.decisions.map((decision) => <article className="decision-detail" key={decision.id}>
          <div className="detail-heading"><div><span className="category">{decision.category}</span><h4>{decision.scenario_title}</h4></div><b>{actionLabels[decision.action]}</b></div>
          <p>{decision.reliance_explanation}</p>
          <p><strong>Answer:</strong> {decision.selected_option_label || "No answer selected"} · {decision.answer_feedback}</p>
          <p><strong>Evidence review:</strong> {decision.rationale}</p>
        </article>)}
      </div>
      <p className="method-note">{report.interpretation_note}</p>
      <button className="primary" onClick={clear}>Delete session and start again →</button>
    </section>}

    <footer><span>RelianceLab · Exploratory Human–AI Interaction prototype</span><span>Scripted scenarios · Descriptive feedback · No live AI inference</span></footer>
  </main>;
}
