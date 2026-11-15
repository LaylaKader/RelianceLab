# RelianceLab

**An exploratory Human–AI Interaction platform for examining how people respond to AI recommendations, confidence statements, uncertainty disclosures and evidence.**

Live app: https://reliancelab.vercel.app/

## Product areas

- **Decision Lab:** guided participant flow with four fixed scenarios, evidence judgement, separate reliance decision, immediate explanatory feedback and a session report.
- **Session Report:** descriptive decision summaries, scenario-level analysis, CSV export and full JSON export.
- **Researcher Workspace:** local study label, research question, researcher notes, session diagnostics and order-condition visibility.
- **Scenario Studio:** create, preview, save and export researcher-authored scenario drafts. Drafts are stored in the current browser and do not enter the live participant study automatically.
- **Methods & Ethics:** explains the study logic, constructs, limitations and precautions before formal research use.

## Study design features

The four canonical scenarios are fixed and transparent: two recommendations supported by their evidence summaries and two unsupported or overconfident recommendations. Newly created sessions alternate between standard and reverse scenario order. This is a simple counterbalancing demonstration; it is not a randomised assignment service or a complete experimental platform.

The participant flow records two separate outcomes:
1. **Evidence judgement:** whether the selected answer matches the authored scenario key.
2. **Reliance action:** accept, reject, or verify the AI recommendation.

Reports distinguish acceptance of supported recommendations from acceptance of unsupported recommendations. A verification choice is not automatically better or worse than accepting or rejecting.

## Research boundary

This is a scripted research prototype, not a live AI model, validated trust scale, clinical or educational decision aid, or predictor of human behaviour. Confidence values and answer keys are authored scenario attributes. The report describes observed choices only. The scenario keys should be reviewed by domain experts and piloted before formal research use.

## Technology

- Frontend: React, Vite, JavaScript, responsive CSS.
- Backend: Python, FastAPI, Pydantic.
- Storage: SQLite.
- Exports: CSV and JSON from completed sessions.
- Tests: FastAPI TestClient for hidden answer keys, feedback, report calculations, validation, deletion and counterbalanced order.

## Run locally

Backend:
```bash
cd backend
python -m venv .venv
# Activate the environment
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The frontend defaults to http://localhost:8000; set `VITE_API_URL` for another API base URL.

Tests:
```bash
cd backend
pytest -q
```

## API

- `GET /health`
- `GET /api/scenarios` — public scenario content only.
- `POST /api/sessions` — create an anonymous session and return its order condition and scenario order.
- `POST /api/sessions/{id}/decisions` — record one decision per scenario and return feedback.
- `GET /api/sessions/{id}/report` — descriptive report and scenario-level analysis.
- `DELETE /api/sessions/{id}` — delete the session and associated decisions.

## Privacy and deployment notes

The app does not ask for names, emails or account credentials. A random session UUID associates choices. The researcher workspace notes and custom scenario drafts are stored in browser localStorage. Participant decisions are stored server-side in SQLite. The server operator controls the database and backups. The current free Render instance may use ephemeral storage; session records may be lost on restart or redeploy. Treat hosted data as demonstration data unless persistent storage, retention and access controls are explicitly configured.

Do not collect identifiable or sensitive participant data without appropriate ethics review, informed consent, security and retention procedures.

## Formal research checklist

Before a study: obtain ethics approval where required; review scenarios with domain experts; pilot wording and answer keys; pre-register research questions and outcomes; plan recruitment, consent, debriefing, secure storage and retention; test order balancing; and avoid presenting prototype outputs as validated measurements.

## License

No license has been added yet. Add an explicit license before inviting reuse.
