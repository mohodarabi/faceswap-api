-- =============================================================================
-- iOS Face Swap / Video Generation App – PostgreSQL schema (Supabase)
-- Auth: device_id only. Monetization: RevenueCat + Credits. Content: Categories/Templates.
-- =============================================================================

-- Reuse existing trigger for updated_at
-- (set_updated_at() and LANGUAGE plpgsql already exist from 001_create_tasks.sql)

-- -----------------------------------------------------------------------------
-- users: identified by device_id only (no passwords)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id         text NOT NULL UNIQUE,
    onboarding_answers jsonb,
    created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_device_id ON public.users (device_id);
COMMENT ON TABLE public.users IS 'Users identified by device_id; onboarding_answers is flexible JSON.';

-- -----------------------------------------------------------------------------
-- user_credits: pay-per-generation balance (one row per user)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_credits (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL UNIQUE REFERENCES public.users (id) ON DELETE CASCADE,
    balance     integer NOT NULL DEFAULT 0 CHECK (balance >= 0),
    last_updated timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON public.user_credits (user_id);
COMMENT ON TABLE public.user_credits IS 'Credit balance per user for pay-per-generation.';

-- -----------------------------------------------------------------------------
-- subscriptions: RevenueCat-backed; supports "Unlimited" and "monthly credit drop"
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    rc_user_id            text NOT NULL,
    rc_subscription_id     text,
    status                text NOT NULL CHECK (status IN ('active', 'expired', 'canceled', 'grace_period')),
    plan_type             text NOT NULL,
    credits_per_period    integer,
    last_credit_grant_at  timestamptz,
    expires_at            timestamptz,
    created_at            timestamptz NOT NULL DEFAULT now(),
    updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_rc_user_id ON public.subscriptions (rc_user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status_expires ON public.subscriptions (status, expires_at);

COMMENT ON COLUMN public.subscriptions.plan_type IS 'e.g. unlimited, premium_monthly_credits';
COMMENT ON COLUMN public.subscriptions.credits_per_period IS 'NULL = unlimited or non-credit plan; set for monthly drop.';
COMMENT ON COLUMN public.subscriptions.last_credit_grant_at IS 'When credits were last granted (for monthly drop).';

DROP TRIGGER IF EXISTS subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE PROCEDURE public.set_updated_at();

-- -----------------------------------------------------------------------------
-- categories: template grouping and display order
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name       text NOT NULL,
    sort_order integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON public.categories (sort_order);

-- -----------------------------------------------------------------------------
-- templates: content linked to Novita model and credit cost
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.templates (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id     uuid NOT NULL REFERENCES public.categories (id) ON DELETE CASCADE,
    novita_model_id  text NOT NULL,
    preview_url      text,
    credit_cost      integer NOT NULL DEFAULT 1 CHECK (credit_cost >= 0),
    created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_templates_category_id ON public.templates (category_id);
CREATE INDEX IF NOT EXISTS idx_templates_novita_model_id ON public.templates (novita_model_id);

COMMENT ON COLUMN public.templates.novita_model_id IS 'Novita model or endpoint id e.g. face_swap, motion_control.';

-- -----------------------------------------------------------------------------
-- generation_tasks: user + template + Novita task tracking
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.generation_tasks (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    template_id       uuid REFERENCES public.templates (id) ON DELETE SET NULL,
    task_id           text NOT NULL UNIQUE,
    endpoint          text NOT NULL CHECK (endpoint IN ('merge_face', 'face_swap', 'motion_control')),
    status            text NOT NULL DEFAULT 'TASK_STATUS_QUEUED',
    request_metadata  jsonb,
    response_payload  jsonb,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_generation_tasks_user_id ON public.generation_tasks (user_id);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_template_id ON public.generation_tasks (template_id);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_task_id ON public.generation_tasks (task_id);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_created_at ON public.generation_tasks (created_at);

COMMENT ON TABLE public.generation_tasks IS 'Links user and template to Novita task; webhook updates by task_id.';
COMMENT ON COLUMN public.generation_tasks.template_id IS 'Nullable for ad-hoc generations not from a template.';

DROP TRIGGER IF EXISTS generation_tasks_updated_at ON public.generation_tasks;
CREATE TRIGGER generation_tasks_updated_at
    BEFORE UPDATE ON public.generation_tasks
    FOR EACH ROW
    EXECUTE PROCEDURE public.set_updated_at();
