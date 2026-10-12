-- PENETIX Pay foundation — DRAFT MIGRATION, NOT APPLIED.
-- Only execute on a separately approved project after legal/security review.
-- Contains no real NIC photos, card data, passwords or OTP values.
BEGIN;
CREATE SCHEMA IF NOT EXISTS penetix_pay;
CREATE TABLE penetix_pay.merchants (
  id uuid PRIMARY KEY,
  display_name text NOT NULL CHECK (length(display_name) BETWEEN 1 AND 150),
  state text NOT NULL CHECK (state IN ('pending','verified','suspended')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE penetix_pay.customer_accounts (
  id uuid PRIMARY KEY,
  auth_subject text NOT NULL UNIQUE,
  state text NOT NULL CHECK (state IN ('pending','active','restricted','closed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE penetix_pay.kyc_verifications (
  id uuid PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES penetix_pay.customer_accounts(id),
  external_provider_ref text UNIQUE,
  status text NOT NULL CHECK (status IN ('not_started','pending','verified','rejected','expired')),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE penetix_pay.payment_intents (
  id uuid PRIMARY KEY,
  merchant_id uuid NOT NULL REFERENCES penetix_pay.merchants(id),
  merchant_reference varchar(64) NOT NULL,
  idempotency_key uuid NOT NULL,
  amount_minor bigint NOT NULL CHECK (amount_minor BETWEEN 100 AND 100000000),
  currency char(3) NOT NULL DEFAULT 'LKR' CHECK (currency='LKR'),
  status text NOT NULL CHECK (status IN ('created','awaiting_bank','bank_approved','bank_declined','settlement_pending','settled','settlement_failed','cancelled','refunded')),
  version integer NOT NULL DEFAULT 1 CHECK (version >= 1),
  bank_reference text,
  settlement_reference text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(merchant_id,idempotency_key)
);
CREATE TABLE penetix_pay.financing_applications (
  id uuid PRIMARY KEY,
  intent_id uuid NOT NULL UNIQUE REFERENCES penetix_pay.payment_intents(id),
  customer_id uuid NOT NULL REFERENCES penetix_pay.customer_accounts(id),
  bank_application_reference text UNIQUE,
  status text NOT NULL CHECK (status IN ('submitted','pending','approved','declined','withdrawn')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE penetix_pay.payment_events (
  event_id uuid PRIMARY KEY,
  intent_id uuid NOT NULL REFERENCES penetix_pay.payment_intents(id),
  actor text NOT NULL,
  event_type text NOT NULL,
  before_status text NOT NULL,
  after_status text NOT NULL,
  provider_event_reference text UNIQUE,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX payment_events_intent_idx ON penetix_pay.payment_events(intent_id,occurred_at);
CREATE TABLE penetix_pay.outbox (
  id uuid PRIMARY KEY,
  intent_id uuid REFERENCES penetix_pay.payment_intents(id),
  topic text NOT NULL,
  event_json jsonb NOT NULL,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- Fail closed: no direct access to financial tables from public/browser roles.
REVOKE ALL ON SCHEMA penetix_pay FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA penetix_pay FROM PUBLIC;
DO $$
DECLARE t text;
BEGIN
 FOREACH t IN ARRAY ARRAY['merchants','customer_accounts','kyc_verifications','payment_intents','financing_applications','payment_events','outbox']
 LOOP
  EXECUTE format('ALTER TABLE penetix_pay.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE penetix_pay.%I FORCE ROW LEVEL SECURITY',t);
 END LOOP;
END $$;
-- No client RLS policies. Design least-privileged server DB roles and grants before applying.
-- A production ledger needs its own double-entry, externally reconciled design, not these status rows.
COMMIT;
