<script setup>
import { watch } from 'vue';
import { cilCloudUpload } from '@coreui/icons';
import useFileAttachments from '@/composables/useFileAttachments';
import { formatBytes } from '@/utils/common';

const props = defineProps({
  modelValue: { type: Array, default: () => [] }, // v-model: File[]
  accept: { type: [Array, String], default: () => ['image/*', 'application/pdf'] },
  maxCount: { type: Number, default: 10 },
  maxSize: { type: Number, default: 25 * 1024 * 1024 },
  dedupe: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
  showPreview: { type: Boolean, default: true },
  listStyle: { type: String, default: 'list' }, // 'list' | 'grid' (확장 여지)
  helperText: { type: String, default: '최대 10개, 25MB/개 · 허용: 이미지/PDF' },
});

const emit = defineEmits(['update:modelValue', 'preview', 'remove', 'error']);

// 파일 선택/제거
const {
  files,
  dz,
  fileInput,
  acceptAttr,
  onFilesPicked,
  handleDrop,
  openPicker,
  removeFile: _removeFile,
  previewFile,
  getPreview,
} = useFileAttachments({
  accept: Array.isArray(props.accept) ? props.accept : [props.accept],
  maxCount: props.maxCount,
  maxSize: props.maxSize,
  dedupe: props.dedupe,
});

// v-model 동기화: 내부 변경 → 부모에 반영
watch(files, () => emit('update:modelValue', files.value), { deep: true });

// 부모에서 외부적으로 배열을 교체했을 때(리셋 등) 내부도 맞춰줌
watch(
  () => props.modelValue,
  (nv) => {
    console.log(nv);
    // 파일 참조가 다르면 교체
    if (nv !== files.value) {
      files.value = Array.isArray(nv) ? [...nv] : [];
      console.log(files);
    }
  },
  { immediate: true },
);

function onRemove(i) {
  const f = files.value[i];
  _removeFile(i);
  emit('remove', f);
}

function onPreview(f) {
  previewFile(f); // 새 탭으로 열기
  emit('preview', f); // 부모에게 이벤트도 알림(선택 처리)
}

// 이미지 판단: type 또는 fileUri 확장자 기준
function isImageFile(f) {
  if (f?.type?.startsWith?.('image/')) return true;
  const uri = f?.fileUri || '';
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(uri);
}
</script>

<template>
  <div class="ui-attachments">
    <!-- Dropzone -->
    <div
      v-if="files.length !== maxCount"
      class="dropzone"
      :class="[
        dz.over ? 'border-primary bg-body-tertiary' : 'border-secondary bg-light',
        disabled ? 'disabled' : '',
      ]"
      role="button"
      tabindex="0"
      :aria-disabled="disabled ? 'true' : 'false'"
      @click="!disabled && openPicker()"
      @keydown.enter.prevent="!disabled && openPicker()"
      @keydown.space.prevent="!disabled && openPicker()"
      @dragover.prevent="!disabled && (dz.over = true)"
      @dragleave.prevent="!disabled && (dz.over = false)"
      @drop.prevent="!disabled && handleDrop($event)"
    >
      <div class="mb-2">
        <CIcon :icon="cilCloudUpload" size="xl" class="opacity-75" />
      </div>
      <div class="mb-2">
        파일을 여기로 <b>끌어놓기</b> 또는
        <label class="link-primary fw-semibold ms-1 cursor-pointer">
          파일 선택
          <input
            ref="fileInput"
            type="file"
            class="d-none"
            multiple
            :accept="acceptAttr"
            :disabled="disabled"
            @change="onFilesPicked"
          />
        </label>
      </div>
      <div class="text-muted small">{{ helperText }}</div>
    </div>

    <!-- 파일 리스트 (기본 렌더링) -->
    <CListGroup class="mt-3" v-if="files.length && listStyle === 'list'">
      <CListGroupItem
        v-for="(f, i) in files"
        :key="i"
        class="d-flex align-items-center justify-content-between"
      >
        <div class="d-flex align-items-center gap-2">
          <!-- 썸네일 / 아이콘 -->
          <div
            v-if="showPreview && isImageFile(f)"
            class="file-thumb rounded"
            :style="{ backgroundImage: `url(${getPreview(f)})` }"
          />
          <div v-else class="file-icon text-secondary">
            <CIcon name="cil-file" />
          </div>

          <div>
            <div class="fw-semibold text-truncate file-name">{{ f.name || f.oriFileName }}</div>
            <div class="text-muted small">
              {{ formatBytes(f.size || f.fileSize) }}
            </div>
          </div>
        </div>

        <div class="d-flex align-items-center gap-2">
          <CButton
            v-if="showPreview && isImageFile(f)"
            color="link"
            size="sm"
            :disabled="disabled"
            @click="onPreview(f)"
          >
            미리보기
          </CButton>
          <CButton
            color="danger"
            variant="ghost"
            size="sm"
            :disabled="disabled"
            @click="onRemove(i)"
          >
            삭제
          </CButton>
        </div>
      </CListGroupItem>
    </CListGroup>
  </div>
</template>

<style scoped>
.dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background-color: #f8fafc;
  border: 2px solid #64748b;
  border-radius: var(--cui-border-radius-lg);
  text-align: center;
  cursor: pointer;
}
.dropzone.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.file-thumb {
  width: 40px;
  height: 40px;
  background-size: cover;
  background-position: center;
  border: 1px solid rgba(0, 0, 0, 0.08);
}
.file-icon {
  width: 40px;
  text-align: center;
}
.file-name {
  max-width: 36vw;
}
</style>
