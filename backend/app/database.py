import os, sqlite3
from pathlib import Path
DEFAULT_DB=Path(__file__).resolve().parents[2]/"reliancelab.sqlite3"
def connect(db_path=None):
 path=str(db_path or os.getenv("RELIANCELAB_DB_PATH",DEFAULT_DB))
 if path!=":memory:": Path(path).parent.mkdir(parents=True,exist_ok=True)
 c=sqlite3.connect(path,check_same_thread=False);c.row_factory=sqlite3.Row;c.execute("PRAGMA foreign_keys=ON");return c
def init_db(db_path=None):
 with connect(db_path) as c:
  c.executescript("""CREATE TABLE IF NOT EXISTS sessions(id TEXT PRIMARY KEY,created_at TEXT NOT NULL,consent INTEGER NOT NULL DEFAULT 1);CREATE TABLE IF NOT EXISTS decisions(id INTEGER PRIMARY KEY AUTOINCREMENT,session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,scenario_id TEXT NOT NULL,action TEXT NOT NULL,selected_option_id TEXT,ai_recommendation_accepted INTEGER NOT NULL,selected_option_correct INTEGER,created_at TEXT NOT NULL);CREATE INDEX IF NOT EXISTS idx_decisions_session ON decisions(session_id);""")
