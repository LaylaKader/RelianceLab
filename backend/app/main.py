from contextlib import asynccontextmanager
from datetime import datetime, timezone
from uuid import uuid4
import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .database import connect, init_db
from .scenarios import SCENARIOS, publicScenario
from .schemas import SessionCreate, DecisionCreate

DB_PATH = os.getenv("RELIANCELAB_DB_PATH")


@asynccontextmanager
async def lifespan(app):
    init_db(DB_PATH)
    yield


app = FastAPI(
    title="RelianceLab API",
    version="1.1.0",
    description="Exploratory Human-AI Interaction platform for studying decisions around scripted AI recommendations.",
    lifespan=lifespan,
)

origins = [
    item.strip()
    for item in os.getenv(
        "CORS_ORIGINS",
        "https://reliancelab.vercel.app,http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if item.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type"],
)


def now():
    return datetime.now(timezone.utc).isoformat()


def scenario(scenario_id):
    return next((item for item in SCENARIOS if item["id"] == scenario_id), None)


def require_session(connection, session_id):
    if not connection.execute(
        "SELECT id FROM sessions WHERE id=?", (session_id,)
    ).fetchone():
        raise HTTPException(404, "Session not found")


def decision_analysis(row):
    item = scenario(row["scenario_id"])
    if item is None:
        return dict(row)

    selected = row["selected_option_id"]
    correct_labels = [
        option["label"]
        for option in item["options"]
        if option["id"] in item["correct_option_ids"]
    ]
    ai_correct = item["ai_recommendation_correct"]
    accepted = row["action"] == "accept"

    if ai_correct and accepted:
        reliance_pattern = "accepted_supported_recommendation"
        reliance_explanation = "You accepted a recommendation that matched the scenario evidence."
    elif not ai_correct and accepted:
        reliance_pattern = "accepted_unsupported_recommendation"
        reliance_explanation = "You accepted a recommendation that went beyond or conflicted with the scenario evidence. This is a potential over-reliance pattern in this scenario."
    elif ai_correct and not accepted:
        reliance_pattern = "did_not_accept_supported_recommendation"
        reliance_explanation = "You did not accept a recommendation that matched the scenario evidence. Verification can still be a reasonable choice when you want more assurance."
    else:
        reliance_pattern = "did_not_accept_unsupported_recommendation"
        reliance_explanation = "You did not accept a recommendation that was unsupported by the scenario evidence."

    selected_correct = row["selected_option_correct"]
    selected_label = next(
        (option["label"] for option in item["options"] if option["id"] == selected),
        None,
    )
    return {
        **dict(row),
        "scenario_title": item["title"],
        "category": item["category"],
        "selected_option_label": selected_label,
        "correct_option_labels": correct_labels,
        "rationale": item["rationale"],
        "ai_recommendation_correct": ai_correct,
        "reliance_pattern": reliance_pattern,
        "reliance_explanation": reliance_explanation,
        "answer_feedback": (
            "Your selected answer matches the scenario answer key."
            if selected_correct == 1
            else "Your selected answer does not match the scenario answer key."
            if selected_correct == 0
            else "No answer option was selected, so answer accuracy was not scored."
        ),
    }


@app.get("/health")
def health():
    return {"status": "ok", "service": "RelianceLab API", "version": "1.1.0"}


@app.get("/api/scenarios")
def scenarios():
    return [publicScenario(item) for item in SCENARIOS]


@app.post("/api/sessions", status_code=201)
def create_session(payload: SessionCreate):
    if not payload.consent:
        raise HTTPException(400, "Consent is required to record a session.")
    session_id = str(uuid4())
    timestamp = now()
    with connect(DB_PATH) as connection:
        connection.execute(
            "INSERT INTO sessions(id,created_at,consent) VALUES(?,?,1)",
            (session_id, timestamp),
        )
    return {"session_id": session_id, "created_at": timestamp}


@app.post("/api/sessions/{session_id}/decisions", status_code=201)
def record_decision(session_id: str, payload: DecisionCreate):
    item = scenario(payload.scenario_id)
    if item is None:
        raise HTTPException(404, "Scenario not found")

    valid_options = {option["id"] for option in item["options"]}
    if payload.selected_option_id and payload.selected_option_id not in valid_options:
        raise HTTPException(422, "Selected option does not belong to this scenario.")

    selected = payload.selected_option_id
    correct = (
        selected in item["correct_option_ids"]
        if selected
        else None
    )
    timestamp = now()

    with connect(DB_PATH) as connection:
        require_session(connection, session_id)
        existing = connection.execute(
            "SELECT id FROM decisions WHERE session_id=? AND scenario_id=?",
            (session_id, payload.scenario_id),
        ).fetchone()
        if existing:
            raise HTTPException(409, "A decision for this scenario is already recorded in this session.")

        cursor = connection.execute(
            """INSERT INTO decisions(
                session_id,scenario_id,action,selected_option_id,
                ai_recommendation_accepted,selected_option_correct,created_at
            ) VALUES(?,?,?,?,?,?,?)""",
            (
                session_id,
                payload.scenario_id,
                payload.action,
                selected,
                int(payload.action == "accept"),
                None if correct is None else int(correct),
                timestamp,
            ),
        )
        decision_id = cursor.lastrowid
        row = connection.execute(
            "SELECT * FROM decisions WHERE id=?", (decision_id,)
        ).fetchone()

    return {
        "id": decision_id,
        **decision_analysis(row),
    }


@app.get("/api/sessions/{session_id}/report")
def report(session_id: str):
    with connect(DB_PATH) as connection:
        require_session(connection, session_id)
        rows = connection.execute(
            "SELECT * FROM decisions WHERE session_id=? ORDER BY id",
            (session_id,),
        ).fetchall()

    decisions = [decision_analysis(row) for row in rows]
    total = len(decisions)
    actions = {
        action: sum(item["action"] == action for item in decisions)
        for action in ("accept", "reject", "verify")
    }
    scored = [item for item in decisions if item["selected_option_correct"] is not None]
    accepted_good = sum(
        item["action"] == "accept" and item["ai_recommendation_correct"]
        for item in decisions
    )
    accepted_bad = sum(
        item["action"] == "accept" and not item["ai_recommendation_correct"]
        for item in decisions
    )
    nonaccepted_good = sum(
        item["action"] != "accept" and item["ai_recommendation_correct"]
        for item in decisions
    )
    nonaccepted_bad = sum(
        item["action"] != "accept" and not item["ai_recommendation_correct"]
        for item in decisions
    )

    return {
        "session_id": session_id,
        "decision_count": total,
        "scenario_count": len(SCENARIOS),
        "completion_rate": round(total / len(SCENARIOS), 3) if SCENARIOS else 0,
        "actions": actions,
        "acceptance_rate": round(actions["accept"] / total, 3) if total else None,
        "scored_decisions": len(scored),
        "correct_selected_count": sum(item["selected_option_correct"] == 1 for item in scored),
        "incorrect_selected_count": sum(item["selected_option_correct"] == 0 for item in scored),
        "accepted_supported_recommendations": accepted_good,
        "accepted_unsupported_recommendations": accepted_bad,
        "did_not_accept_supported_recommendations": nonaccepted_good,
        "did_not_accept_unsupported_recommendations": nonaccepted_bad,
        "decisions": decisions,
        "interpretation_note": (
            "This is a descriptive analysis of choices in a small set of scripted scenarios. "
            "It is not a validated measure of trust, competence, or real-world behaviour. "
            "A verification choice is not automatically better or worse than acceptance or rejection."
        ),
    }


@app.delete("/api/sessions/{session_id}", status_code=204)
def delete_session(session_id: str):
    with connect(DB_PATH) as connection:
        cursor = connection.execute(
            "DELETE FROM sessions WHERE id=?", (session_id,)
        )
        if cursor.rowcount == 0:
            raise HTTPException(404, "Session not found")
