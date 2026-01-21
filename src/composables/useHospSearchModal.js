import { reactive } from 'vue';

const modalState = reactive({
  visible: false, // 모달 표시 여부
});

const open = () => {
  modalState.visible = true;
};

const close = () => {
  modalState.visible = false;
};

export const useHospSearchModal = () => {
  return {
    show: open,
    hide: close,
    modalState,
  };
};
