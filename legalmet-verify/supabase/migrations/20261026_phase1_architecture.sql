-- ====================================================================
-- SIH26036 Legal Metrology Verification System
-- Phase 1 Migration: Role Types, Schemas, Verification & Issuing RPCs, and Seed Data
-- ====================================================================

-- 1. ROLE TYPES & EXTENDED SCHEMAS
-----------------------------------------------------------------------

-- Update profiles table with rich metadata
alter table public.profiles 
add column if not exists phone text,
add column if not exists organization text,
add column if not exists district text,
add column if not exists officer_badge_id text;

-- Create direct RLS policy for profile reading
alter table public.profiles enable row level security;

drop policy if exists "Public profiles are readable by everyone" on public.profiles;
create policy "Public profiles are readable by everyone"
on public.profiles for select using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update using (auth.uid() = id);

-- Ensure instruments table has full audit columns
alter table public.instruments
add column if not exists address text,
add column if not exists district text default 'Central District',
add column if not exists status text default 'active';

-- ====================================================================
-- 2. VERIFICATION FUNCTION WITH CRYPTOGRAPHIC HASH
-- ====================================================================

create or replace function public.verify_certificate(cert_number text)
returns table (
  certificate_number text,
  issued_at timestamptz,
  valid_until timestamptz,
  status text,
  instrument_name text,
  instrument_type text,
  manufacturer text,
  model_number text,
  serial_number text,
  owner_name text,
  owner_organization text,
  district text,
  digital_hash text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  select 
    c.certificate_number,
    c.issued_at,
    c.valid_until,
    case 
      when c.revoked_at is not null then 'REVOKED'
      when c.valid_until < now() then 'EXPIRED'
      else 'VALID'
    end as status,
    i.instrument_name,
    i.instrument_type,
    i.manufacturer,
    i.model_number,
    i.serial_number,
    p.full_name as owner_name,
    coalesce(p.organization, 'Registered Trade Establishment') as owner_organization,
    coalesce(i.district, 'Central Metrology Zone') as district,
    encode(sha256((c.certificate_number || i.serial_number || c.issued_at::text)::bytea), 'hex') as digital_hash
  from public.certificates c
  join public.verification_applications va on c.application_id = va.id
  join public.instruments i on va.instrument_id = i.id
  join public.profiles p on va.owner_id = p.id
  where trim(upper(c.certificate_number)) = trim(upper(cert_number));
end;
$$;

-- Function to issue a certificate for an approved application
create or replace function public.issue_certificate(app_id uuid)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cert_id uuid;
  v_cert_no text;
  v_app record;
  v_issuer uuid;
begin
  v_issuer := auth.uid();
  
  select * into v_app
  from public.verification_applications
  where id = app_id;

  if not found then
    return json_build_object('success', false, 'error', 'Application not found');
  end if;

  -- Generate sequential/timestamped cert number
  v_cert_no := 'LMV-CERT-2026-' || lpad(floor(random() * 9000 + 1000)::text, 4, '0');

  -- Update application status
  update public.verification_applications
  set status = 'approved',
      updated_at = now()
  where id = app_id;

  -- Insert certificate
  insert into public.certificates (
    application_id,
    certificate_number,
    issued_by,
    valid_until
  )
  values (
    app_id,
    v_cert_no,
    v_issuer,
    now() + interval '1 year'
  )
  returning id into v_cert_id;

  return json_build_object(
    'success', true,
    'certificate_number', v_cert_no,
    'certificate_id', v_cert_id
  );
end;
$$;

-- ====================================================================
-- 3. SEED DATABASE WITH AMPLE REALISTIC CERTIFICATES
-- ====================================================================

do $$
declare
  v_user_id uuid;
  v_inst uuid;
  v_app uuid;
begin
  -- Fetch existing authenticated user or fallback to profile
  select id into v_user_id from auth.users limit 1;

  if v_user_id is not null then
    -- Sample 1: Weighbridge (Industrial)
    v_inst := gen_random_uuid();
    v_app := gen_random_uuid();
    insert into public.instruments (id, owner_id, instrument_name, instrument_type, serial_number, manufacturer, model_number, location, district)
    values (v_inst, v_user_id, '100-Ton Electronic Pitless Weighbridge', 'Heavy Weighing System', 'WB-2026-9901', 'Essae Digitronics', 'E1200-SERIES', 'Port Logistics Yard, Gate 3', 'North District')
    on conflict (manufacturer, serial_number) do update set instrument_name = excluded.instrument_name returning id into v_inst;

    insert into public.verification_applications (id, instrument_id, owner_id, application_number, status)
    values (v_app, v_inst, v_user_id, 'LMV-APP-2026-0101', 'approved')
    on conflict (application_number) do nothing;

    insert into public.certificates (application_id, certificate_number, issued_by, valid_until)
    values (v_app, 'LMV-CERT-2026-0101', v_user_id, now() + interval '1 year')
    on conflict (certificate_number) do nothing;

    -- Sample 2: Fuel Dispenser (Retail)
    v_inst := gen_random_uuid();
    v_app := gen_random_uuid();
    insert into public.instruments (id, owner_id, instrument_name, instrument_type, serial_number, manufacturer, model_number, location, district)
    values (v_inst, v_user_id, 'Dual-Hose High Precision Fuel Dispenser', 'Flow Meter', 'FD-8821-B', 'Gilbarco Veeder-Root', 'Encore 700 S', 'National Highway 44 Service Station', 'South District')
    on conflict (manufacturer, serial_number) do update set instrument_name = excluded.instrument_name returning id into v_inst;

    insert into public.verification_applications (id, instrument_id, owner_id, application_number, status)
    values (v_app, v_inst, v_user_id, 'LMV-APP-2026-0102', 'approved')
    on conflict (application_number) do nothing;

    insert into public.certificates (application_id, certificate_number, issued_by, valid_until)
    values (v_app, 'LMV-CERT-2026-0102', v_user_id, now() + interval '8 months')
    on conflict (certificate_number) do nothing;

    -- Sample 3: Precision Gold Scale (Jewelry)
    v_inst := gen_random_uuid();
    v_app := gen_random_uuid();
    insert into public.instruments (id, owner_id, instrument_name, instrument_type, serial_number, manufacturer, model_number, location, district)
    values (v_inst, v_user_id, 'Class I High-Precision Gold Micro Balance', 'Weighing Scale', 'BAL-7720-X', 'Sartorius AG', 'Secura 224-1S', 'Central Gold Bazaar, Shop 14', 'Central District')
    on conflict (manufacturer, serial_number) do update set instrument_name = excluded.instrument_name returning id into v_inst;

    insert into public.verification_applications (id, instrument_id, owner_id, application_number, status)
    values (v_app, v_inst, v_user_id, 'LMV-APP-2026-0103', 'approved')
    on conflict (application_number) do nothing;

    insert into public.certificates (application_id, certificate_number, issued_by, valid_until)
    values (v_app, 'LMV-CERT-2026-0103', v_user_id, now() + interval '1 year')
    on conflict (certificate_number) do nothing;

    -- Sample 4: Commercial Retail Scale (Supermarket)
    v_inst := gen_random_uuid();
    v_app := gen_random_uuid();
    insert into public.instruments (id, owner_id, instrument_name, instrument_type, serial_number, manufacturer, model_number, location, district)
    values (v_inst, v_user_id, 'Digital Price Computing Counter Scale', 'Weighing Scale', 'RTL-3341-P', 'METTLER TOLEDO', 'bRite 100', 'Supermarket Terminal 02', 'East District')
    on conflict (manufacturer, serial_number) do update set instrument_name = excluded.instrument_name returning id into v_inst;

    insert into public.verification_applications (id, instrument_id, owner_id, application_number, status)
    values (v_app, v_inst, v_user_id, 'LMV-APP-2026-0104', 'approved')
    on conflict (application_number) do nothing;

    insert into public.certificates (application_id, certificate_number, issued_by, valid_until)
    values (v_app, 'LMV-CERT-2026-0104', v_user_id, now() + interval '11 months')
    on conflict (certificate_number) do nothing;
  end if;
end $$;
