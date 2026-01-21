<script setup>
const props = defineProps({
  modelValue: { type: String, default: '' },
  autoFocus: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue', 'submit', 'cancel']);

function onInput(e) {
  emit('update:modelValue', e?.target?.value ?? '');
}
function onSubmit() {
  emit('submit');
}
function onCancel() {
  emit('cancel');
}
</script>

<template>
  <CRow class="g-2 align-items-start">
    <CCol>
      <CFormTextarea
        rows="2"
        :value="modelValue"
        placeholder="댓글을 입력하세요"
        @input="onInput"
      />
    </CCol>
    <CCol sm="auto" class="d-flex gap-2">
      <CButton color="primary" size="sm" @click="onSubmit">등록</CButton>
      <CButton color="secondary" size="sm" variant="outline" @click="onCancel">취소</CButton>
    </CCol>
  </CRow>
</template>
