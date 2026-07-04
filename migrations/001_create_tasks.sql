-- Tasks table: stores request/response metadata for all API operations.
-- Never store base64 image/video content; only URLs, task IDs, status, and non-binary params.

CREATE TABLE IF NOT EXISTS public.tasks (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id          text NOT NULL UNIQUE,
    endpoint         text NOT NULL CHECK (endpoint IN ('merge_face', 'face_swap', 'motion_control')),
    status           text NOT NULL DEFAULT 'TASK_STATUS_QUEUED',
    request_metadata jsonb,
    response_payload jsonb,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_task_id ON public.tasks (task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_endpoint ON public.tasks (endpoint);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks (created_at);

-- Optional: trigger to keep updated_at in sync
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tasks_updated_at ON public.tasks;
CREATE TRIGGER tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE PROCEDURE public.set_updated_at();

COMMENT ON TABLE public.tasks IS 'Request/response metadata for merge-face, face-swap, and motion-control. No binary files.';
