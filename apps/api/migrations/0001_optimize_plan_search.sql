-- Search starts from a plan and then resolves its communities. The composite
-- primary key is ordered by community_uid, so it cannot efficiently serve this
-- lookup direction.
CREATE INDEX IF NOT EXISTS idx_community_plan_plan_uid
ON community_plan (plan_uid);

