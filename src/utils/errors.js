import { DefaultMessages } from '@/constants';

// 다양한 형태의 에러를 받아 사용자 메시지로 변환
export function getErrorMessage(err) {
  // normalizeError 결과 형태: { message, status, code, isNetwork, raw }
  const status = err?.status ?? err?.raw?.response?.status ?? err?.response?.status ?? 0;
  const code = err?.code ?? err?.raw?.response?.data?.code ?? 'UNKNOWN';
  const serverMsg =
    err?.error?.message ??
    err?.raw?.response?.data?.message ??
    err?.response?.data?.message ??
    err?.message;

  // 우선순위: 네트워크/타임아웃 → 상태코드 → 서버메시지 → 디폴트
  if (err?.isNetwork || code === 'ECONNABORTED') {
    if (code === 'ECONNABORTED') return DefaultMessages.TIMEOUT;
    return DefaultMessages.NETWORK;
  }
  if (status === 401) return DefaultMessages.UNAUTHORIZED;
  if (status === 403) return DefaultMessages.FORBIDDEN;
  if (status === 404) return DefaultMessages.NOT_FOUND;
  if (status === 429) return DefaultMessages.RATE_LIMIT;
  if (status === 408) return DefaultMessages.TIME_OVER;
  if (status >= 500) return DefaultMessages.SERVER;
  if (status >= 400) return serverMsg || DefaultMessages.CLIENT;

  return serverMsg || DefaultMessages.UNKNOWN;
}

// API 표준 응답({ ok, data, error })에서 실패 메시지 가져오기
export function getResultErrorMessage(result) {
  console.log(result);
  if (!result) return DefaultMessages.UNKNOWN;
  if (result.ok) return '';
  return getErrorMessage(result.error || result);
}
