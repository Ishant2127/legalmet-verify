-- ====================================================================
-- LegalMet Verify Nexus · live registry hardening
-- Migration: 20261027_nexus
-- Project:   szfjkeivaccwmcyelhdv (Supabase)
--
-- This migration is additive. It does not modify the legacy
-- public.certificates / verify_certificate() objects, so the existing
-- public verification desk keeps working while Nexus gains a dedicated,
-- RLS-protected ledger and a modern verification RPC.
--
-- Run once in Supabase → SQL Editor. Safe to re-run.
-- ====================================================================

create extension if not exists pgcrypto;

-- --------------------------------------------------------------------
-- 1. Dedicated Nexus certificate ledger
-- --------------------------------------------------------------------

create table if not exists public.nexus_certificates (
  id                  uuid primary key default gen_random_uuid(),
  certificate_number  text not null unique,
  application_number  text,
  instrument_serial   text not null,
  instrument_name     text,
  instrument_type     text,
  manufacturer        text,
  model_number        text,
  owner_name          text,
  owner_organization  text,
  district            text,
  issued_at           timestamptz not null default now(),
  valid_until         timestamptz not null,
  status              text not null default 'VALID'
                      check (status in ('VALID', 'EXPIRING', 'EXPIRED', 'REVOKED')),
  inspection_score    integer check (inspection_score between 0 and 100),
  seal_version        text not null default 'LMV-SEAL-2.0',
  digital_hash        text,
  revoked_at          timestamptz,
  revocation_reason   text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint nexus_validity_window check (valid_until > issued_at)
);

comment on table public.nexus_certificates is
  'Tamper-evident certificate ledger for LegalMet Verify Nexus. Read-only to anon.';

create index if not exists nexus_certificates_valid_until_idx
  on public.nexus_certificates (valid_until);

create index if not exists nexus_certificates_district_idx
  on public.nexus_certificates (district);

create index if not exists nexus_certificates_instrument_serial_idx
  on public.nexus_certificates (instrument_serial);

-- Keep updated_at honest even for service-role writes.
create or replace function public.nexus_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists nexus_certificates_touch on public.nexus_certificates;
create trigger nexus_certificates_touch
  before update on public.nexus_certificates
  for each row execute function public.nexus_touch_updated_at();

-- --------------------------------------------------------------------
-- 2. Row Level Security: public read, privileged write
-- --------------------------------------------------------------------

alter table public.nexus_certificates enable row level security;

drop policy if exists "Nexus certificates are publicly readable"
  on public.nexus_certificates;
create policy "Nexus certificates are publicly readable"
  on public.nexus_certificates
  for select
  using (true);

-- No insert/update/delete policies are created for anon/authenticated.
-- Issuance therefore stays behind the service role or a security-definer
-- RPC, never the browser key.

grant select on public.nexus_certificates to anon, authenticated;

-- --------------------------------------------------------------------
-- 3. Verification RPC used by the public desk
-- --------------------------------------------------------------------

create or replace function public.verify_nexus_certificate(cert_number text)
returns table (
  certificate_number  text,
  application_number  text,
  issued_at           timestamptz,
  valid_until         timestamptz,
  status              text,
  instrument_name     text,
  instrument_type     text,
  manufacturer        text,
  model_number        text,
  serial_number       text,
  owner_name          text,
  owner_organization  text,
  district            text,
  inspection_score    integer,
  seal_version        text,
  digital_hash        text,
  revoked_at          timestamptz,
  revocation_reason   text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.certificate_number,
    c.application_number,
    c.issued_at,
    c.valid_until,
    case
      when c.revoked_at is not null then 'REVOKED'
      when c.valid_until < now() then 'EXPIRED'
      when c.valid_until < now() + interval '45 days' then 'EXPIRING'
      else 'VALID'
    end as status,
    c.instrument_name,
    c.instrument_type,
    c.manufacturer,
    c.model_number,
    c.instrument_serial,
    c.owner_name,
    c.owner_organization,
    c.district,
    c.inspection_score,
    c.seal_version,
    c.digital_hash,
    c.revoked_at,
    c.revocation_reason
  from public.nexus_certificates c
  where upper(c.certificate_number) = upper(trim(cert_number))
  limit 1;
$$;

grant execute on function public.verify_nexus_certificate(text)
  to anon, authenticated;

-- --------------------------------------------------------------------
-- 4. Health probe for the integrations console
-- --------------------------------------------------------------------

create or replace function public.nexus_registry_health()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'ledger', 'nexus_certificates',
    'total', (select count(*) from public.nexus_certificates),
    'valid', (
      select count(*) from public.nexus_certificates
      where revoked_at is null and valid_until >= now()
    ),
    'expiring', (
      select count(*) from public.nexus_certificates
      where revoked_at is null
        and valid_until >= now()
        and valid_until < now() + interval '45 days'
    ),
    'revoked', (
      select count(*) from public.nexus_certificates where revoked_at is not null
    ),
    'seal_version', 'LMV-SEAL-2.0',
    'checked_at', now()
  );
$$;

grant execute on function public.nexus_registry_health() to anon, authenticated;

-- --------------------------------------------------------------------
-- 5. Public register view (convenience for reporting / exports)
-- --------------------------------------------------------------------

create or replace view public.nexus_public_register
with (security_invoker = true)
as
select
  certificate_number,
  instrument_name,
  instrument_type,
  manufacturer,
  model_number,
  instrument_serial,
  owner_organization,
  district,
  issued_at,
  valid_until,
  case
    when revoked_at is not null then 'REVOKED'
    when valid_until < now() then 'EXPIRED'
    when valid_until < now() + interval '45 days' then 'EXPIRING'
    else 'VALID'
  end as state,
  digital_hash
from public.nexus_certificates;

grant select on public.nexus_public_register to anon, authenticated;

-- --------------------------------------------------------------------
-- 6. Optional: mirror legacy certificates into the Nexus ledger
--    Enable manually after reviewing the legacy data quality.
-- --------------------------------------------------------------------

-- insert into public.nexus_certificates (
--   certificate_number, instrument_serial, issued_at, valid_until, status
-- )
-- select
--   c.certificate_number,
--   coalesce(i.serial_number, 'UNKNOWN'),
--   c.issued_at,
--   c.valid_until,
--   case when c.revoked_at is not null then 'REVOKED' else 'VALID' end
-- from public.certificates c
-- left join public.verification_applications va on va.id = c.application_id
-- left join public.instruments i on i.id = va.instrument_id
-- on conflict (certificate_number) do nothing;

-- ====================================================================
-- Verification checklist after running:
--
--   select * from public.verify_nexus_certificate('LMV-CERT-2026-0482');
--   select public.nexus_registry_health();
--   select * from public.nexus_public_register limit 10;
--
-- The public anon key can execute both functions and read the table,
-- but cannot mutate the ledger.
-- ====================================================================
