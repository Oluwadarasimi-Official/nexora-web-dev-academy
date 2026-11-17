-- Nexora Web Dev. Academy — migration 001: full schema + RLS + redeem_code()
-- Target project: https://fodwlmprqreheqiskowy.supabase.co
-- Rerunnable: every object uses IF NOT EXISTS / OR REPLACE / ON CONFLICT guards
-- where practical. Apply with the Supabase SQL editor or `supabase db push`.
-- NEVER run against a project you have not verified first. Do not drop tables.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) >= 2),
  email text not null unique,
  activated boolean not null default false,
  suspended boolean not null default false,
  suspension_reason text,
  current_level smallint not null default 1 check (current_level between 1 and 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists profiles_email_idx on public.profiles (email);

-- ---------------------------------------------------------------- user_roles
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('student','admin')),
  assigned_by uuid references auth.users(id),
  assigned_at timestamptz not null default now(),
  unique (user_id, role)
);

-- ------------------------------------------------- courses / levels / topics
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique, title text not null, description text not null default '',
  created_at timestamptz not null default now()
);
create table if not exists public.learning_levels (
  id smallint primary key check (id between 1 and 3),
  name text not null, description text not null default '',
  certificate_title text not null
);
insert into public.learning_levels (id, name, description, certificate_title) values
  (1,'Beginner','Web foundations, HTML, CSS and JavaScript essentials.','Certificate of Completion'),
  (2,'Intermediate','Advanced HTML/CSS, modern JavaScript, Git/GitHub and React.','Certificate of Achievement'),
  (3,'Advanced','TypeScript, Next.js, backend, databases, auth, security and production.','Advanced Web Development Certification')
on conflict (id) do nothing;

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  level_id smallint not null references public.learning_levels(id),
  title text not null, position smallint not null default 0,
  unique (level_id, title)
);
create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  slug text not null unique, title text not null, summary text not null default '',
  position smallint not null default 0,
  published boolean not null default true
);
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  objectives jsonb not null default '[]'::jsonb,
  explanation jsonb not null default '[]'::jsonb,
  code_lang text not null default 'html', code text not null default '',
  code_explanation text not null default '',
  activity text not null default '', mistakes jsonb not null default '[]'::jsonb,
  recap text not null default '', version smallint not null default 1,
  updated_at timestamptz not null default now(),
  unique (topic_id, version)
);

-- ------------------------------------------------------- progress / limits
create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  topic_slug text not null,
  level_id smallint not null check (level_id between 1 and 3),
  completed_at timestamptz not null default now(),
  lagos_date date not null,
  is_new_topic boolean not null default true,
  unique (student_id, topic_id)
);
create index if not exists lesson_progress_student_idx on public.lesson_progress (student_id);
create index if not exists lesson_progress_date_idx on public.lesson_progress (student_id, lagos_date);

create table if not exists public.daily_learning_limits (
  student_id uuid not null references auth.users(id) on delete cascade,
  lagos_date date not null,
  new_topics_completed smallint not null default 0 check (new_topics_completed >= 0),
  primary key (student_id, lagos_date)
);

-- ------------------------------------------------------------- quizzes
create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade unique,
  pass_mark smallint not null default 7 check (pass_mark between 1 and 10)
);
create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  question_text text not null, explanation text not null default '',
  position smallint not null default 0, version smallint not null default 1
);
create table if not exists public.quiz_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  option_text text not null, is_correct boolean not null default false,
  position smallint not null default 0
);
create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  topic_slug text not null, score smallint not null check (score between 0 and 10),
  passed boolean not null, question_version smallint not null default 1,
  submitted_at timestamptz not null default now()
);
create index if not exists quiz_attempts_student_idx on public.quiz_attempts (student_id, topic_slug);
create table if not exists public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id uuid not null, selected_index smallint not null, correct boolean not null
);

-- ------------------------------------------------------------ examinations
create table if not exists public.examinations (
  id uuid primary key default gen_random_uuid(),
  level_id smallint not null references public.learning_levels(id) unique,
  title text not null, duration_minutes smallint not null default 60,
  pass_mark_percent smallint not null default 70,
  instructions text not null default '', rubric text not null default ''
);
create table if not exists public.examination_questions (
  id uuid primary key default gen_random_uuid(),
  examination_id uuid not null references public.examinations(id) on delete cascade,
  kind text not null check (kind in ('objective','theory')),
  question_text text not null, options jsonb not null default '[]'::jsonb,
  correct_index smallint, marks smallint not null default 1,
  position smallint not null default 0
);
create table if not exists public.examination_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  examination_id uuid not null references public.examinations(id) on delete cascade,
  level_id smallint not null,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  submitted_at timestamptz,
  objective_score smallint, theory_score smallint,
  total_score smallint, status text not null default 'in_progress'
    check (status in ('in_progress','submitted','graded','passed','failed','timed_out')),
  unique (student_id, examination_id, started_at)
);
create table if not exists public.examination_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.examination_attempts(id) on delete cascade,
  question_id uuid not null references public.examination_questions(id),
  answer_text text not null default '', selected_index smallint,
  marks_awarded smallint, graded_by uuid references auth.users(id),
  unique (attempt_id, question_id)
);

-- --------------------------------------------------- payments / access codes
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  reference text not null, evidence_note text not null default '',
  amount_text text, status text not null default 'pending'
    check (status in ('pending','approved','rejected')),
  review_note text, reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz, created_at timestamptz not null default now()
);
create index if not exists payments_status_idx on public.payments (status);

create table if not exists public.access_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique, -- SHA-256 hex of the exact code; never plaintext
  status text not null default 'unused' check (status in ('unused','assigned','redeemed','revoked','disabled')),
  assigned_to uuid references auth.users(id),
  assigned_by uuid references auth.users(id),
  assigned_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.code_redemptions (
  id uuid primary key default gen_random_uuid(),
  code_id uuid not null references public.access_codes(id) unique,
  student_id uuid not null references auth.users(id),
  redeemed_at timestamptz not null default now(),
  unique (student_id, code_id),
  unique (student_id) -- one successful activation per student
);

-- ------------------------------------------------------------- certificates
create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  certificate_id text not null unique, -- e.g. NEX-B1-2026-000123
  student_id uuid not null references auth.users(id) on delete cascade,
  student_name text not null, level_id smallint not null check (level_id between 1 and 3),
  title text not null, issued_at timestamptz not null default now(),
  issued_by uuid references auth.users(id),
  status text not null default 'valid' check (status in ('valid','revoked')),
  revoke_reason text,
  unique (student_id, level_id, status)
);
create index if not exists certificates_id_idx on public.certificates (certificate_id);
create table if not exists public.certificate_verification_logs (
  id uuid primary key default gen_random_uuid(),
  certificate_id text not null, result text not null,
  checked_at timestamptz not null default now(), source_ip text
);

-- ------------------------------------------- ops: announcements / support / logs
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null, body text not null, audience text not null default 'all',
  created_by uuid references auth.users(id), created_at timestamptz not null default now()
);
create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  category text not null, message text not null,
  status text not null default 'open' check (status in ('open','in_progress','resolved')),
  admin_reply text, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.admin_activity_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users(id), action text not null,
  target_type text, target_id text, detail text not null default '',
  created_at timestamptz not null default now()
);
create table if not exists public.academy_settings (
  key text primary key, value text not null default '', updated_at timestamptz not null default now()
);
insert into public.academy_settings (key, value) values
  ('daily_new_topic_limit','3'), ('timezone','Africa/Lagos'),
  ('whatsapp','+2348139388562'), ('quiz_pass_mark','7')
on conflict (key) do nothing;

-- Notifications (real database events only)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  text text not null, kind text not null default 'info',
  read boolean not null default false, created_at timestamptz not null default now()
);

-- ------------------------------------------- atomic code redemption (RPC)
-- Hashes the submitted code with SHA-256, locks the row, redeems once.
-- Returns: 'ok' | 'not_found' | 'already_redeemed' | 'not_assigned' | 'already_activated'
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
  if v_row.status = 'assigned' and v_row.assigned_to is not null and v_row.assigned_to <> p_student then
    return 'not_assigned';
  end if;
  update public.access_codes set status = 'redeemed' where id = v_row.id;
  insert into public.code_redemptions (code_id, student_id) values (v_row.id, p_student);
  update public.profiles set activated = true, updated_at = now() where id = p_student;
  insert into public.notifications (student_id, text, kind)
    values (p_student, 'Your access code was redeemed. Your account is now activated — welcome to Nexora Web Dev. Academy.', 'activation');
  return 'ok';
exception when unique_violation then return 'already_redeemed';
end;
$$;

-- ------------------------------------------------------------------- RLS
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.courses enable row level security;
alter table public.learning_levels enable row level security;
alter table public.modules enable row level security;
alter table public.topics enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.daily_learning_limits enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_options enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_answers enable row level security;
alter table public.examinations enable row level security;
alter table public.examination_questions enable row level security;
alter table public.examination_attempts enable row level security;
alter table public.examination_answers enable row level security;
alter table public.payments enable row level security;
alter table public.access_codes enable row level security;
alter table public.code_redemptions enable row level security;
alter table public.certificates enable row level security;
alter table public.certificate_verification_logs enable row level security;
alter table public.announcements enable row level security;
alter table public.support_requests enable row level security;
alter table public.admin_activity_logs enable row level security;
alter table public.academy_settings enable row level security;
alter table public.notifications enable row level security;

-- Public read: catalogue content only (no answers, no codes, no private data).
drop policy if exists "public read levels" on public.learning_levels;
create policy "public read levels" on public.learning_levels for select using (true);
drop policy if exists "public read courses" on public.courses;
create policy "public read courses" on public.courses for select using (true);
drop policy if exists "public read modules" on public.modules;
create policy "public read modules" on public.modules for select using (true);
drop policy if exists "public read topics" on public.topics;
create policy "public read topics" on public.topics for select using (true);
drop policy if exists "public read lessons" on public.lessons;
create policy "public read lessons" on public.lessons for select using (true);
drop policy if exists "public read announcements" on public.announcements;
create policy "public read announcements" on public.announcements for select using (true);

-- Students: own rows only.
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "own progress" on public.lesson_progress;
create policy "own progress" on public.lesson_progress for all using (auth.uid() = student_id) with check (auth.uid() = student_id);
drop policy if exists "own daily limits" on public.daily_learning_limits;
create policy "own daily limits" on public.daily_learning_limits for all using (auth.uid() = student_id) with check (auth.uid() = student_id);
drop policy if exists "own quiz attempts" on public.quiz_attempts;
create policy "own quiz attempts" on public.quiz_attempts for all using (auth.uid() = student_id) with check (auth.uid() = student_id);
drop policy if exists "own exam attempts" on public.examination_attempts;
create policy "own exam attempts" on public.examination_attempts for all using (auth.uid() = student_id) with check (auth.uid() = student_id);
drop policy if exists "own payments" on public.payments;
create policy "own payments" on public.payments for all using (auth.uid() = student_id) with check (auth.uid() = student_id);
drop policy if exists "own certificates" on public.certificates;
create policy "own certificates" on public.certificates for select using (auth.uid() = student_id);
drop policy if exists "own support" on public.support_requests;
create policy "own support" on public.support_requests for all using (auth.uid() = student_id) with check (auth.uid() = student_id);
drop policy if exists "own notifications" on public.notifications;
create policy "own notifications" on public.notifications for all using (auth.uid() = student_id) with check (auth.uid() = student_id);
drop policy if exists "own redemptions" on public.code_redemptions;
create policy "own redemptions" on public.code_redemptions for select using (auth.uid() = student_id);

-- Admin-only tables: no direct client access; all admin work goes through
-- server-side API routes that verify the admin role. (No permissive policy
-- is created for access_codes, user_roles, quiz_questions/options answer
-- keys, examination_questions, admin_activity_logs or academy_settings.)
-- Note: quiz_questions/options and examination_questions carry answer keys;
-- they must be read server-side only. Do not add a public/student policy.

-- Grants for the new Data API (Supabase no longer auto-grants new tables).
grant select on public.learning_levels, public.courses, public.modules, public.topics, public.lessons, public.announcements to anon, authenticated;
grant select, insert, update, delete on public.profiles, public.lesson_progress, public.daily_learning_limits, public.quiz_attempts, public.quiz_answers, public.examination_attempts, public.examination_answers, public.payments, public.support_requests, public.notifications to authenticated;
grant select on public.certificates, public.code_redemptions to authenticated;
grant select on public.quizzes to authenticated;
grant all on all tables in schema public to service_role;
