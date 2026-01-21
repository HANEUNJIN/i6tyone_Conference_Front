import axios from 'axios';
import { getErrorMessage } from '@/utils/errors';

/** ─────────────────────────────────────────────────────────────
 * 주입 훅 (외부에서 제공)
 *  - provideAuthToken(() => store.token)
 *  - provideOnUnauthorized(() => { logout(); router.replace('/login') })
 * 기본값: 토큰 없음, 콜백 없음
 * ──────────────────────────────────────────────────────────── */
let _getToken = () => null;
let _onUnauthorized = null;

export function provideAuthToken(fn) {
  _getToken = fn;
}
export function provideOnUnauthorized(fn) {
  _onUnauthorized = fn;
}

/** ─────────────────────────────────────────────────────────────
 * Axios 인스턴스
 * ──────────────────────────────────────────────────────────── */
export const http = axios.create({
  baseURL: import.meta.env.VITE_APP_API_URL || '/', // ← .env에 맞춰 사용
  // timeout: 15000,
  // withCredentials: true, // 쿠키 세션 쓸 때만 켜세요
});

/** ─────────────────────────────────────────────────────────────
 * 에러 표준화: 화면/로거에서 message만 써도 일관되게 보이도록
 * - 메시지 결정 로직은 utils/errors.getErrorMessage로 단일화
 * ──────────────────────────────────────────────────────────── */
export function normalizeError(error) {
  const isNetwork = !!(error && !error.response);
  const status = error?.response?.status ?? 0;
  const code = error?.response?.data?.code || error?.code || 'UNKNOWN';

  const message = getErrorMessage({
    status,
    code,
    isNetwork,
    raw: error,
  });

  return {
    code,
    message,
    status,
    isNetwork,
    raw: error,
  };
}

/** ─────────────────────────────────────────────────────────────
 * 재시도 판단 & 유틸
 * ──────────────────────────────────────────────────────────── */
function shouldRetry(error, cfg) {
  const retry = cfg.retry || {};
  const {
    retryOnStatus = [408, 429, 502, 503, 504],
    retryOnNetworkError = true,
    methods = ['get', 'head', 'options'],
  } = retry;

  const method = (cfg.method || 'get').toLowerCase();
  if (!methods.includes(method)) return false;

  if (!error.response) return retryOnNetworkError; // 네트워크/타임아웃 등
  return retryOnStatus.includes(error.response.status);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** ─────────────────────────────────────────────────────────────
 * 인터셉터: 요청
 *  - 외부에서 주입한 토큰을 Authorization에 붙임
 * ──────────────────────────────────────────────────────────── */
http.interceptors.request.use((config) => {
  try {
    const token = _getToken?.();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (_) {
    // 토큰 주입 함수 에러는 조용히 무시
  }
  if (config.__retryCount == null) {
    config.__retryCount = 0;
  }
  return config;
});

/** ─────────────────────────────────────────────────────────────
 * 인터셉터: 응답
 *  - 401이면 onUnauthorized 콜백 호출(있으면)
 *  - 그 외는 선택적 재시도(기본 OFF) → 실패 시 normalizeError로 반환
 *  - 요청 config에 추가 가능한 옵션
 * {
 *   retry?: {
 *     retries?: number           // 재시도 횟수 (기본 0=OFF)
 *     delay?: number             // 첫 딜레이(ms), backoff=true면 2의 지수로 증가
 *     backoff?: boolean          // 지수 백오프 사용 (기본 true)
 *     retryOnStatus?: number[]   // 재시도할 상태코드 (기본 [408,429,502,503,504])
 *     retryOnNetworkError?: boolean // 네트워크 오류 재시도 여부 (기본 true)
 *     methods?: string[]         // 재시도 허용 메서드 (기본 ['get','head','options'])
 *   }
 * }
 * 예시
 * export const testAPI = (params) =>
 *   apiGet(url, {
 *     params,
 *     retry: { retries: 3, delay: 300, backoff: true, retryOnStatus: [429, 502, 503, 504] },
 *   })
 * ──────────────────────────────────────────────────────────── */
http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const cfg = error.config || {};
    const status = error?.response?.status ?? 0;
    let unauthorizedNotified = false;

    // 401: 즉시 콜백(있으면) 수행하고 에러 반환
    if (status === 401) {
      try {
        _onUnauthorized && _onUnauthorized();
      } finally {
        return Promise.reject(normalizeError(error));
      }
    }

    // 재시도 옵션 없거나 횟수 0 → 바로 표준화
    const retry = cfg.retry;
    if (!retry || (retry.retries ?? 0) <= 0) {
      return Promise.reject(normalizeError(error));
    }

    cfg.__retryCount = cfg.__retryCount || 0;
    if (!shouldRetry(error, cfg)) {
      return Promise.reject(normalizeError(error));
    }
    if (cfg.__retryCount >= (retry.retries ?? 0)) {
      return Promise.reject(normalizeError(error));
    }

    // 지수 백오프
    cfg.__retryCount += 1;
    const base = retry.delay ?? 300;
    const useBackoff = retry.backoff ?? true;
    const delay = useBackoff ? base * Math.pow(2, cfg.__retryCount - 1) : base;

    if (import.meta.env.DEV) {
      console.debug(
        `[http:retry] ${cfg.url} (${cfg.__retryCount}/${retry.retries}) in ${delay}ms`,
        error?.response?.status || error?.code,
      );
    }

    await sleep(delay);
    return http(cfg);
  },
);

/** ─────────────────────────────────────────────────────────────
 * 응답 표준화: Axios → { ok, data, status, headers, raw, error }
 *  - 서버가 { resultCd, resultData } 규약이면 ok = (2xx && resultCd === 0)
 * ──────────────────────────────────────────────────────────── */
export function normalizeResponse(res) {
  const status = res?.status ?? 0;
  const headers = res?.headers ?? {};
  const data = res?.data;
  let ok = status >= 200 && status < 300;

  // 서버 규약(resultCd)을 따르는 경우
  const resultCd = data?.resultCd;
  if (typeof resultCd === 'number') {
    ok = ok && resultCd === 0;
  }

  let error = undefined;
  if (!ok) {
    // 비즈니스 실패(2xx + resultCd != 0) 등에 대한 표준화된 에러 객체 생성
    // code 우선순위: 서버 code → resultCd → UNKNOWN
    const code = data?.code ?? (typeof resultCd === 'number' ? String(resultCd) : 'UNKNOWN');

    // getErrorMessage는 status/코드/서버메시지를 바탕으로 사용자 메시지를 결정
    // raw에는 Axios response를 전달해 서버 메시지 파싱이 가능하도록 함
    const message = getErrorMessage({
      status,
      code,
      isNetwork: false,
      raw: { response: { status, data } },
      message: data?.message,
    });

    error = {
      code,
      message,
      status,
      isNetwork: false,
      raw: res,
    };
  }

  return { ok, data, status, headers, raw: res, error };
}

/** ─────────────────────────────────────────────────────────────
 * 간편 래퍼
 * ──────────────────────────────────────────────────────────── */
export async function apiGet(url, config = {}) {
  const res = await http.get(url, config);
  return normalizeResponse(res);
}
export async function apiPost(url, body, config = {}) {
  const res = await http.post(url, body, config);
  return normalizeResponse(res);
}
export async function apiPut(url, body, config = {}) {
  const res = await http.put(url, body, config);
  return normalizeResponse(res);
}
export async function apiDelete(url, config = {}) {
  const res = await http.delete(url, config);
  return normalizeResponse(res);
}
export async function apiForm(url, formData, config = {}) {
  const cfg = {
    headers: { 'Content-Type': 'multipart/form-data', ...(config.headers || {}) },
    ...config,
  };
  const res = await http.post(url, formData, cfg);
  return normalizeResponse(res);
}

export default http;
