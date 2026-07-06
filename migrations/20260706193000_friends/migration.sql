CREATE TABLE IF NOT EXISTS friendships (
  user_id TEXT NOT NULL,
  friend_user_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS friendships_user_friend_idx
  ON friendships (user_id, friend_user_id);

CREATE TABLE IF NOT EXISTS friend_requests (
  id TEXT PRIMARY KEY,
  from_user_id TEXT NOT NULL,
  to_user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS friend_requests_pair_pending_idx
  ON friend_requests (from_user_id, to_user_id, status);

CREATE INDEX IF NOT EXISTS friend_requests_to_status_idx
  ON friend_requests (to_user_id, status);
