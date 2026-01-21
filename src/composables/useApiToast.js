// 목적:
// - API 호출 결과를 토스트(UI 메시지)로 일관되게 처리하기 위한 작은 헬퍼.
// - 성공/실패 메시지 규칙을 화면마다 반복 구현하지 않고, 여기서 통일.

import { useToast } from '@/composables/useToast';
import { getErrorMessage, getResultErrorMessage } from '@/utils/errors';

export function useApiToast() {
  const toast = useToast();

  function success(message) {
    if (message) toast.success(message);
  }

  // API 표준 응답에서 실패 메시지를 뽑아 토스트로 출력
  function errorFromResult(result, fallback) {
    console.log(result);
    const msg = getResultErrorMessage(result) || fallback || '';
    if (msg) toast.error(msg);
  }

  // 예외 객체(try/catch의 e)에서 실패 메시지를 뽑아 토스트로 출력
  function errorFromException(e, fallback) {
    const msg = getErrorMessage(e) || fallback || '';
    if (msg) toast.error(msg);
  }

  // 통합 핸들러: 성공시 메시지(optional), 실패시 표준 에러 메시지
  function handleResult(result, { successMessage, onSuccess } = {}) {
    if (!result?.ok) {
      errorFromResult(result);
      return false;
    }
    if (successMessage) success(successMessage);
    onSuccess?.(result.data);
    return true;
  }

  return {
    success,
    errorFromResult,
    errorFromException,
    handleResult,
  };
}
