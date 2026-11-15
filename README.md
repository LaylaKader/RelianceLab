# RelianceLab

**An exploratory Human–AI Interaction platform for examining decisions around AI recommendations.**

RelianceLab presents scripted scenarios in which an AI assistant makes a recommendation. A participant can accept, reject, or verify it and optionally select an answer. The FastAPI backend records anonymous session decisions and returns a descriptive report.

> Research boundary: This is a prototype and design probe, not a validated trust scale, clinical or educational decision aid, or predictor of human behaviour. It records observable choices. Scenario answer keys are illustrative and should be reviewed before research use.

## Features
- React + Vite frontend.
- Python + FastAPI REST backend.
- SQLite persistence with configurable database path.
- Session creation, decision recording, descriptive report, and deletion endpoints.
- Four scripted scenarios in education, health information, civic information, and workplace reasoning.
- Backend tests for health, scenario answer-key privacy, validation, reporting, and deletion.
- No account system, names, emails, analytics, or third-party tracking in application code.

## Structure
- backend/app: API, database, schemas, and scenario definitions.
- backend/tests: API tests.
- frontend/src: React app, API client, and styles.
- render.yaml: backend deployment blueprint.

## Run locally
Backend: cd backend; create and activate a virtual environment; pip install -r requirements.txt; uvicorn app.main:app --reload. API docs: http://localhost:8000/docs.

Frontend in a second terminal: cd frontend; npm install; npm run dev. Open http://localhost:5173. By default it calls http://localhost:8000. Set VITE_API_URL to the hosted API base URL when building the frontend.

Tests: from backend, run pytest -q.

## API
- GET /health — health check.
- GET /api/scenarios — public scenario content; answer keys are withheld.
- POST /api/sessions — create a consented anonymous session.
- POST /api/sessions/{id}/decisions — record accept/reject/verify and optional answer.
- GET /api/sessions/{id}/report — descriptive counts and decisions.
- DELETE /api/sessions/{id} — delete session and associated decisions.

## Data and privacy
The app does not ask for identifying information. A random session UUID associates decisions. The backend stores scenario IDs, actions, optional selected option IDs, answer-key correctness, and timestamps. Participants can delete their session in the UI. A deployed server operator controls the database and backups; do not use this prototype for sensitive or identifiable participant data without appropriate ethics, security, retention, and consent review.

Local SQLite defaults to backend/reliancelab.sqlite3. Set RELIANCELAB_DB_PATH to change it. The current free Render deployment stores SQLite at /tmp/reliancelab.sqlite3 on an ephemeral filesystem: recorded sessions may be lost when the service restarts or redeploys. Treat the hosted instance as a demonstration only, not a durable research data-collection system. For real studies, configure a persistent database (and an appropriate consent, retention, security, and ethics process) before collecting participant data.

## Deployment
Frontend: deploy the frontend directory to Vercel. Set VITE_API_URL to the deployed backend URL (without trailing slash). The included vercel.json supports SPA routing.

Backend: deploy the root render.yaml blueprint to Render. Replace the CORS placeholder with the actual frontend URL before deploying. The blueprint mounts a persistent disk at /var/data. Persistent disks and always-on availability may depend on current provider plan limits.

## Methodological limitations
- Accept/reject/verify are behavioural choices in constrained scenarios, not latent trust.
- Confidence values are scripted attributes, not calibrated model probabilities.
- Correctness labels are fixed answer keys for demo scenarios, not a validated benchmark.
- Wording, order effects, domain knowledge, and option design can influence choices.
- The prototype does not randomise scenarios, counterbalance conditions, or calculate validated psychometric scales.

A research study should obtain ethics approval where required, pilot scenarios, pre-register outcome definitions, assess inter-rater agreement for human-coded responses, and report limitations. Do not describe demo results as generalisable evidence.

## License
No license has been added yet. Add an explicit license before inviting reuse.
