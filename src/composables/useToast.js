import { reactive } from 'vue'

const state = reactive({ items: [] })
let _id = 0

function pushToast(payload) {
  const key = ++_id
  state.items.push({
    key,
    title: payload.title || '',
    content: payload.content || '',
    color: payload.color || 'info', // success | danger | warning | info | primary ...
    autohide: payload.autohide ?? true, // 자동닫기
    delay: payload.delay ?? 2500,
  })
  return key
}

function removeToast(key) {
  const i = state.items.findIndex((t) => t.key === key)
  if (i > -1) state.items.splice(i, 1)
}

export function useToast() {
  return {
    // 기본 API
    show: (content, opts = {}) => pushToast({ content, ...opts }),
    remove: removeToast,

    // 프리셋
    success: (msg) => pushToast({ title: '성공', content: msg, color: 'success' }),
    error: (msg) => pushToast({ title: '오류', content: msg, color: 'danger' }),
    info: (msg) => pushToast({ title: '알림', content: msg, color: 'info' }),
    warn: (msg) => pushToast({ title: '주의', content: msg, color: 'warning' }),
  }
}

// 레이아웃에서 렌더링할 반응형 상태
export const coreuiToastState = state
