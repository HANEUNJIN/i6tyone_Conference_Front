import { reactive } from 'vue';

const defaults = {
  title: '확인',
  message: '',
  confirmText: '확인',
  cancelText: '취소',
  color: 'primary', // primary | danger | warning | success ...
  size: 'sm', // sm | lg | xl
  alignment: 'center', // 'center면 수직 중앙
  backdrop: true, // backdrop 클릭 허용 여부
  keyboard: true, // ESC 닫기 허용 여부
};

const state = reactive({
  visible: false, // 모달 표시 여부
  opts: { ...defaults }, // 현재 모달 옵션(기본 + 호출 시 options 병합)
  _resolve: null, // Promise resolve 핸들 저장용 (내부용)
});

function open(options = {}) {
  return new Promise((resolve) => {
    state.opts = { ...defaults, ...options };
    state.visible = true;
    state._resolve = resolve;
  });
}

function resolve(result) {
  if (state._resolve) state._resolve(result);
  state._resolve = null;
  state.visible = false;
}

export function useConfirmModal() {
  return {
    show: open, // Promise<boolean>
    confirm: () => resolve(true), // 확인 버튼 누를 때
    cancel: () => resolve(false), // 취소/닫기 버튼 누를 때
    state,
  };
}

export const coreuiModalState = state;
