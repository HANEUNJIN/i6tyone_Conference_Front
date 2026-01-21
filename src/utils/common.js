import { useToast } from '@/composables/useToast';
import { useConfirmModal } from '@/composables/useConfirmModal';

export function formatBytes(bytes) {
  if (bytes == null) return '';
  let v = Number(bytes);
  if (!Number.isFinite(v)) return '';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  const digits = v < 10 && i > 0 ? 1 : 0;
  return `${v.toFixed(digits)} ${units[i]}`;
}

// 내부 유틸: 한 자리 수를 0으로 채움
const pad2 = (n) => String(n).padStart(2, '0');

// 어떤 입력이 와도 'YYYYMMDD'로 정규화
export function normalizeYmd(input) {
  if (input == null) return '';

  // 'undefined' 같은 문자열 또는 빈 문자열 방지
  if (typeof input === 'string') {
    input = input.trim();
    if (input === '' || input.toLowerCase() === 'undefined') return '';
  }

  // Date 객체 처리: YYYYMMDD 형식으로 반환 (month는 0부터 시작하므로 +1)
  if (input instanceof Date && !isNaN(input)) {
    const y = input.getFullYear();
    const m = pad2(input.getMonth() + 1);
    const d = pad2(input.getDate());
    return `${y}${m}${d}`;
  }

  // 숫자 → 문자열 변환
  if (typeof input === 'number' && Number.isFinite(input)) {
    input = String(input);
  }

  if (typeof input === 'string') {
    const cleanedInput = input.replace(/[-/.]/g, '');

    if (/^\d{8}$/.test(cleanedInput)) {
      return cleanedInput;
    }
    if (/^\d{6}$/.test(cleanedInput)) {
      return cleanedInput;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(input) || /^\d{4}-\d{2}$/.test(input)) {
      return input.replace(/-/g, '');
    }
  }

  return '';
}

// 원하는 구분자로 'YYYY{sep}MM{sep}DD' 형식으로 반환
export function formatYmd(input, sep = '-') {
  const ymd = normalizeYmd(input);
  if (!ymd) {
    return '';
  }

  const length = ymd.length;

  if (length === 8) {
    const y = ymd.slice(0, 4);
    const m = ymd.slice(4, 6);
    const d = ymd.slice(6, 8);
    return sep === '' ? `${y}${m}${d}` : `${y}${sep}${m}${sep}${d}`;
  } else if (length === 6) {
    const y = ymd.slice(0, 4);
    const m = ymd.slice(4, 6);
    return sep === '' ? `${y}${m}` : `${y}${sep}${m}`;
  } else {
    return '';
  }
}

// 별칭: 구분자 없는 YYYYMMDD
export const toYmdCompact = (input) => formatYmd(input, '');

// 오늘날짜
export function getTodayYmd() {
  const now = new Date();
  const y = now.getFullYear();
  const m = pad2(now.getMonth() + 1);
  const d = pad2(now.getDate());
  return `${y}-${m}-${d}`;
}

export function getTodayYm() {
  const now = new Date();
  const y = now.getFullYear();
  const m = pad2(now.getMonth() + 1);
  return `${y}-${m}`;
}

// 이전 달의 시작일
export function getPrevMonthStartDay() {
  const now = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const y = prevMonth.getFullYear();
  const m = pad2(prevMonth.getMonth() + 1);
  const d = pad2(prevMonth.getDate());
  return `${y}-${m}-${d}`;
}

// 이전 달의 마지막일
export function getPrevMonthEndDay() {
  const now = new Date();
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const y = prevMonthEnd.getFullYear();
  const m = pad2(prevMonthEnd.getMonth() + 1);
  const d = pad2(prevMonthEnd.getDate());
  return `${y}-${m}-${d}`;
}

// format 로그 확인용
export function logFormData(fd) {
  if (!import.meta.env.DEV) return;
  const rows = [];
  fd.forEach((v, k) => {
    rows.push(
      v instanceof File
        ? { key: k, value: `${v.name} (${v.type}, ${v.size}B)` }
        : { key: k, value: v },
    );
  });
  console.table(rows);
}

/** 한국 전화번호 포맷터
 * 지원:
 * - 서울(02): 02-XXX-XXXX 또는 02-XXXX-XXXX
 * - 휴대폰/일반(0XX): 0XX-XXX-XXXX 또는 0XX-XXXX-XXXX
 * - 기타(기본): 자릿수에 따라 자동 분기
 * - 1588/1688/1877 같은 특번은 필요 시 별도 처리
 */
export function formatPhoneKR(v) {
  const d = (v || '').replace(/\D/g, '').slice(0, 11); // 숫자만, 최대 11자리(010 기준)

  // 1588/1688/1877 등 특번 4-4 (원하면 주석 해제)
  // if (/^(15|16|18)\d{2}/.test(d)) {
  //   if (d.length <= 4) return d
  //   return `${d.slice(0, 4)}-${d.slice(4, 8)}`
  // }

  // 서울 02
  if (d.startsWith('02')) {
    if (d.length <= 2) return d;
    if (d.length <= 5) return `${d.slice(0, 2)}-${d.slice(2)}`;
    if (d.length <= 9) return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`;
    return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6, 10)}`;
  }

    // 10으로 시작하는 비표준 번호 (ex: 10-2323-2323)
  if (d.startsWith('10') && d.length > 2) {
    if (d.length <= 6) return `${d.slice(0, 2)}-${d.slice(2)}`;
    if (d.length <= 10) return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6)}`;
    return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6, 10)}`;
  }

  // 휴대폰/일반(0XX)
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  if (d.length <= 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`;
}

// 한국 전화번호 검증 패턴 (02/0xx 일반 케이스)
export const PHONE_KR_PATTERN =
  '^(?:\\d{2}-\\d{3}-\\d{4}|\\d{2}-\\d{4}-\\d{4}|\\d{3}-\\d{3}-\\d{4}|\\d{3}-\\d{4}-\\d{4})$';

export function formatMoney(amount) {
  if (isNaN(amount)) return '0';
  return amount.toLocaleString('ko-KR');
}

// 특수문자 → 정규식 리터럴용 이스케이프
export const escapeRx = (s = '') => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// 비밀번호 확인 패턴(완전 일치)
export const buildEqualPattern = (value) => `^${escapeRx(value ?? '')}$`;

// 서버 전송용: 숫자만 추출
export const onlyDigits = (s = '') => String(s).replace(/\D/g, '');

// Datepicker 공통 설정
export const datepickerFixed = {
  autoApply: true,
  enableTime: false,
  enableTimePicker: false,
  format: 'yyyy-MM-dd',
  modelType: 'yyyy-MM-dd',
  clearable: true,
  ui: { input: 'form-control' },
};

// 마스킹 헬퍼: 마지막 4자리를 '*'로 대체
export function maskLast4(str) {
  if (str == null) return str; // null 또는 undefined는 그대로
  const s = String(str);
  return s.slice(0, -4) + '****';
}

// 유효성 값 체크
export function isValidateEmpty(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

// 두 값이 깊게 같은지 비교하는 함수 (lodash.isEqual 대체)
export function isEqual(a, b) {
  if (a === b) return true;
  // null 또는 undefined 체크
  if (a == null || b == null) return a === b;
  // 타입이 다르면 false
  if (typeof a !== typeof b) return false;
  // 원시 타입 비교
  if (typeof a !== 'object') {
    // NaN 체크
    if (Number.isNaN(a) && Number.isNaN(b)) return true;
    return a === b;
  }
  // Date 객체 비교
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }
  // 배열 비교
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!isEqual(a[i], b[i])) return false;
    }
    return true;
  }
  // 배열과 객체는 다름
  if (Array.isArray(a) || Array.isArray(b)) return false;
  // 객체 비교
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!isEqual(a[key], b[key])) return false;
  }
  return true;
}
