/**
 * 추가 필터 유틸리티
 * - extra는 { name: ref } 형태만 허용합니다.
 * - queryKey는 name과 동일하게 사용됩니다.
 * - default는 ref.value의 현재값(없으면 '')
 * - serialize는 String, parse는 문자열 그대로(값이 없으면 default로 복원)
 *
 * 사용 예:
 *   const chart = ref('');
 *   const type = ref('');
 *   const _extra = normalizeExtra({ chart, type });
 */
export function normalizeExtra(defs = {}) {
  const toStr = (x) => (x == null ? '' : String(x));
  const parseStr = (v, d) => (typeof v === 'string' ? v : d);

  const out = {};
  for (const [name, refObj] of Object.entries(defs)) {
    // 축약형: ref만 넘긴 경우 (반드시 { value: ... } 형태)
    if (refObj && typeof refObj === 'object' && 'value' in refObj) {
      const fallback = refObj.value ?? '';
      out[name] = {
        ref: refObj,
        queryKey: name,
        default: fallback,
        serialize: toStr,
        parse: (v) => parseStr(v, fallback),
      };
      continue;
    }
  }
  return out;
}
