// 일반 <script>로 로드 (file:// 더블클릭 실행 지원). 전역 TetrisStore 로 노출한다.
(() => {
"use strict";
const { SUPABASE_URL, SUPABASE_ANON_KEY } = globalThis.TETRIS_CONFIG;

const isRemote = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const SCORES = "tetris_1_scores";
const FEEDBACK = "tetris_1_feedback";

// Supabase REST(PostgREST)를 직접 호출한다 — 라이브러리 없이 publishable/anon 키 모두 동작
async function rest(path, { method = "GET", body } = {}) {
  const headers = { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" };
  // 예전 형식(JWT) anon 키만 Authorization 헤더에도 넣는다 (publishable 키는 넣으면 거부됨)
  if (SUPABASE_ANON_KEY.startsWith("eyJ")) headers.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
  if (method === "POST") headers.Prefer = "return=minimal";
  const res = await fetch(`${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/${path}`, {
    method,
    headers,
    body: body && JSON.stringify(body),
  });
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      msg = (await res.json()).message ?? msg;
    } catch {
      /* 본문 없음 */
    }
    throw new Error(msg);
  }
  return method === "GET" ? res.json() : null;
}

function readLocal(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? [];
  } catch {
    return [];
  }
}
function writeLocal(key, rows) {
  try {
    localStorage.setItem(key, JSON.stringify(rows));
  } catch {
    throw new Error("브라우저 저장소를 사용할 수 없습니다.");
  }
}

async function insert(table, row) {
  if (isRemote) return rest(table, { method: "POST", body: row });
  writeLocal(table, [...readLocal(table), { ...row, created_at: new Date().toISOString() }]);
}

const saveScore = (row) => insert(SCORES, row);
const saveFeedback = (row) => insert(FEEDBACK, row);

async function topScores(limit = 10) {
  if (isRemote) return rest(`${SCORES}?select=name,score,lines,level,created_at&order=score.desc&limit=${limit}`);
  return readLocal(SCORES).sort((a, b) => b.score - a.score).slice(0, limit);
}

async function recentFeedback(limit = 20) {
  if (isRemote) return rest(`${FEEDBACK}?select=name,message,created_at&order=created_at.desc&limit=${limit}`);
  return readLocal(FEEDBACK).reverse().slice(0, limit);
}

globalThis.TetrisStore = { isRemote, saveScore, saveFeedback, topScores, recentFeedback };
})();
