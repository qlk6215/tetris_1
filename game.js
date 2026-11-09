(() => {
"use strict";
const L = globalThis.TetrisLogic;
const { unlock, sfx, music, toggleMute, isMuted } = globalThis.TetrisAudio;
const store = globalThis.TetrisStore;

const COLORS = { I: "#ef6f6c", O: "#3fb8af", T: "#e9c46a", S: "#7b6cf6", Z: "#f28dc4", J: "#8fd694", L: "#5aa9e6" };
const LOCK_DELAY = 500;
const MAX_LOCK_RESETS = 15;

const $ = (id) => document.getElementById(id);
const boardCanvas = $("board");
const nextCanvas = $("next");
const bctx = boardCanvas.getContext("2d");
const nctx = nextCanvas.getContext("2d");

function fitCanvas(canvas, ctx, w, h) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
const CELL = 30;
fitCanvas(boardCanvas, bctx, L.COLS * CELL, L.ROWS * CELL);
fitCanvas(nextCanvas, nctx, 4 * 20, 3 * 3 * 20);

// ---------- 상태 ----------
let board, piece, queue, score, lines, level;
let mode = "idle"; // idle | playing | paused | over
let acc = 0;
let lockMs = 0;
let lockResets = 0;
let softDrop = false;
let last = 0;

function reset() {
  board = L.emptyBoard();
  queue = [...L.makeBag(), ...L.makeBag()];
  score = 0;
  lines = 0;
  level = 1;
  acc = 0;
  softDrop = false;
  spawnNext();
  updateHud();
}

function spawnNext() {
  if (queue.length < 7) queue.push(...L.makeBag());
  piece = L.spawn(queue.shift());
  lockMs = 0;
  lockResets = 0;
  if (L.collides(board, piece.shape, piece.x, piece.y)) gameOver();
}

const fits = (p, dx = 0, dy = 0) => !L.collides(board, p.shape, p.x + dx, p.y + dy);

function resetLock() {
  if (lockMs > 0 && lockResets < MAX_LOCK_RESETS) {
    lockMs = 0;
    lockResets++;
  }
}

function move(dx) {
  if (!fits(piece, dx)) return;
  piece.x += dx;
  sfx.move();
  resetLock();
}

function turn(dir) {
  const r = L.tryRotate(board, piece, dir);
  if (!r) return;
  piece = r;
  sfx.rotate();
  resetLock();
}

function hardDrop() {
  let dist = 0;
  while (fits(piece, 0, 1)) {
    piece.y++;
    dist++;
  }
  score += dist * 2;
  sfx.hardDrop();
  lock();
}

function lock() {
  const res = L.clearLines(L.merge(board, piece));
  board = res.board;
  if (res.cleared) {
    score += L.lineScore(res.cleared, level);
    lines += res.cleared;
    const newLevel = L.levelFor(lines);
    if (newLevel > level) {
      level = newLevel;
      sfx.levelUp();
    } else {
      sfx.clear(res.cleared);
    }
  } else {
    sfx.lock();
  }
  updateHud();
  spawnNext();
}

// ---------- 루프 ----------
function frame(t) {
  const dt = Math.min(t - last, 100); // 탭 전환 후 한꺼번에 떨어지는 것 방지
  last = t;
  if (mode === "playing") {
    if (!fits(piece, 0, 1)) {
      acc = 0;
      lockMs += dt;
      if (lockMs >= LOCK_DELAY) lock();
    } else {
      lockMs = 0;
      acc += dt;
      const g = softDrop ? Math.min(40, L.gravityMs(level)) : L.gravityMs(level);
      while (acc >= g && fits(piece, 0, 1)) {
        acc -= g;
        piece.y++;
        if (softDrop) score += 1;
      }
      if (softDrop) updateHud();
    }
  }
  draw();
  requestAnimationFrame(frame);
}

// ---------- 그리기 ----------
function cell(ctx, x, y, size, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.fillRect(x * size + 1, y * size + 1, size - 2, 3);
}

function draw() {
  const w = L.COLS * CELL;
  const h = L.ROWS * CELL;
  bctx.fillStyle = "#14161f";
  bctx.fillRect(0, 0, w, h);
  bctx.strokeStyle = "rgba(255,255,255,0.04)";
  bctx.lineWidth = 1;
  for (let x = 1; x < L.COLS; x++) {
    bctx.beginPath();
    bctx.moveTo(x * CELL + 0.5, 0);
    bctx.lineTo(x * CELL + 0.5, h);
    bctx.stroke();
  }
  for (let y = 1; y < L.ROWS; y++) {
    bctx.beginPath();
    bctx.moveTo(0, y * CELL + 0.5);
    bctx.lineTo(w, y * CELL + 0.5);
    bctx.stroke();
  }
  if (!board) return;
  board.forEach((row, y) => row.forEach((t, x) => t && cell(bctx, x, y, CELL, COLORS[t])));
  if (mode !== "over") {
    piece.shape.forEach((row, y) =>
      row.forEach((v, x) => v && piece.y + y >= 0 && cell(bctx, piece.x + x, piece.y + y, CELL, COLORS[piece.type])),
    );
  }

  nctx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  queue.slice(0, 3).forEach((type, i) => {
    const s = L.SHAPES[type].filter((row) => row.some(Boolean));
    const ox = (4 - s[0].length) / 2;
    const oy = i * 3 + (3 - s.length) / 2;
    s.forEach((row, y) => row.forEach((v, x) => v && cell(nctx, ox + x, oy + y, 20, COLORS[type])));
  });
}

// ---------- HUD / 오버레이 ----------
function updateHud() {
  $("score").textContent = score.toLocaleString("ko-KR");
  $("lines").textContent = lines;
  $("level").textContent = level;
}

const overlay = $("overlay");
function showOverlay(title, button) {
  $("overlay-title").textContent = title;
  $("start").textContent = button;
  overlay.hidden = false;
  $("start").focus();
}

function start() {
  unlock();
  if (mode === "paused") {
    mode = "playing";
  } else {
    reset();
    mode = "playing";
  }
  overlay.hidden = true;
  music.start();
}

function pause() {
  if (mode !== "playing") return;
  mode = "paused";
  softDrop = false;
  music.stop();
  showOverlay("일시정지", "계속하기");
}

function gameOver() {
  mode = "over";
  music.stop();
  sfx.gameOver();
  $("final-score").textContent = score.toLocaleString("ko-KR");
  $("save-error").textContent = "";
  try {
    $("player-name").value = localStorage.getItem("playerName") ?? "";
  } catch {
    /* 무시 */
  }
  $("gameover").showModal();
}

$("start").addEventListener("click", start);

$("score-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (e.submitter?.value === "skip") return closeGameOver();
  const name = $("player-name").value.trim().slice(0, 20) || "익명";
  const btn = $("save-score");
  btn.disabled = true;
  try {
    await store.saveScore({ name, score, lines, level });
    try {
      localStorage.setItem("playerName", name);
    } catch {
      /* 무시 */
    }
    closeGameOver();
    loadScores();
  } catch (err) {
    // 실패해도 창을 닫지 않아 다시 시도할 수 있게 한다
    $("save-error").textContent = "저장에 실패했습니다. 다시 시도해 주세요. (" + (err.message ?? err) + ")";
  } finally {
    btn.disabled = false;
  }
});

function closeGameOver() {
  $("gameover").close();
  showOverlay("게임 오버", "다시 하기");
}
$("gameover").addEventListener("cancel", (e) => {
  e.preventDefault();
  closeGameOver();
});

const muteBtn = $("mute");
function renderMute() {
  muteBtn.textContent = isMuted() ? "소리 켜기" : "소리 끄기";
  muteBtn.setAttribute("aria-pressed", String(isMuted()));
}
muteBtn.addEventListener("click", () => {
  toggleMute();
  renderMute();
});
renderMute();

// ---------- 입력 ----------
function act(action) {
  if (mode !== "playing") return;
  if (action === "left") move(-1);
  else if (action === "right") move(1);
  else if (action === "cw") turn(1);
  else if (action === "ccw") turn(-1);
  else if (action === "drop") hardDrop();
}

const KEYS = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "cw", KeyX: "cw", KeyZ: "ccw", Space: "drop" };

document.addEventListener("keydown", (e) => {
  if (e.target.closest("input, textarea, dialog")) return; // 피드백 입력 중엔 조작 안 함
  if (e.code === "KeyM") {
    toggleMute();
    renderMute();
    return;
  }
  if (e.code === "KeyP" || e.code === "Escape") {
    if (mode === "playing") pause();
    else if (mode === "paused") start();
    return;
  }
  if (e.code === "Enter" && (mode === "idle" || mode === "paused")) {
    e.preventDefault();
    start();
    return;
  }
  if (mode !== "playing") return;
  if (e.code === "ArrowDown") {
    softDrop = true;
    e.preventDefault();
    return;
  }
  const action = KEYS[e.code];
  if (!action) return;
  e.preventDefault();
  if (action === "drop" && e.repeat) return;
  act(action);
});
document.addEventListener("keyup", (e) => {
  if (e.code === "ArrowDown") softDrop = false;
});

// 터치 버튼
document.querySelectorAll("[data-action]").forEach((btn) => {
  const action = btn.dataset.action;
  if (action === "soft") {
    btn.addEventListener("pointerdown", () => (softDrop = mode === "playing"));
    for (const ev of ["pointerup", "pointerleave", "pointercancel"]) btn.addEventListener(ev, () => (softDrop = false));
  } else {
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      act(action);
    });
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause();
});

// ---------- 랭킹 / 피드백 ----------
const fmtDate = (iso) =>
  new Date(iso).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });

async function loadScores() {
  const list = $("scores");
  try {
    const rows = await store.topScores(10);
    list.replaceChildren(
      ...rows.map((r, i) => {
        const li = document.createElement("li");
        const name = document.createElement("span");
        name.textContent = `${i + 1}. ${r.name}`;
        const pts = document.createElement("span");
        pts.className = "num";
        pts.textContent = r.score.toLocaleString("ko-KR");
        li.append(name, pts);
        return li;
      }),
    );
    if (!rows.length) list.innerHTML = '<li class="muted">아직 기록이 없습니다.</li>';
  } catch {
    list.innerHTML = '<li class="muted">랭킹을 불러오지 못했습니다.</li>';
  }
}

async function loadFeedback() {
  const list = $("feedback-list");
  try {
    const rows = await store.recentFeedback(20);
    list.replaceChildren(
      ...rows.map((r) => {
        const li = document.createElement("li");
        const meta = document.createElement("div");
        meta.className = "meta";
        meta.textContent = `${r.name} · ${fmtDate(r.created_at)}`;
        const msg = document.createElement("p");
        msg.textContent = r.message; // textContent로 넣어 HTML이 실행되지 않게 함
        li.append(meta, msg);
        return li;
      }),
    );
    if (!rows.length) list.innerHTML = '<li class="muted">첫 피드백을 남겨 주세요.</li>';
  } catch {
    list.innerHTML = '<li class="muted">피드백을 불러오지 못했습니다.</li>';
  }
}

$("feedback-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const message = $("fb-message").value.trim();
  const status = $("fb-status");
  if (!message) {
    status.textContent = "내용을 입력해 주세요.";
    return;
  }
  const name = $("fb-name").value.trim().slice(0, 20) || "익명";
  const btn = form.querySelector("button");
  btn.disabled = true;
  try {
    await store.saveFeedback({ name, message: message.slice(0, 500) });
    $("fb-message").value = "";
    status.textContent = "고맙습니다! 피드백이 등록됐습니다.";
    loadFeedback();
  } catch (err) {
    status.textContent = "등록에 실패했습니다. (" + (err.message ?? err) + ")";
  } finally {
    btn.disabled = false;
  }
});

$("storage-note").hidden = store.isRemote;
loadScores();
loadFeedback();
showOverlay("블록 낙하", "시작하기");
requestAnimationFrame((t) => {
  last = t;
  frame(t);
});
})();
