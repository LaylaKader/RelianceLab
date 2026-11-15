import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import init_db
@pytest.fixture
def client(tmp_path,monkeypatch):
 db=str(tmp_path/"test.sqlite3");monkeypatch.setattr("app.main.DB_PATH",db);init_db(db)
 with TestClient(app) as c:yield c
def test_health_and_scenarios(client):
 assert client.get("/health").json()["status"]=="ok"
 s=client.get("/api/scenarios").json();assert len(s)>=3;assert all("correct_option_ids" not in x for x in s)
def test_record_and_report(client):
 sid=client.post("/api/sessions",json={"consent":True}).json()["session_id"]
 r=client.post(f"/api/sessions/{sid}/decisions",json={"scenario_id":"study-source","action":"reject","selected_option_id":"depends"})
 assert r.status_code==201 and r.json()["selected_option_correct"] is True
 report=client.get(f"/api/sessions/{sid}/report").json();assert report["decision_count"]==1 and report["correct_selected_count"]==1
def test_validation_and_missing_session(client):
 sid=client.post("/api/sessions",json={"consent":True}).json()["session_id"]
 assert client.post(f"/api/sessions/{sid}/decisions",json={"scenario_id":"study-source","action":"reject","selected_option_id":"bogus"}).status_code==422
 assert client.get("/api/sessions/unknown/report").status_code==404
def test_delete(client):
 sid=client.post("/api/sessions",json={"consent":True}).json()["session_id"];assert client.delete(f"/api/sessions/{sid}").status_code==204
 assert client.get(f"/api/sessions/{sid}/report").status_code==404
