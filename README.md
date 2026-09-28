# i6tyone_front

2026 아이자야씩스티원 컨퍼런스 등록 UI/UX 개발.
Vue 3 + Vite 기반의 SPA로, 모듈화된 라우팅, 상태관리(Pinia), 표준화된 API 클라이언트, 일관된 코드 스타일(ESLint + Prettier)을 채택합니다.

<p align="left">
  <img alt="Vue 3" src="https://img.shields.io/badge/Vue-3.x-42b883?logo=vue.js&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-7.x-646cff?logo=vite&logoColor=white">
  <img alt="Pinia" src="https://img.shields.io/badge/Pinia-latest-f7d336?logo=vue.js&logoColor=black">
  <img alt="ESLint" src="https://img.shields.io/badge/ESLint-configured-4b32c3?logo=eslint&logoColor=white">
  <img alt="Prettier" src="https://img.shields.io/badge/Prettier-configured-1a2b34?logo=prettier&logoColor=white">
  <img alt="Node LTS" src="https://img.shields.io/badge/Node-LTS-339933?logo=node.js&logoColor=white">
</p>

---

## 목차

1. [빠른 시작](#-빠른-시작)
2. [환경 변수(.env) 설정](#-환경-변수env-설정)
3. [기술 스택](#-기술-스택)
4. [시스템 아키텍처](#-시스템-아키텍처)
5. [프로젝트 구조](#-프로젝트-구조)
6. [라우팅 가이드](#-라우팅-가이드)
7. [네이밍 규칙](#-네이밍-규칙)
8. [코드 스타일/품질](#-코드-스타일품질)
9. [개발 흐름(How to)](#-개발-흐름how-to)
10. [API 사용 요약](#-api-사용-요약)

---

## 🚀 빠른 시작

### 사전 준비
- Node.js 최신 LTS 설치
- npm 최신 버전 권장

### 설치/실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (기본 포트 3000)
npm run dev
# http://localhost:3000
```

### 프로덕션 빌드/미리보기

```bash
npm run build
npm run preview
```

---

## 🔐 환경 변수(.env) 설정

### 파일 구분
- `.env` — 공통 기본값
- `.env.development` — 개발 환경
- `.env.production` — 운영 환경

### 예시

```dotenv
VITE_API_BASE_URL=/api
VITE_APP_NAME=i6tyone_front
VITE_ENABLE_LOG=true
```

### 가이드
- Vite는 **`VITE_` 접두사**만 클라이언트로 노출합니다.
- **민감정보**(비밀키/자격증명 등)는 클라이언트 `.env`에 두지 않습니다.

---

## 🧩 기술 스택

- **Core**: Vue 3 (Composition API), Vite, Vue Router, Pinia)
- **HTTP**: Axios
- **스타일**: Sass/SCSS, PostCSS, Autoprefixer
- **UI**: CoreUI
- **차트/에디터/날짜**: Chart.js, CKEditor, DatePicker
- **품질**: ESLint, Prettier, Browserslist, EditorConfig

---

## 🏗 시스템 아키텍처

### 레이어드 구조
- **Views/Components**: 화면 렌더링, 최소한의 페이지 로직
- **Composables**: `useXxx` 훅으로 상태/행동 재사용(토스트, 모달, 페이지네이션 등)
- **API(도메인 모듈)**: 엔드포인트 + 파라미터 조합, **표준 결과로 반환**
- **HTTP Utils**: Axios 인스턴스/인터셉터, 응답 정규화(`ok`, `data`, `status` ...)
- **Router**: 모듈화 라우트, 전역 가드(권한/로그인 상태)
- **Store(Pinia)**: 인증/환경/테마 등 전역 상태

### 아키텍처 원칙
- 화면에서는 **도메인 API만 호출**하고 HTTP 세부 구현은 공통 레이어로 캡슐화
- **에러/권한/토스트 처리 표준화**
- **모듈 경계 명확화**(뷰-컴포저블-도메인-인프라)

데이터 흐름 (Mermaid)
```text
flowchart LR
  V[Views/Components] --> C[Composables (useXxx)]
  C --> A[API Modules (domain)]
  A --> H[HTTP Utils (Axios/Interceptors)]
  H --> S[(Server API)]
  V --> R[Router (Guards)]
  V --> P[Pinia Store]
  P --> V
```

---

## 🗂 프로젝트 구조

```text
i6tyone_FRONT/
├─ public/              → 정적 자원 루트(파비콘, 고정 HTML/이미지). Vite가 그대로 복사
│
├─ src/                 → 애플리케이션 소스 최상위
│  ├─ api/                    → API 모듈 모음(axios/_client, 엔드포인트 래퍼, 응답 표준화)
│  ├─ assets/                 → 정적 자산(이미지/아이콘/폰트)
│  ├─ components/             → 재사용 Vue 컴포넌트
│  ├─ composables/            → 재사용 로직(훅, useXXX) 보관. 상태/라우터/페이징 등 공통 로직
│  ├─ constants/              → 상수 모음
│  ├─ layouts/                → 레이아웃(헤더/사이드바/푸터 래핑)
│  ├─ router/                 → 라우팅 설정
│  │  └─ modules/             → 도메인 라우트 모듈
│  ├─ stores/                 → Pinia 스토어(인증, 전역 상태 등)
│  ├─ styles/                 → 전역 스타일(SCSS/CSS, 변수/믹스인, CoreUI 커스터마이징)
│  ├─ utils/                  → 유틸리티(url 빌더, 포맷터, 날짜/숫자 헬퍼)
│  ├─ views/                  → 라우트 단위 페이지(NoticeList/Detail 등)
│  │
│  ├─ App.vue                 → 루트 컴포넌트(레이아웃/RouterView 장착)
│  └─ main.js                 → 엔트리(앱 생성, 라우터/Pinia/전역 플러그인 마운트)
│
├─ .browserslistrc            → 지원 브라우저 범위(빌드 타겟/폴리필 기준)
├─ .editorconfig              → 에디터 공통 스타일(탭/인덴트/개행 등)
├─ .env                       → 공통 환경 변수(민감값 제외, `VITE_`만 노출)
├─ .env.development           → 개발용 환경 변수
├─ .env.production            → 운영용 환경 변수
├─ .gitattributes             → Git 속성(라인 엔딩, 바이너리 처리 등)
├─ .gitignore                 → Git 추적 제외 목록
├─ .prettierrc.js             → Prettier 포맷 설정
├─ eslint.config.mjs          → ESLint 설정(Vue/JS 규칙)
├─ index.html                 → Vite 진입 HTML(#app 등)
├─ package.json               → 프로젝트 메타/스크립트/의존성
├─ package-lock.json          → 의존성 잠금 파일
├─ README.md                  → 프로젝트 안내/개발 가이드
└─ vite.config.mjs            → Vite 설정(플러그인, 별칭(@), 서버 프록시, 빌드 옵션)
```

### 폴더 개요
- **api**: API 래퍼 및 도메인별 API 모듈
  - `_client.js`: axios 기반 공통 래퍼(`get/post/form/download`). 모든 API가 `{ ok, data, ... }` 형태로 반환되도록 일관화
  - `notices.js`, `common.js`, `user.js`, `member.js` 등 도메인 모듈
- **components**: 재사용 가능한 UI 컴포넌트
  - 예) `notices/` 공용 컴포넌트(생성/상세 카드), `ui/`(UiDataTable, UiPagination, UiSearchBar, UiModal, UiToast 등)
- **router**: 라우트 엔트리 + 기능 모듈 분리
  - `modules/`: `customers`, `dashboard`, `notices`, `projects` …
  - `index.js`: 라우터 생성 및 전역 설정
  - `routeName.js`: 라우트 이름 상수 집합(화면 간 네비게이션은 상수 사용 권장)
- **stores**: Pinia 스토어(인증/환경설정/사이드바/테마 등)
  - `auth.js`, `preferences.js`, `sidebar.js`, `theme.js`, `base.js` …
- **views**: 페이지(도메인별) 단위 컴포넌트
  - `notices/` 하위(`conv`, `custUpd`, `education`, `homepage` ...)
  - `auth/`, `dashboard/`, `customers/` …


> - 라우트는 도메인별 `router/modules` 하위에 추가
> - API는 `src/api/{domain}.js`로 분리하고 화면에서는 해당 모듈만 사용
> - 전역 토스트/모달은 composables에서 주입 받아 사용

---

## 🧭 라우팅 가이드

- **라우트 이름 상수 정의**
  - `src/router/routeName.js`에서 계층형 객체로 정의
  - 예) `ROUTE.Notices.Hq.List`, `ROUTE.Notices.Hq.Detail`
- **라우트 구성**
  - `src/router/modules/*` 에서 도메인별 라우트를 정의하고 `index.js`에서 통합
  - params/props 연동은 `props: (route) => ({ seq: route.query.seq })` 방식으로 유지 → 쿼리 복원/공유 용이
- **네비게이션 사용**
  - 컴포넌트에서는 상수 기반으로 이동
  - `router.push({ name: ROUTE.Notices.Hq.Detail, query: { seq } })`

**라우터 팁**
- 브레드크럼/타이틀/사이드바 하이라이트: `meta.title`, `meta.menuKey` 활용
- 목록 → 상세 이동 시 쿼리(`route.query`)를 그대로 병합해 **검색/페이지 상태 복원**

---

## 🔤 네이밍 규칙

**일반**
- 폴더: `kebab-case`
- Vue 컴포넌트: `PascalCase` (예: `NoticeCreateCard.vue`)
- 변수/함수: `camelCase` (예: `fetchList`, `pageSize`)
- 상수: `UPPER_SNAKE_CASE` (예: `DEFAULT_PAGE_SIZE`)
- 열거형/맵 객체: `PascalCase` (예: `RouteName`, `ErrorCode`)

**Vue**
- 이벤트 이름: 동사형(`@submit`, `@cancel`, `@change`)
- `v-model`: `modelValue` / `update:modelValue` 준수
- 슬롯: 역할이 드러나는 이름(`#header`, `#cell-name` 등)

**라우팅**
- 라우트 상수 객체: `ROUTE.Some.Feature`
- 모듈 파일명: 기능 단위(예: `notices.js`, `dashboard.js`)
- 페이지 컴포넌트: `DomainActionPage.vue` (예: `NoticesListPage.vue`)

**API**
- 파일: `api/{domain}.js`
- 메서드: 동사 기반(`list/detail/create/modify/delete/listFiles` …)
- GET: `buildUrl`로 쿼리 생성, **민감정보는 GET에 포함 금지**(POST/FORM 사용)
- 반환: `ok` 중심 표준 결과를 그대로 반환 → 화면에서 `res.ok`로만 성공 판정

**스타일**
- 전역 SCSS는 역할 명시(`_theme.scss`, `style.scss`)
- BEM 권장: `.block__element--modifier`

---

## 🧹 코드 스타일/품질

- **ESLint + Prettier**로 일관된 포맷 유지
- **import 정렬 규칙** 적용(알파벳/그룹)
- **미사용 import/변수 제거**
- Composition API 우선, 복잡 로직은 **composable로 추출**
- API 에러/예외는 **composables(`useApiToast`)**로 표준 처리

```bash
npm run lint
npm run format
```

---

## 🛠 개발 흐름(How to)

### 새 페이지 추가
1. `views/` 도메인 폴더에 페이지 컴포넌트 생성
2. `router/modules/`에 라우트 추가
3. 필요 시 `composables/`/스토어 주입
4. API 호출은 `api/{domain}.js`의 도메인 모듈을 통해 수행

### 새 API 추가
1. `api/{domain}.js` 파일 생성
2. `BASE`, 메서드 네이밍(`list/detail/…`) 정의
3. `GET=buildUrl`, `POST/PUT/FORM=본문/FormData`
4. 화면: `res.ok`로 성공 판정, 토스트는 composable에서 처리

---

## 🔌 API 사용 요약

- **공통 클라이언트**
  - `_client.js` 내 래퍼로 axios 사용
  - 예: `client.get(url)`, `client.post(url, data)`, `client.form(url, formData)`, `client.download(url)`
  - **모든 호출은** `{ ok: boolean, data: any, message?: string, code?: number }` 형태 반환

- **도메인 모듈**
  - `notices.js`, `common.js` 등에서 엔드포인트별 함수 노출
  - 목록/상세 예시
    - `const res = await NoticesAPI.getList(params)`
    - `const res = await NoticesAPI.getDetail({ seq, userId })`
    - `const res = await NoticesAPI.postCreate({ seq, userId })`
    - `const res = await NoticesAPI.putModify({ seq, userId })`

- **표준 반환**
  - 구조: `{ ok, data, status, headers, raw }`
  - 성공 판정: HTTP 2xx 또는 서버 컨벤션(`resultCd === 0`) → `res.ok`
  - 실패 처리: `useApiToast().errorFromResult(res)`
  - 예외 처리: `useApiToast().errorFromException(e)`

```js
import { buildUrl } from '@/utils/url'
import client from '@/utils/client'
import { useApiToast } from '@/composables/useApiToast'

const toastApi = useApiToast()

export async function fetchSomething(page, size, keyword) {
  try {
    const url = buildUrl('/api/items', { PageNum: page, PageSize: size, Keyword: keyword })
    const res = await client.get(url)
    if (!res.ok) return toastApi.errorFromResult(res)
    return res.data
  } catch (e) {
    toastApi.errorFromException(e, '조회에 실패했습니다.')
    return null
  }
}
```

---

## Learn More
이 프로젝트에서 주로 사용하는 라이브러리/도구입니다. 필요 시 아래 문서를 참고하세요.

- **Vue 3 (Composition API)** — https://vuejs.org/guide/introduction.html
- **Vite** — https://vitejs.dev/guide/
- **vue-router 4** — https://router.vuejs.org/
- **Pinia** — https://pinia.vuejs.org/
- **Axios** — https://axios-http.com/
- **CoreUI for Vue** — https://coreui.io/vue/docs/
- **Chart.js** — https://www.chartjs.org/docs/latest/
- **CKEditor 5 (Vue)** — https://ckeditor.com/docs/ckeditor5/latest/installation/frameworks/vuejs-v3.html
- **@vuepic/vue-datepicker** — https://vue-datepicker.com/
- **ESLint / Prettier** — https://eslint.org/ · https://prettier.io/

