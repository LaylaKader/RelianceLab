# RelianceLab

**An exploratory Human–AI Interaction platform for examining appropriate reliance on AI recommendations.**

RelianceLab gives participants a guided set of four fixed, scripted decision scenarios. Each scenario presents an AI recommendation, a stated confidence value, an uncertainty statement, and an evidence summary. Participants make two separate choices: (1) which answer is best supported by the evidence, and (2) whether they would accept, reject, or verify the AI recommendation.

After each decision, the app reveals the scenario answer key and explains whether the recommendation was supported. At the end, it provides descriptive session analysis and a scenario-by-scenario review.

> **Research boundary:** This is a scripted research prototype, not a live AI model, validated trust scale, clinical or educational decision aid, or predictor of human behaviour. Confidence values and answer keys are authored scenario attributes. The report describes observed choices only.

## What the app does

1. **Inspect:** Read the AI recommendation, its stated confidence, uncertainty disclosure, and available evidence.
2. **Answer:** Select the conclusion best supported by the scenario.
3. **Decide:** Separately accept, reject, or verify the AI recommendation.
4. **Learn:** Receive immediate feedback explaining the answer key and whether the AI recommendation was supported.
5. **Analyse:** Review action counts, answer-key alignment, acceptance of supported versus unsupported recommendations, and each scenario's rationale.

## Scenario design

The four scenarios are fixed and presented in a transparent order—not selected randomly. Two recommendations are designed to be supported by the evidence and two are deliberately flawed or overconfident. This creates opportunities to observe both acceptance and non-acceptance rather than rewarding rejection in every case.

- **Education:** A qualified recommendation about spaced practice for long-term retention.
- **Health information:** A cautious recommendation to seek qualified advice when a text-only tool cannot assess a persistent high fever. Educational scenario only, not medical advice.
- **Civic information:** An unsupported claim about a charity's donation transfers.
- **Workplace reasoning:** An unjustified causal claim based on a small survey without a comparison group.

The scenario keys are illustrative and should be reviewed and piloted before any formal research use.

## How to interpret the analysis

The report separates two things that should not be conflated:

- **Answer-key alignment:** Whether the participant's selected answer matches the authored scenario key.
- **Reliance decision:** Whether the participant accepted, rejected, or chose to verify the AI recommendation.

It also distinguishes accepted supported recommendations from accepted unsupported recommendations. A verification choice is not automatically better or worse than acceptance or rejection. The categories are descriptive labels for these scenarios—not a score of a person's trust, competence, or decision quality.

## Technology

- Frontend: React, Vite, JavaScript, responsive CSS.
- Backend: Python, FastAPI, Pydantic.
- Storage: SQLite.
- API: scenario delivery, anonymous session creation, decision recording, descriptive report, and session deletion.
- Tests: FastAPI TestClient coverage for hidden answer keys, feedback, report calculations, validation, duplicate submissions, and deletion.

## Run locally

### Backend

```bash
cd backend
python -m venv .venv
# Activate the virtual environment, then:
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API docs: http://localhost:8000/docs

### Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The frontend defaults to http://localhost:8000. Set `VITE_API_URL` to the deployed API base URL when building for production.

### Tests

From the backend directory:

```bash
pytest -q
```

## API

- `GET /health` — health check and API version.
- `GET /api/scenarios` — public scenario content; answer keys remain hidden.
- `POST /api/sessions` — create an anonymous session after consent.
- `POST /api/sessions/{id}/decisions` — record one decision per scenario and return post-decision feedback.
- `GET /api/sessions/{id}/report` — descriptive report with per-scenario analysis.
- `DELETE /api/sessions/{id}` — delete the session and associated decisions.

## Privacy and data

The app does not ask for names, emails, or account credentials. A random session UUID associates choices. The backend stores scenario IDs, actions, optional selected option IDs, answer-key correctness, and timestamps. Participants can delete their session in the UI.

The server operator controls the database and backups. Do not collect sensitive or identifiable participant data without appropriate ethics review, informed consent, security, and retention procedures. The current free Render instance may use ephemeral storage; recorded sessions may be lost when the service restarts or redeploys. Treat the public hosted app as a demonstration unless persistent storage and operational safeguards have been verified.

## Methodological limitations and next steps

- The scenarios are scripted; no live model inference occurs.
- Confidence values are fixed scenario attributes, not calibrated probabilities.
- Answer keys are authored for these examples, not a validated benchmark.
- Four scenarios are too few to support general conclusions about human trust or reliance.
- Wording, scenario order, domain knowledge, and option design can influence responses.
- The app does not randomise or counterbalance conditions.

Before formal research use: obtain ethics approval where required, pilot and revise scenarios with domain reviewers, consider counterbalanced conditions, pre-register outcomes, test the interface with participants, and plan secure persistent data storage. Do not present demo-session results as generalisable findings.

## License

No license has been added yet. Add an explicit license before inviting reuse.
