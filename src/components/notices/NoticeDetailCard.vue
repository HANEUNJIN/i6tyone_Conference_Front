<script setup>
import { computed } from 'vue';
import { cilPaperclip } from '@coreui/icons';
import 'ckeditor5/ckeditor5-content.css';

import UiLoading from '@/components/ui/UiLoading';
import { formatBytes } from '@/utils/common';
import { useAuthStore } from '@/stores/auth';

const props = defineProps({
  detail: { type: Object, default: null },
  files: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: [String, null], default: null },
  fileLoading: { type: Boolean, default: false },
  fileError: { type: [String, null], default: null },
  showBack: { type: Boolean, default: true },
  showEdit: { type: Boolean, default: false },
  showDelete: { type: Boolean, default: false },
});

const emit = defineEmits(['back', 'edit', 'delete', 'download']);

const auth = useAuthStore();

const hasDetail = computed(() => !!props.detail);
const metaText = computed(() => {
  if (!props.detail) return '';
  const reg = props.detail.regDt ?? '';
  const cnt = props.detail.readCnt ?? '';
  return `${reg ? '작성일: ' + reg : ''}   ${cnt ? ' · 조회수: ' + cnt : ''}`;
});
</script>

<template>
  <CCard class="flex-grow-1">
    <CCardHeader>
      <h6 class="mb-0">
        <slot name="header-left"> 상세 정보 </slot>
      </h6>
    </CCardHeader>

    <CCardBody>
      <!-- 로딩 -->
      <UiLoading v-if="loading" />
      <CAlert color="danger" v-else-if="error">{{ error }}</CAlert>

      <template v-else-if="hasDetail">
        <div class="d-flex justify-content-between gap-3">
          <div>
            <h5 class="mb-0">{{ detail.subject }}</h5>
            <h6 v-if="detail.subtitle" class="mt-2 text-muted">{{ detail.subtitle }}</h6>
          </div>
          <div class="flex-nowrap text-muted mt-1">
            <p class="mb-0" style="white-space: nowrap">{{ metaText }}</p>
          </div>
        </div>

        <div class="text-muted" :class="{ 'mt-2': $slots.meta || detail.inputType === 'S' }">
          <p v-if="detail.inputType === 'S'" class="mb-0">
            <strong>공지 대리점</strong> : {{ detail.branchArr }}
          </p>
          <slot name="meta" />
        </div>

        <hr />
        <div v-if="detail.contents" v-html="detail.contents" class="ck-content" />
        <div v-else>내용 없음</div>
      </template>

      <div v-else>데이터가 없습니다.</div>
    </CCardBody>

    <CCardFooter v-if="files?.length">
      <!-- 첨부 -->
      <div class="file-block">
        <div class="tit">
          <slot name="attachments-title">첨부파일 :</slot>
        </div>

        <div v-if="fileLoading">첨부 불러오는 중...</div>
        <CAlert color="warning" v-else-if="fileError">{{ fileError }}</CAlert>

        <ul class="mb-0">
          <li
            v-for="(f, idx) in files"
            :key="f.fileSeq || idx"
            role="button"
            tabindex="0"
            @click="$emit('download', f)"
          >
            {{ f.oriFileName }}
            <span class="text-muted ms-2">({{ formatBytes(f.fileSize) }})</span>
            <CIcon :icon="cilPaperclip" size="sm" class="me-1" />
          </li>
        </ul>
      </div>
    </CCardFooter>
  </CCard>
  <div class="d-flex gap-2 justify-content-end mt-2">
    <CButton v-if="showBack" color="secondary" @click="$emit('back')">뒤로</CButton>
    <template v-if="auth.userInfo.userId === detail?.userId">
      <CButton v-if="showDelete" color="danger" @click="$emit('delete')">삭제</CButton>
      <CButton v-if="showEdit" color="warning" @click="$emit('edit')">수정</CButton>
    </template>
  </div>
</template>

<style scoped>
.file-block {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.tit {
  font-size: 12px;
  font-weight: bold;
  color: #aaa;
  min-width: 64px;
}
ul {
  margin: 0;
  padding: 0;
  list-style: none;
}
li {
  cursor: pointer;
  font-size: 12px;
}
</style>
