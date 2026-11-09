# 블록 낙하

브라우저에서 바로 하는 낙하 블록 퍼즐. 빌드 과정 없는 정적 사이트(HTML/CSS/JS)입니다.

- 배경음·효과음: Web Audio로 직접 합성 (외부 음원 없음)
- 점수 랭킹·피드백: `config.js`가 비어 있으면 브라우저(localStorage)에, 채우면 Supabase에 저장

## 실행

```bash
npm run dev   # http://localhost:3000
npm test      # 게임 규칙 테스트
```

## Supabase 연결

1. Supabase 프로젝트 생성 → SQL Editor에서 [supabase/schema.sql](supabase/schema.sql) 실행
2. Project Settings → API의 Project URL과 `anon` public key를 [config.js](config.js)에 입력
3. 커밋·푸시하면 Vercel이 다시 배포

## 조작

| 키 | 동작 |
|---|---|
| ← → | 이동 |
| ↑ / X | 회전 |
| Z | 반대 회전 |
| ↓ | 빠르게 내리기 |
| Space | 바로 내리기 |
| P / Esc | 일시정지 |
| M | 소리 켜기/끄기 |

모바일에서는 화면 아래 터치 버튼으로 조작합니다.
