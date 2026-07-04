-- Add user_id to tasks table for ownership checks
ALTER TABLE tasks ADD COLUMN user_id UUID REFERENCES users(id);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);

-- Add last_event_at to subscriptions for out-of-order event handling
ALTER TABLE subscriptions ADD COLUMN last_event_at TIMESTAMPTZ;
