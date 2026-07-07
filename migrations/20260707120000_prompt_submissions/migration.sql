CREATE TABLE IF NOT EXISTS prompt_submissions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  prompt TEXT NOT NULL,
  date_key TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS prompt_submissions_user_date_idx
  ON prompt_submissions (user_id, date_key);
