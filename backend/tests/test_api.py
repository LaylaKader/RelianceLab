import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database import init_db


@pytest.fixture
def client(tmp_path, monkeypatch):
    database = str(tmp_path / "test.sqlite3")
    monkeypatch.setattr("app.main.DB_PATH", database)
    init_db(database)
    with TestClient(app) as test_client:
        yield test_client


def test_health_and_public_scenarios(client):
    assert client.get("/health").json()["status"] == "ok"
    scenarios = client.get("/api/scenarios").json()
    assert len(scenarios) == 4
    assert all("correct_option_ids" not in item for item in scenarios)
    assert all("ai_recommendation_correct" not in item for item in scenarios)


def test_decision_feedback_and_report(client):
    session_id = client.post("/api/sessions", json={"consent": True}).json()["session_id"]
    response = client.post(f"/api/sessions/{session_id}/decisions",
        json={"scenario_id": "donation-proof", "action": "verify", "selected_option_id": "verify"})
    assert response.status_code == 201
    feedback = response.json()
    assert feedback["ai_recommendation_correct"] is False
    assert feedback["selected_option_correct"] is True
    assert "confidence as evidence" in feedback["rationale"]
    report = client.get(f"/api/sessions/{session_id}/report").json()
    assert report["decision_count"] == 1
    assert report["correct_selected_count"] == 1
    assert report["did_not_accept_unsupported_recommendations"] == 1
    assert report["decisions"][0]["scenario_title"] == "An unverified donation claim"


def test_balanced_scenario_keys(client):
    scenarios = client.get("/api/scenarios").json()
    assert len(scenarios) == 4
    session_id = client.post("/api/sessions", json={"consent": True}).json()["session_id"]
    for item in scenarios:
        response = client.post(f"/api/sessions/{session_id}/decisions",
            json={"scenario_id": item["id"], "action": "verify", "selected_option_id": None})
        assert response.status_code == 201
    report = client.get(f"/api/sessions/{session_id}/report").json()
    assert report["accepted_supported_recommendations"] == 0
    assert report["accepted_unsupported_recommendations"] == 0
    assert report["decision_count"] == 4


def test_validation_duplicate_and_missing_session(client):
    session_id = client.post("/api/sessions", json={"consent": True}).json()["session_id"]
    invalid = client.post(f"/api/sessions/{session_id}/decisions",
        json={"scenario_id": "study-source", "action": "reject", "selected_option_id": "bogus"})
    assert invalid.status_code == 422
    valid = client.post(f"/api/sessions/{session_id}/decisions",
        json={"scenario_id": "study-source", "action": "accept", "selected_option_id": "spaced"})
    assert valid.status_code == 201
    duplicate = client.post(f"/api/sessions/{session_id}/decisions",
        json={"scenario_id": "study-source", "action": "accept", "selected_option_id": "spaced"})
    assert duplicate.status_code == 409
    assert client.get("/api/sessions/unknown/report").status_code == 404


def test_delete_session(client):
    session_id = client.post("/api/sessions", json={"consent": True}).json()["session_id"]
    assert client.delete(f"/api/sessions/{session_id}").status_code == 204
    assert client.get(f"/api/sessions/{session_id}/report").status_code == 404


def test_counterbalanced_order(client):
    first = client.post("/api/sessions", json={"consent": True}).json()
    second = client.post("/api/sessions", json={"consent": True}).json()
    assert first["order_condition"] == "standard"
    assert second["order_condition"] == "reverse"
    assert first["scenario_order"] == list(reversed(second["scenario_order"]))
