// 배경음·효과음 모두 Web Audio로 합성한다 (외부 음원 없음 → 라이선스 문제 없음).
let ctx = null;
let master, musicGain, sfxGain;
let muted = false;
try {
  muted = localStorage.getItem("muted") === "1";
} catch {
  /* 저장소 차단 시 기본값 사용 */
}

// 브라우저 정책상 사용자 입력(클릭/키) 이후에만 소리를 낼 수 있다
export function unlock() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.16;
    musicGain.connect(master);
    sfxGain = ctx.createGain();
    sfxGain.gain.value = 0.45;
    sfxGain.connect(master);
  }
  if (ctx.state === "suspended") ctx.resume();
}

export const isMuted = () => muted;
export function toggleMute() {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : 1;
  try {
    localStorage.setItem("muted", muted ? "1" : "0");
  } catch {
    /* 무시 */
  }
  return muted;
}

const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

function tone(freq, start, dur, { type = "square", gain = 0.3, dest = sfxGain, slideTo } = {}) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(dest);
  o.start(start);
  o.stop(start + dur + 0.02);
}

const fx = (fn) => {
  if (ctx) fn(ctx.currentTime);
};
const arp = (notes, step, opts) =>
  fx((t) => notes.forEach((n, i) => tone(hz(n), t + i * step, step * 1.6, opts)));

export const sfx = {
  move: () => fx((t) => tone(620, t, 0.035, { gain: 0.12 })),
  rotate: () => fx((t) => tone(840, t, 0.06, { type: "triangle", gain: 0.22, slideTo: 1180 })),
  lock: () => fx((t) => tone(170, t, 0.09, { type: "triangle", gain: 0.35 })),
  hardDrop: () => fx((t) => tone(320, t, 0.16, { type: "sawtooth", gain: 0.22, slideTo: 70 })),
  clear: (n) => arp([72, 76, 79, 84].slice(0, n === 4 ? 4 : n + 1), 0.06, { type: "square", gain: 0.25 }),
  levelUp: () => arp([67, 72, 76, 79, 84], 0.07, { type: "triangle", gain: 0.3 }),
  gameOver: () => arp([69, 65, 62, 57, 52], 0.16, { type: "sawtooth", gain: 0.2 }),
};

// 오리지널 루프 (A 단조, 8분음표 32스텝)
const MELODY = [
  69, 72, 76, 72, 74, null, 72, 71, 69, null, 64, 69, 71, 72, 71, null,
  65, 69, 72, 69, 67, null, 65, 64, 62, 65, 69, 67, 64, null, null, null,
];
const BASS = [45, 45, 43, 40, 41, 43, 38, 40]; // 4스텝마다 근음
const STEP = 60 / 138 / 2;

let timer = null;
let step = 0;
let nextTime = 0;

function schedule() {
  while (nextTime < ctx.currentTime + 0.12) {
    const m = MELODY[step % MELODY.length];
    if (m) tone(hz(m), nextTime, STEP * 0.9, { type: "square", gain: 0.22, dest: musicGain });
    const b = BASS[Math.floor(step / 4) % BASS.length] + (step % 2 ? 12 : 0);
    tone(hz(b), nextTime, STEP * 0.8, { type: "triangle", gain: 0.4, dest: musicGain });
    nextTime += STEP;
    step++;
  }
}

export const music = {
  start() {
    if (!ctx || timer) return;
    step = 0;
    nextTime = ctx.currentTime + 0.05;
    timer = setInterval(schedule, 25);
  },
  stop() {
    clearInterval(timer);
    timer = null;
  },
};
