-- Supabase SQL Editor에서 실행한다. 여러 번 실행해도 안전하다.
-- 그다음 config.js에 Project URL과 anon key를 넣으면 연결된다.

-- 점수 랭킹
create table if not exists public.tetris_1_scores (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 20),
  score integer not null check (score between 0 and 100000000),
  lines integer not null check (lines >= 0),
  level integer not null check (level >= 1),
  created_at timestamptz not null default now()
);
create index if not exists tetris_1_scores_score_idx on public.tetris_1_scores (score desc);

-- 사용자 피드백
create table if not exists public.tetris_1_feedback (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 20),
  message text not null check (char_length(message) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists tetris_1_feedback_created_idx on public.tetris_1_feedback (created_at desc);

-- 로그인 없는 게임이라 누구나 읽고 추가만 할 수 있다.
-- 수정·삭제 정책은 만들지 않으므로 RLS에 의해 막힌다.
alter table public.tetris_1_scores enable row level security;
alter table public.tetris_1_feedback enable row level security;

-- Data API(REST)로 접근할 수 있게 권한을 명시한다 (실제 허용 범위는 아래 RLS 정책이 결정)
grant select, insert on public.tetris_1_scores to anon, authenticated;
grant select, insert on public.tetris_1_feedback to anon, authenticated;

drop policy if exists "tetris_1_scores_select" on public.tetris_1_scores;
create policy "tetris_1_scores_select" on public.tetris_1_scores
  for select to anon, authenticated using (true);

drop policy if exists "tetris_1_scores_insert" on public.tetris_1_scores;
create policy "tetris_1_scores_insert" on public.tetris_1_scores
  for insert to anon, authenticated with check (true);

drop policy if exists "tetris_1_feedback_select" on public.tetris_1_feedback;
create policy "tetris_1_feedback_select" on public.tetris_1_feedback
  for select to anon, authenticated using (true);

drop policy if exists "tetris_1_feedback_insert" on public.tetris_1_feedback;
create policy "tetris_1_feedback_insert" on public.tetris_1_feedback
  for insert to anon, authenticated with check (true);
