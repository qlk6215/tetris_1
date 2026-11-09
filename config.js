// Supabase 연결 정보 (팀플 캘린더와 같은 프로젝트 DB, 테이블은 tetris_1_* 로 분리).
// 비워 두면 점수·피드백이 이 브라우저(localStorage)에만 저장된다.
// publishable/anon 키는 공개용이라 여기에 넣어도 된다 (실제 보호는 supabase/schema.sql의 RLS가 담당).
// service_role / secret 키는 절대 넣지 말 것.
globalThis.TETRIS_CONFIG = {
  SUPABASE_URL: "https://uysonzjawmmmglbaulur.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_DHryKAbZzWAWFi4hfAZ0yQ_WY5DV1JV",
};
