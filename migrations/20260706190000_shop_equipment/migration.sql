CREATE TABLE IF NOT EXISTS shop_equipment (
  user_id TEXT NOT NULL,
  slot TEXT NOT NULL,
  item_id TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS shop_equipment_user_slot_idx
  ON shop_equipment (user_id, slot);
