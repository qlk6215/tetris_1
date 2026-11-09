// 일반 <script>로 로드 (file:// 더블클릭 실행 지원). 전역 TetrisLogic 로 노출한다.
(() => {
"use strict";
// 순수 게임 규칙 — DOM/오디오에 의존하지 않아 node --test로 검증한다.
const COLS = 10;
const ROWS = 20;

const SHAPES = {
  I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
  S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
  Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
  J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
  L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
};
const TYPES = Object.keys(SHAPES);

const emptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null));

// dir 1 = 시계 방향, -1 = 반시계
function rotate(m, dir) {
  const n = m.length;
  return m.map((row, y) => row.map((_, x) => (dir > 0 ? m[n - 1 - x][y] : m[x][n - 1 - y])));
}

function collides(board, shape, px, py) {
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (!shape[y][x]) continue;
      const bx = px + x;
      const by = py + y;
      if (bx < 0 || bx >= COLS || by >= ROWS) return true;
      if (by >= 0 && board[by][bx]) return true;
    }
  }
  return false;
}

// shortcut: 단순 벽차기(좌우 1~2칸, 위로 1칸), 정식 SRS 킥 테이블이 필요해지면 교체
const KICKS = [[0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1]];

function tryRotate(board, piece, dir) {
  const shape = rotate(piece.shape, dir);
  for (const [dx, dy] of KICKS) {
    if (!collides(board, shape, piece.x + dx, piece.y + dy)) {
      return { ...piece, shape, x: piece.x + dx, y: piece.y + dy };
    }
  }
  return null;
}

function merge(board, piece) {
  const next = board.map((row) => row.slice());
  piece.shape.forEach((row, y) =>
    row.forEach((v, x) => {
      const by = piece.y + y;
      if (v && by >= 0) next[by][piece.x + x] = piece.type;
    }),
  );
  return next;
}

function clearLines(board) {
  const kept = board.filter((row) => row.some((c) => !c));
  const cleared = ROWS - kept.length;
  const fresh = Array.from({ length: cleared }, () => Array(COLS).fill(null));
  return { board: [...fresh, ...kept], cleared };
}

const LINE_POINTS = [0, 100, 300, 500, 800];
const lineScore = (cleared, level) => LINE_POINTS[cleared] * level;
const levelFor = (lines) => Math.floor(lines / 10) + 1;
const gravityMs = (level) =>
  Math.max(30, Math.round(1000 * Math.pow(0.8 - (level - 1) * 0.007, level - 1)));

// 7개를 섞은 묶음 — 같은 블록이 오래 안 나오는 일을 막는다
function makeBag(rand = Math.random) {
  const bag = TYPES.slice();
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

function spawn(type) {
  const shape = SHAPES[type];
  // I는 두 번째 줄에 블록이 있으므로 한 칸 위에서 시작해 맨 윗줄에 맞춘다
  return { type, shape, x: Math.floor((COLS - shape.length) / 2), y: type === "I" ? -1 : 0 };
}

globalThis.TetrisLogic = { COLS, ROWS, SHAPES, TYPES, emptyBoard, rotate, collides, tryRotate, merge, clearLines, lineScore, levelFor, gravityMs, makeBag, spawn };
})();
