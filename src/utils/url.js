// 내부 유틸: 값이 의미 있을 때만 params에 추가
export function appendIf(qs, key, value) {
  if (value !== undefined && value !== null && String(value).trim() !== '') {
    qs.append(key, value)
  }
}

// 내부 유틸: path + 안전한 쿼리스트링 생성
export function buildUrl(path, params = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => appendIf(qs, k, v))
  const query = qs.toString()
  return query ? `${path}?${query}` : path
}
