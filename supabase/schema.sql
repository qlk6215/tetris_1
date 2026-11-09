-- Supabase SQL Editor에서 한 번 실행한다. 그다음 config.js에 URL과 anon key를 넣으면 연결된다.

create table if not exists public.scores (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 20),
  score integer not null check (score between 0 and 100000000),
  lines integer not null check (lines >= 0),
  level integer not null check (level >= 1),
  created_at timestamptz not null default now()
);
create index if not exists scores_score_idx on public.scores (score desc);

create table if not exists public.feedback (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 20),
  message text not null check (char_length(message) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists feedback_created_idx on public.feedback (created_at desc);

-- 로그인 없는 게임이라 누구나 읽고 추가만 할 수 있다. 수정·삭제 정책은 만들지 않으므로 막힌다.
alter table public.scores enable row level security;
alter table public.feedback enable row level security;

create policy "scores_select" on public.scores for select to anon, authenticated using (true);
create policy "scores_insert" on public.scores for insert to anon, authenticated with check (true);
create policy "feedback_select" on public.feedback for select to anon, authenticated using (true);
create policy "feedback_insert" on public.feedback for insert to anon, authenticated with check (true);
