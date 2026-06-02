# 🐿️ 다람쥐 택시 — 기사님(관리자) 프론트엔드

농촌 마을 공동 택시 예약 시스템 **다람쥐 택시**의 **기사님(관리자)용** 화면입니다.
신청 확정·취소, 예약 합치기, 오늘/월별 운행 현황, 전화 신청 대리 접수를 할 수 있어요.

- 프레임워크: **Next.js 15 (App Router) + React 19 + TypeScript**
- 백엔드: 이미 배포된 `daramjwi-taxi-server` (Supabase + Next.js API) 에 그대로 연결
- 디자인: `daramjwi_for_driver.html` 프로토타입을 그대로 옮긴 따뜻한 주황색 "폰 화면" UI
- 실시간: 예약이 바뀌면 Supabase Realtime 으로 화면이 자동 갱신

> 전체 그림: **백엔드 1개 + 프론트 2개(주민용 · 기사님용)**.
> 이 저장소는 그중 **기사님용**입니다. 주민용은 별도 앱으로, 같은 백엔드를 공유합니다.

---

## 1. 빠른 시작 (로컬)

```bash
# 1) 의존성 설치
npm install

# 2) 환경변수 파일 만들기
cp .env.local.example .env.local
#   → .env.local 을 열어 값 확인 (아래 2번 참고)

# 3) 개발 서버 실행
npm run dev
#   → http://localhost:3000
```

화면이 뜨면 하단의 **🛠️ 기사님으로 바로 로그인 (테스트)** 버튼으로 바로 들어갈 수 있어요.
(실 SMS 인증은 발신 연동 후 작동 — 아래 4번 참고)

---

## 2. 환경변수 (`.env.local`)

| 변수 | 설명 |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | 백엔드 주소. 기본값 `https://daramjwi-taxi-server.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL (OTP 로그인 · 실시간 동기화용) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon(publishable) 키 — 공개되어도 안전, 데이터는 RLS 로 보호 |
| `NEXT_PUBLIC_ENABLE_DEV_LOGIN` | `true` 면 임시 로그인 버튼 노출. 운영 오픈 시 `false` |

> ❗ `SUPABASE_SERVICE_ROLE_KEY` 는 **절대** 프론트에 넣지 마세요. 백엔드 전용이며 RLS 를 우회합니다.

`.env.local` 에 들어갈 실제 두 값은 백엔드 팀이 따로 전달한 것을 그대로 붙여넣으면 됩니다.

---

## 3. Vercel 배포

1. 이 폴더를 GitHub 저장소로 올립니다.
2. [Vercel](https://vercel.com) 에서 **New Project → 저장소 선택**. (프레임워크 자동 감지: Next.js)
3. **Environment Variables** 에 위 4개를 그대로 등록합니다.
4. Deploy. 주민용 앱과 같은 Vercel 무료 계정에서 함께 운영할 수 있어요.
5. 원하면 `admin.다람쥐택시.com` 같은 별도 도메인을 연결하세요 (역할별 URL 분리).

빌드/타입 점검:

```bash
npm run build        # 프로덕션 빌드
npx tsc --noEmit     # 타입만 점검
```

---

## 4. 로그인 (지금 / 나중)

- **지금 (개발 중):** 진짜 SMS OTP 발신이 아직 연동 전이라, 임시로
  `POST /api/dev/login { role: "admin" }` 을 호출하는 **테스트 로그인 버튼**을 둡니다.
  `NEXT_PUBLIC_ENABLE_DEV_LOGIN=true` 일 때만 보입니다.
- **나중 (운영):** 휴대폰 번호 입력 → Supabase **Phone OTP** (`signInWithOtp` / `verifyOtp`) 로
  인증 후, `role === "admin"` 인 계정만 통과시킵니다. (코드는 이미 들어가 있고, SMS 발신만 붙으면 동작)
- 운영 오픈 시 `NEXT_PUBLIC_ENABLE_DEV_LOGIN` 을 `false` 로 바꾸면 테스트 버튼이 사라집니다.

---

## 5. 폴더 구조

```
app/
  layout.tsx        # 메타데이터 · 뷰포트 · globals.css
  page.tsx          # 스플래시 → 세션복원 → 로그인 → AdminShell
  globals.css       # 프로토타입 CSS 그대로 (주황 테마 · 폰 셸 · 카드 · 모달 등)
components/
  LoginScreen.tsx   # 휴대폰 OTP + 임시 로그인
  Toast.tsx         # 하단 토스트 알림
  admin/
    AdminShell.tsx  # 페이지 라우팅 + 실시간 구독 + AdminCtx 제공
    ctx.tsx         # useAdmin() 컨텍스트 (goPage/tick/bump/...)
    Modals.tsx      # 바텀시트 공용 컴포넌트
    Home.tsx        # 홈 (대시보드: 잔여운행 · 대기건수 · 메뉴)
    WaitingList.tsx # 대기/확정/취소 탭 · 확정 · 취소 · 합치기
    TodayRuns.tsx   # 오늘 운행
    Monthly.tsx     # 월별 현황 (주간 캘린더 + 통계 + 날짜 상세)
    PhoneIntake.tsx # 전화 신청 6단계 입력
lib/
  api.ts            # 백엔드 호출 (Bearer 토큰 자동 첨부)
  supabase.ts       # OTP · 실시간용 Supabase 클라이언트
  types.ts          # 백엔드 응답 타입
  format.ts         # KST 날짜/시간 포맷 헬퍼
public/             # PWA manifest + 아이콘
```

---

## 6. 백엔드 연동 메모

- 모든 관리자 API 는 `Authorization: Bearer <access_token>` + `role=admin` 필요.
- 주요 엔드포인트: `/api/admin/dashboard`, `/api/admin/reservations`(목록/접수),
  `/api/admin/reservations/{id}/confirm|cancel`, `/api/admin/reservations/merge`,
  `/api/admin/stats`, `/api/runs/today`, `/api/availability`, `/api/locations`, `/api/time-slots`.
- 실시간: `supabase.realtime.setAuth(token)` 후 `reservations` 테이블의 변경을 구독합니다.
  (setAuth 를 빼면 RLS 때문에 이벤트가 오지 않아요.)
- 시간은 **KST(한국시간)** 기준. `lib/format.ts` 가 서버의 날짜 계산과 동일하게 맞춰져 있습니다.

참고 자료:
- 백엔드 저장소: <https://github.com/Okinews-Yeonsongi/daramjwi-taxi-server>
- 인계 문서: `docs/FRONTEND_HANDOFF.md`
- API 응답 정답지(테스트 콘솔): <https://daramjwi-taxi-server.vercel.app/dev-console.html>
- 헬스체크: <https://daramjwi-taxi-server.vercel.app/api/health>
