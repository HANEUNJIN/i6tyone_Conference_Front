<script setup>
import { ref, watch, computed } from 'vue';

const props = defineProps({
  modelValue: { type: String, default: '' }, // v-model
  placeholder: { type: String, default: '검색어를 입력하세요' },
  loading: { type: Boolean, default: false }, // 검색 중 버튼 비활성화용
  showInput: { type: Boolean, default: true },
  showReset: { type: Boolean, default: true },
});
const emit = defineEmits(['update:modelValue', 'submit', 'reset']);

// const keyword = ref(props.modelValue)
// 부모 → 자식
// watch(
//   () => props.modelValue,
//   (v) => (keyword.value = v),
// )
// // 자식 → 부모
// watch(keyword, (v) => emit('update:modelValue', v))

const keyword = computed({
  get: () => props.modelValue, // 부모 → 자식
  set: (v) => emit('update:modelValue', v), // 자식 → 부모
});

function onSubmit(e) {
  e?.preventDefault?.();
  emit('submit');
}
function onReset() {
  emit('reset');
}
</script>

<template>
  <CForm @submit="onSubmit" class="d-flex gap-2 align-items-start">
    <div class="d-flex gap-2 flex-wrap">
      <slot name="extra-front" />
      <CFormInput
        v-if="showInput"
        v-model="keyword"
        :placeholder="placeholder"
        size="sm"
        style="width: 250px"
      />
      <slot name="extra-back" />
    </div>

    <div class="col-auto d-flex gap-1 align-items-center">
      <CButton type="submit" :disabled="loading" size="sm" color="secondary">검색</CButton>
      <CButton
        v-if="showReset"
        color="secondary"
        variant="outline"
        size="sm"
        @click="onReset"
        :disabled="loading"
        >초기화</CButton
      >
      <slot name="extra-btn" />
    </div>
  </CForm>
</template>
