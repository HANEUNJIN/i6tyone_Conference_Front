<script setup>
import { ref } from 'vue';
import { CButton, CFormCheck } from '@coreui/vue';

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  options: { type: Array, default: () => [] },
  size: { type: String, default: 'md' },
  style: { type: Object, default: () => ({}) },
});

const emit = defineEmits(['update:modelValue']);

const open = ref(false);

function toggleDropdown() {
  // open.value = !open.value;
}

// 선택 여부 확인
function isSelected(val) {
  return props.modelValue.includes(val);
}

// 선택/해제
function toggleSelect(val) {
  if (isSelected(val)) {
    removeItem(val);
  } else {
    emit('update:modelValue', [...props.modelValue, val]);
  }
}

// 항목 제거
function removeItem(val) {
  emit(
    'update:modelValue',
    props.modelValue.filter((v) => v !== val),
  );
}

function getLabel(val) {
  const opt = props.options.find((o) => o.key === val);
  return opt ? opt.key : val;
}
</script>

<template>
  <div class="form-select form-select-sm cform-multi-select" :class="size" :style="style">
    <!-- 선택 표시 -->
    <div class="selected-display" @click="toggleDropdown">
      <span v-for="val in modelValue" :key="val" class="selected-item">
        {{ getLabel(val) }}
        <CButton color="light" variant="outline" size="sm" @click.stop="removeItem(val)">x</CButton>
      </span>
      <span v-if="!modelValue.length" class="placeholder">Select...</span>
    </div>

    <!-- 옵션 리스트 -->
    <ul v-if="open" class="options-list">
      <li v-for="opt in options" :key="opt.key">
        <CFormCheck
          :id="'check-' + opt.value"
          :checked="isSelected(opt.value)"
          @change="toggleSelect(opt.value)"
        />
        {{ opt.value }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.cform-multi-select {
  //border: 1px solid #ccc;
  //padding: 4px 8px;
  width: 200px;
  position: relative;
  cursor: pointer;
  //background: var(--cui-gray-100);
  //border-radius: 4px;
  user-select: none;
}

.cform-multi-select.sm {
  width: 120px;
  font-size: 0.85rem;
}

.selected-display {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  min-height: 28px;
}

.selected-item {
  background: #007bff;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  display: flex;
  align-items: center;
}

.selected-item button {
  border: none;
  background: transparent;
  color: white;
  margin-left: 4px;
  cursor: pointer;
}

.placeholder {
  color: #aaa;
}

.options-list {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  border: 1px solid #ccc;
  background: var(--cui-gray-100);
  max-height: 150px;
  overflow-y: auto;
  z-index: 100;
  margin: 0;
  padding: 4px 0;
  list-style: none;
  border-radius: 4px;
}

.options-list li {
  padding: 4px 8px;
}

.options-list li:hover {
  background: #f0f0f0;
}
</style>
