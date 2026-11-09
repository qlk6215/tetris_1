import { test } from "node:test";
import assert from "node:assert/strict";
import "../logic.js";
const L = globalThis.TetrisLogic;

test("rotate: 시계 방향 4번이면 원래 모양", () => {
  let s = L.SHAPES.T;
  for (let i = 0; i < 4; i++) s = L.rotate(s, 1);
  assert.deepEqual(s, L.SHAPES.T);
  assert.deepEqual(L.rotate(L.rotate(L.SHAPES.L, 1), -1), L.SHAPES.L);
  assert.deepEqual(L.rotate(L.SHAPES.T, 1), [[0, 1, 0], [0, 1, 1], [0, 1, 0]]);
});

test("collides: 벽·바닥·쌓인 블록", () => {
  const b = L.emptyBoard();
  assert.equal(L.collides(b, L.SHAPES.O, -1, 0), true);
  assert.equal(L.collides(b, L.SHAPES.O, 8, 0), false);
  assert.equal(L.collides(b, L.SHAPES.O, 9, 0), true);
  assert.equal(L.collides(b, L.SHAPES.O, 0, 18), false);
  assert.equal(L.collides(b, L.SHAPES.O, 0, 19), true);
  b[10][0] = "I";
  assert.equal(L.collides(b, L.SHAPES.O, 0, 9), true);
  assert.equal(L.collides(b, L.SHAPES.O, 0, -1), false); // 보드 위(음수 y)는 허용
});

test("tryRotate: 벽에 붙은 I를 회전하면 안쪽으로 밀어 넣음", () => {
  const b = L.emptyBoard();
  const vertical = { type: "I", shape: L.rotate(L.SHAPES.I, 1), x: -2, y: 5 }; // 세로 I, 맨 왼쪽 열
  assert.equal(L.collides(b, vertical.shape, vertical.x, vertical.y), false);
  const r = L.tryRotate(b, vertical, 1);
  assert.ok(r);
  assert.equal(L.collides(b, r.shape, r.x, r.y), false);
});

test("clearLines: 꽉 찬 줄만 지우고 위를 내림", () => {
  const b = L.emptyBoard();
  b[19].fill("I");
  b[18].fill("O");
  b[18][3] = null;
  b[17][5] = "T";
  const { board, cleared } = L.clearLines(b);
  assert.equal(cleared, 1);
  assert.equal(board[19][3], null);
  assert.equal(board[19][0], "O");
  assert.equal(board[18][5], "T");
  assert.equal(board.length, L.ROWS);
});

test("점수·레벨·속도", () => {
  assert.equal(L.lineScore(4, 2), 1600);
  assert.equal(L.lineScore(0, 5), 0);
  assert.equal(L.levelFor(0), 1);
  assert.equal(L.levelFor(19), 2);
  assert.equal(L.gravityMs(1), 1000);
  assert.ok(L.gravityMs(5) < L.gravityMs(4));
  assert.equal(L.gravityMs(30), 30);
});

test("makeBag: 7종이 한 번씩", () => {
  assert.deepEqual(L.makeBag().sort(), [...L.TYPES].sort());
});

test("spawn: 맨 윗줄 가운데에 나타남", () => {
  for (const t of L.TYPES) {
    const p = L.spawn(t);
    const firstRow = p.shape.findIndex((r) => r.some(Boolean));
    assert.equal(p.y + firstRow, 0, t);
  }
});
