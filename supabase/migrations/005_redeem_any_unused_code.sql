-- Nexora Web Dev. Academy — migration 005: redeem ANY unused code (owner instruction, 17 Nov 2026).
-- CHANGE: the admin-confirmation step is REMOVED. New flow, simple:
--   student pays on WhatsApp (outside the site) -> owner gives them an access code
--   -> student redeems the code here -> account activates INSTANTLY.
-- No payment claim, no admin approval, no assignment.
-- This REPLACES redeem_code() from migration 001. The assignment check is GONE:
-- a code with status 'unused' OR 'assigned' redeems for ANY signed-in student.
-- Codes stay single-use: the row is locked (FOR UPDATE), status flips to 'redeemed',
-- and one row is written to code_redemptions (unique per code AND per student).
-- Hardening: activation upserts the profile row from auth.users if it is missing,
-- so a valid code can never redeem "successfully" while leaving the account
-- unactivated. A same-student race (two codes redeemed at once) is answered
-- 'already_activated' instead of a misleading 'already_redeemed'.
-- Does NOT touch any table or data. The payments table is left in place, orphaned:
-- old payment claims stay recorded, but nothing reads them any more.
-- Returns: 'ok' | 'not_found' | 'already_redeemed' | 'already_activated'
-- Apply in the Supabase SQL Editor, then verify:
--   select * from public.redeem_code('NEX-XXXX-XXXX-XXXX', '<a real student uuid>');
--   -- expect 'not_found' for a made-up code. A real redeem is proven by the
--   live student test (student signs in, redeems an unused code, account activates).

create or replace function public.redeem_code(p_code text, p_student uuid)
returns text language plpgsql security definer as $$
declare
  v_hash text := encode(sha256(p_code::bytea), 'hex');
  v_row public.access_codes%rowtype;
begin
  if exists (select 1 from public.code_redemptions where student_id = p_student) then
    return 'already_activated';
  end if;
  select * into v_row from public.access_codes where code_hash = v_hash for update;
  if not found then return 'not_found'; end if;
  if v_row.status = 'redeemed' then return 'already_redeemed'; end if;
  if v_row.status in ('revoked','disabled') then return 'not_found'; end if;
  -- 'unused' and 'assigned' both redeem for ANY signed-in student. There is
  -- deliberately no assignment check any more: assignment is only the owner's
  -- record of which code was handed to whom, never a gate on redemption.
  if v_row.status not in ('unused','assigned') then return 'not_found'; end if;
  update public.access_codes set status = 'redeemed' where id = v_row.id;
  insert into public.code_redemptions (code_id, student_id) values (v_row.id, p_student);
  -- Activate the student. Upsert from auth.users so the account can never end
  -- up redeemed-but-not-activated if the profile row is missing for any reason.
  insert into public.profiles (id, full_name, email, activated)
  select p_student,
         coalesce(nullif(u.raw_user_meta_data ->> 'full_name', ''), 'Student'),
         u.email, true
  from auth.users u where u.id = p_student
  on conflict (id) do update set activated = true, updated_at = now();
  update public.profiles set activated = true, updated_at = now() where id = p_student;
  insert into public.notifications (student_id, text, kind)
    values (p_student, 'Your access code was redeemed. Your account is now activated — welcome to Nexora Web Dev. Academy.', 'activation');
  return 'ok';
exception when unique_violation then
  -- Either the code was just redeemed by someone else, or this student just
  -- activated via a simultaneous redeem. Tell the truth about which one.
  if exists (select 1 from public.code_redemptions where student_id = p_student) then
    return 'already_activated';
  end if;
  return 'already_redeemed';
end;
$$;
