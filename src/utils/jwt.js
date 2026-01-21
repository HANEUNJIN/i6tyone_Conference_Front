// JWT 문자열에서 payload(중간 부분)를 꺼내 JSON 객체로 바꿔주는 함수 (서명 검증은 안 함)
function base64UrlToUtf8(b64url) {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  const bin =
    typeof atob === 'function' ? atob(padded) : Buffer.from(padded, 'base64').toString('binary'); // Node/Vitest 폴백
  const pct = Array.from(bin, (c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
  return decodeURIComponent(pct);
}

export function decodeJwt(token) {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const json = base64UrlToUtf8(payload);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

//그 payload 안의 exp(만료 시각) 를 읽어 지금부터 만료까지 몇 ms 남았는지 계산
export function msUntilExpiry(token) {
  const p = decodeJwt(token);
  if (!p?.exp) return -1; // exp 없으면 즉시 만료 취급(정책)
  const exp = Number(p.exp); // 문자열 exp 방지
  return exp * 1000 - Date.now();
}

// 만료 여유 시간(예: 30초) 감안해서 판단
export const isTokenExpired = (token, skewMs = 0) => msUntilExpiry(token) - skewMs <= 0;

// payload가 없으면 빈 객체
export const getJwtPayload = (token) => decodeJwt(token) || {};
