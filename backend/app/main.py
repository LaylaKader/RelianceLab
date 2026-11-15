from contextlib import asynccontextmanager
from datetime import datetime,timezone
from uuid import uuid4
import os
from fastapi import FastAPI,HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .database import connect,init_db
from .scenarios import SCENARIOS,publicScenario
from .schemas import SessionCreate,DecisionCreate
DB_PATH=os.getenv("RELIANCELAB_DB_PATH")
@asynccontextmanager
async def lifespan(app):
 init_db(DB_PATH);yield
app=FastAPI(title="RelianceLab API",version="1.0.0",description="Exploratory platform for recording decisions about AI recommendations.",lifespan=lifespan)
origins=[x.strip() for x in os.getenv("CORS_ORIGINS","http://localhost:5173,http://127.0.0.1:5173").split(",") if x.strip()]
app.add_middleware(CORSMiddleware,allow_origins=origins,allow_credentials=False,allow_methods=["GET","POST","DELETE","OPTIONS"],allow_headers=["Content-Type"])
def now():return datetime.now(timezone.utc).isoformat()
def scenario(sid):return next((s for s in SCENARIOS if s["id"]==sid),None)
def require_session(c,sid):
 if not c.execute("SELECT id FROM sessions WHERE id=?",(sid,)).fetchone():raise HTTPException(404,"Session not found")
@app.get("/health")
def health():return {"status":"ok","service":"RelianceLab API"}
@app.get("/api/scenarios")
def scenarios():return [publicScenario(s) for s in SCENARIOS]
@app.post("/api/sessions",status_code=201)
def create_session(p:SessionCreate):
 if not p.consent:raise HTTPException(400,"Consent is required to record a session.")
 sid=str(uuid4());stamp=now()
 with connect(DB_PATH) as c:c.execute("INSERT INTO sessions(id,created_at,consent) VALUES(?,?,1)",(sid,stamp))
 return {"session_id":sid,"created_at":stamp}
@app.post("/api/sessions/{session_id}/decisions",status_code=201)
def record_decision(session_id:str,p:DecisionCreate):
 s=scenario(p.scenario_id)
 if not s:raise HTTPException(404,"Scenario not found")
 valid={o["id"] for o in s["options"]}
 if p.selected_option_id and p.selected_option_id not in valid:raise HTTPException(422,"Selected option does not belong to this scenario.")
 selected=p.selected_option_id;accepted=p.action=="accept";correct=(selected in s["correct_option_ids"]) if selected else None;stamp=now()
 with connect(DB_PATH) as c:
  require_session(c,session_id)
  cur=c.execute("INSERT INTO decisions(session_id,scenario_id,action,selected_option_id,ai_recommendation_accepted,selected_option_correct,created_at) VALUES(?,?,?,?,?,?,?)",(session_id,p.scenario_id,p.action,selected,int(accepted),None if correct is None else int(correct),stamp));did=cur.lastrowid
 return {"id":did,"scenario_id":p.scenario_id,"action":p.action,"selected_option_id":selected,"ai_recommendation_accepted":accepted,"selected_option_correct":correct,"created_at":stamp}
@app.get("/api/sessions/{session_id}/report")
def report(session_id:str):
 with connect(DB_PATH) as c:
  require_session(c,session_id);rows=c.execute("SELECT * FROM decisions WHERE session_id=? ORDER BY id",(session_id,)).fetchall()
 total=len(rows);actions={a:sum(r["action"]==a for r in rows) for a in ("accept","reject","verify")};scored=[r for r in rows if r["selected_option_correct"] is not None];accepted=[r for r in scored if r["action"]=="accept"]
 return {"session_id":session_id,"decision_count":total,"actions":actions,"acceptance_rate":round(actions["accept"]/total,3) if total else None,"scored_decisions":len(scored),"correct_selected_count":sum(r["selected_option_correct"]==1 for r in scored),"incorrect_selected_count":sum(r["selected_option_correct"]==0 for r in scored),"accepted_recommendation_correct_count":sum(r["selected_option_correct"]==1 for r in accepted),"accepted_recommendation_incorrect_count":sum(r["selected_option_correct"]==0 for r in accepted),"decisions":[dict(r) for r in rows],"interpretation_note":"Descriptive counts of choices in this session, not a validated measure of trust, competence, or real-world behaviour."}
@app.delete("/api/sessions/{session_id}",status_code=204)
def delete_session(session_id:str):
 with connect(DB_PATH) as c:
  cur=c.execute("DELETE FROM sessions WHERE id=?",(session_id,))
  if cur.rowcount==0:raise HTTPException(404,"Session not found")
