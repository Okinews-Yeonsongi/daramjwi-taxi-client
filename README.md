# 🐿️ 다람쥐 택시 — 프런트엔드 (MVP)

옥천군 청산면  농촌형 교통 서비스 "다람쥐 택시"의 **프런트엔드 프로토타입**
이장님·행정 담당자용 관리자 화면과 주민·가족용 예약 화면을 분리, 동일한 예약 데이터를 공유하도록 설계.
고령자 사용성과 전화 접수 시나리오가 최우선.

> Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · PWA

## 빠른 시작

```bash
npm install
npm run dev        # http://localhost:3000
```

- `/` 역할 선택 → `/admin` (이장님·관리자) / `/resident` (주민·가족)
- mock(인메모리) 데이터라 DB 설정 없이 모든 화면이 클릭됨. (서버 재시작 시 초기화)

## 폴더 구조

```
app/
  (admin)/admin/        홈 대시보드 · 신청목록 · 전화접수 · 주민
  (resident)/resident/  홈 · 탑승신청 · 오늘운행 · 마을현황 · 내예약
  actions/              Server Actions (예약 생성/확정/취소, 주민 등록)
components/
  ui/                   Button·Card·Badge·Input·Sheet (self-contained)
  admin/ · resident/    화면별 컴포넌트
lib/
  types.ts              도메인 타입
  constants.ts          한도·시간·장소·상태 메타·포맷터
  booking.ts            예약 가능일·슬롯 사용량 맵
  dal/                  DataAccess 인터페이스 + mock 구현
  mock/seed.ts          데모 시드 (오늘=2026-05-18 고정)
public/                 manifest.webmanifest · sw.js · icons/
```

## 백엔드 연동 지점

화면/Server Actions는 **`lib/dal`의 `DataAccess` 인터페이스에만 의존**합니다.
백엔드 팀은 이 인터페이스를 구현한 모듈(예: REST/Supabase 클라이언트)을 만들어
`lib/dal/index.ts`의 `db` 한 줄만 교체하기. UI 코드 수정 불필요.

## 도메인 규칙

- 마을 월 112회, 1일 4회, 한 운행당 최대 4인 동승
- 예약 윈도우: 최소 4일 ~ 최대 7일 전 (당일은 전화)
- 확정 시 운행 횟수 차감, 취소 시 복구 (mock에서 시뮬레이션)
- 통합 카운터: 전화 접수 + 직접 예약 합산

> 📝 검증된 빌드(`next build` 통과), 데이터는 mock 기준
