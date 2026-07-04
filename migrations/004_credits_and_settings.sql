-- =============================================================================
-- Credit system: app_settings table + atomic credit RPC functions
-- =============================================================================

-- -----------------------------------------------------------------------------
-- app_settings: key-value config for admin-changeable values
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_settings (
    key   text PRIMARY KEY,
    value text NOT NULL
);

COMMENT ON TABLE public.app_settings IS 'Key-value config for admin-changeable values (credit amounts, costs, etc).';

-- Seed defaults
INSERT INTO public.app_settings (key, value) VALUES
    ('initial_credits', '5'),
    ('default_credit_cost', '1')
ON CONFLICT (key) DO NOTHING;

-- -----------------------------------------------------------------------------
-- deduct_credits: atomic deduction with insufficient-balance guard
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.deduct_credits(p_user_id uuid, p_amount integer)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    new_balance integer;
BEGIN
    UPDATE public.user_credits
       SET balance = balance - p_amount,
           last_updated = now()
     WHERE user_id = p_user_id
       AND balance >= p_amount
    RETURNING balance INTO new_balance;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'insufficient_credits';
    END IF;

    RETURN new_balance;
END;
$$;

-- -----------------------------------------------------------------------------
-- refund_credits: add back credits on API failure
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refund_credits(p_user_id uuid, p_amount integer)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    new_balance integer;
BEGIN
    UPDATE public.user_credits
       SET balance = balance + p_amount,
           last_updated = now()
     WHERE user_id = p_user_id
    RETURNING balance INTO new_balance;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'user_credits_not_found';
    END IF;

    RETURN new_balance;
END;
$$;

-- -----------------------------------------------------------------------------
-- add_credits: upsert credits (signup, subscription grant, IAP top-up)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.add_credits(p_user_id uuid, p_amount integer)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    new_balance integer;
BEGIN
    INSERT INTO public.user_credits (user_id, balance, last_updated)
    VALUES (p_user_id, p_amount, now())
    ON CONFLICT (user_id) DO UPDATE
       SET balance = user_credits.balance + p_amount,
           last_updated = now()
    RETURNING balance INTO new_balance;

    RETURN new_balance;
END;
$$;
