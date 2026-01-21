<script setup>
import { CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CButton } from '@coreui/vue';

const props = defineProps({
  visible: { type: Boolean, default: false }, // 노출여부
  title: { type: String, default: '제목' }, // 헤더 제목
  cancelText: { type: String, default: '취소' }, // 닫기 버튼 텍스트
  confirmText: { type: String, default: '확인' }, // 컨펌 버튼 텍스트
  // 컨펌 버튼 칼라
  confirmTextColor: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'success', 'danger', 'warning', 'secondary'].includes(v),
  },
  // 모달 사이즈
  size: { type: String, default: 'lg', validator: (v) => ['sm', 'md', 'lg', 'xl'].includes(v) },
  backdrop: { type: Boolean, default: true },
  keyboard: { type: Boolean, default: true },
  isCancelBtn: { type: Boolean, default: true }, // 닫기 버튼 노출 여부
  isConfirmBtn: { type: Boolean, default: true }, // 컨펌 버튼 노출 여부
  isHeaderCloseBtn: { type: Boolean, default: false }, // 헤더 닫기 버튼 노출 여부
});

const emit = defineEmits(['confirm', 'cancel', 'update:visible']);

// 컨펌
const handleConfirm = () => {
  emit('confirm');
  // emit('update:visible', false);
};

// 닫기
const handleCancel = () => {
  emit('cancel');
  emit('update:visible', false);
};
</script>

<template>
  <CModal
    :visible="visible"
    :backdrop="backdrop"
    :keyboard="keyboard"
    :size="size"
    alignment="center"
    @close="handleCancel()"
    class="test"
  >
    <CModalHeader :close-button="isHeaderCloseBtn">
      <slot name="header">
        <CModalTitle class="fw-bold">
          {{ title }}
        </CModalTitle>
      </slot>
    </CModalHeader>

    <CModalBody>
      <slot name="body"><!-- 상위 컴포넌트에서 정의할 영역 --></slot>
    </CModalBody>

    <CModalFooter>
      <CButton color="secondary" variant="outline" @click="handleCancel()" v-if="isCancelBtn">
        {{ cancelText }}
      </CButton>
      <CButton :color="confirmTextColor" @click="handleConfirm()" v-if="isConfirmBtn">
        {{ confirmText }}
      </CButton>
    </CModalFooter>
  </CModal>
</template>

<style>
.modal-title {
  font-size: 1rem;
}
</style>
