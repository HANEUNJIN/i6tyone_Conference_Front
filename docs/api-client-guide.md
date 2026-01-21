# API 클라이언트 가이드 & 컨벤션

> **목표**
- 모든 API 결과를 **표준화**해 화면 코드를 단순화
- **인증/401/재시도/다운로드** 등 공통 처리를 **중앙집중화**
- 도메인 모듈(`api/*.js`)의 **패턴 일관성** 유지
- 반환 규격 **단일화**: `{ ok, data, status, error, headers, raw  }`


---

## 1) 디렉터리 & 역할

```
utils/http.js      # Axios 인스턴스/인터셉터, normalizeError/Response, 재시도/타임아웃
api/_client.js     # http 래퍼 재노출: get/post/put/delete/form/download
api/*.js           # 도메인별 API: 엔드포인트+파라미터 조합, 결과는 그대로 반환
utils/url.js       # buildUrl(path, params)
utils/errors.js    # 사용자 메시지 매핑(getErrorMessage/getResultErrorMessage)
```

---

## 2) 반환 규격 & 성공 판정

```ts
type ApiResult<T = any> = {
  ok: boolean;          // 성공 여부(아래 규칙 적용)
  data: T | null;       // 서버 payload(성공 시)
  status: number;       // HTTP status
  headers?: any;        // 응답 헤더
  error?: any;          // 실패 정보(normalizeError)
  raw?: any;            // axios 원본 응답/에러
}
```

**성공 판정 규칙**
- 기본: **HTTP 2xx** 이면 `ok: true`
- 서버가 `resultCd`를 사용한다면: **`resultCd === 0`**일 때만 `ok: true`  
  (이 로직은 `normalizeResponse` 내부에서 처리 → 화면에서는 **무조건 `res.ok`만** 본다)

---

## 3) 사용 패턴 (요약)

- **GET 쿼리**: `buildUrl(path, params)` → `client.get(url)`
- **본문(POST/PUT)**: `client.post/put(path, body)`
- **업로드**: `client.form(path, FormData)`
- **다운로드**: `client.download(url[, options])`
- **성공 판정**: `if (!res.ok) {...}` (필요 시 `res.status` 참고)

```js
import client from '@/api/_client'
import { buildUrl } from '@/utils/url'
import { useApiToast } from '@/composables/useApiToast'

const { errorFromResult, errorFromException } = useApiToast()

async function example() {
  try {
    const url = buildUrl('/api/board', { PageNum: 1, PageSize: 15 })
    const res = await client.get(url)
    if (!res.ok) return errorFromResult(res)
    // res.data 사용
  } catch (e) {
    errorFromException(e, '요청에 실패했습니다.')
  }
}
```

---

## 4) 인증 & 401 처리

- **토큰 자동 첨부**: `provideAuthToken(() => token)`  
  → 모든 요청에 `Authorization: Bearer <token>` 자동 포함
- **401 일괄 처리**: `provideOnUnauthorized(() => { logout(); router.replace('/login') })`  
  → 사용처에서 401을 **개별 처리하지 않는다**

> Refresh 토큰 플로우가 있으면 응답 인터셉터에서 **동시성 락**으로 1회만 갱신 후 원요청 재시도.

---

## 5) 재시도(선택 옵션)

- 기본은 **OFF**. **필요한 요청에만** 켠다(주로 GET/멱등)
- 옵션(요청 단위 `config.retry`):
  - `retries`: 재시도 횟수 (기본 0)
  - `delay`: 최초 대기(ms)
  - `backoff`: 지수 백오프 사용 여부 (기본 `true`)
  - `retryOnStatus`: `[408, 429, 502, 503, 504]`
  - `retryOnNetworkError`: `true`
  - `methods`: `['get','head','options']`

```js
client.get(url, {
  retry: { retries: 3, delay: 300, backoff: true, retryOnStatus: [429, 502, 503, 504] },
})
```

---

## 7) 에러/토스트 처리 표준

```js
// 응답 에러
if (!res.ok) errorFromResult(res)

// 예외 (try/catch)
catch (e) { errorFromException(e, '네트워크 오류가 발생했습니다.') }
```

- `utils/errors.js`의 `DefaultMessages`와 코드 매핑으로 **친화적 메시지** 출력
- API 모듈에서는 **토스트를 직접 띄우지 않는다**(화면/컴포저블 역할)


---

## 8) API 모듈 작성 규칙 (`api/*.js`)

- 파일 상단에 **BASE** 상수 선언 (가능하면 모듈당 1개)
- GET은 **반드시 `buildUrl`** 로 쿼리 생성
- 민감정보는 **절대 GET 쿼리에 넣지 않음** (POST/FORM 사용)
- 반환은 가능한 **그대로** (`client.*`) 리턴, 필요할 때만 async/await로 재가공
- **동사 기반 네이밍**: `list / detail / create / modify / delete / listFiles / downloadFile / saveDraft / loadDraft`

**예시**
```js
// api/notices.js
import client from './_client'
import { buildUrl } from '@/utils/url'

const BASE = '/api/board'

export const NoticesAPI = {
  list(params) {
    const url = buildUrl(BASE, { PageNum: params.page, PageSize: params.size, Keyword: params.keyword })
    return client.get(url, { retry: { retries: 2, backoff: true } }) // 필요 시만 재시도
  },
  detail({ seq, userId }) {
    return client.get(buildUrl(`${BASE}/detail`, { Seq: seq, UserId: userId }))
  },
  create(fd) { return client.form(BASE, fd) },
  modify(seq, fd) { return client.form(`${BASE}/${seq}`, fd) },
  delete(seq) { return client.delete(buildUrl(BASE, { Seq: seq })) },
}
```

---

## 10) async/await 사용 가이드

**써야 할 때**
- 응답을 **재구성**해서 다른 타입으로 반환(예: 로그인에서 `token/user` 조합)
- **의존 순차 호출** 필요
- `try/catch`에서 **특수 로깅/메시지** 처리 필요

**그 외**: **그대로 반환**
```js
// 단순 위임
return client.get(url)    // OK (async/await 불필요)
```

---

## 14) 샘플 스니펫

**화면(목록)**
```js
async function fetchList({ page, size, keyword }) {
  try {
    const res = await NoticesAPI.getList({ page, size, keyword })
    if (!res.ok) return { items: [], total: 0 }  // 안전 반환
    const list = res.data?.resultData?.list ?? []
    const total = Number(res.data?.resultData?.totCnt ?? list?.[0]?.totCnt ?? 0) || 0
    return { items: list, total }
  } catch (e) {
    useApiToast().errorFromException(e, '목록 조회 실패')
    return { items: [], total: 0 }
  }
}
```

**화면(등록)**
```js
const ok = handleResult(await NoticesAPI.postCreate(fd), {
  successMessage: '등록되었습니다.',
  onSuccess: () => router.replace({ name: ROUTE.Notices.Hq.List }),
})
if (!ok) return
```

---


