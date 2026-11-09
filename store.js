import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

export const isRemote = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const SCORES = "tetris_1_scores";
const FEEDBACK = "tetris_1_feedback";

let clientPromise = null;
const client = () =>
  (clientPromise ??= import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm").then((m) =>
    m.createClient(SUPABASE_URL, SUPABASE_ANON_KEY),
  ));

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
  if (isRemote) {
    const { error } = await (await client()).from(table).insert(row);
    if (error) throw error;
    return;
  }
  writeLocal(table, [...readLocal(table), { ...row, created_at: new Date().toISOString() }]);
}

export const saveScore = (row) => insert(SCORES, row);
export const saveFeedback = (row) => insert(FEEDBACK, row);

export async function topScores(limit = 10) {
  if (isRemote) {
    const { data, error } = await (await client())
      .from(SCORES)
      .select("name, score, lines, level, created_at")
      .order("score", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  }
  return readLocal(SCORES).sort((a, b) => b.score - a.score).slice(0, limit);
}

export async function recentFeedback(limit = 20) {
  if (isRemote) {
    const { data, error } = await (await client())
      .from(FEEDBACK)
      .select("name, message, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  }
  return readLocal(FEEDBACK).reverse().slice(0, limit);
}
