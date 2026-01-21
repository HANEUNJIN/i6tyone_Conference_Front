<script setup>
import { computed, onMounted, watch, ref } from 'vue';
import Datepicker from '@vuepic/vue-datepicker';
import UiAttachments from '@/components/ui/UiAttachments.vue';
import UiLoading from '@/components/ui/UiLoading';
// CKEditor
import DecoupledEditor from '@ckeditor/ckeditor5-build-decoupled-document';
import EditConfig from '@/utils/editor';
import { CommonAPI } from '@/api/temp/common';
import { useBaseStore } from '@/stores/base';
import { useApiToast } from '@/composables/useApiToast';
import { datepickerFixed } from '@/utils/common';

const props = defineProps({
  typeOptions: { type: Array, default: () => [] }, // 공지 타입 옵션 : [{ codeId:'A', codeNm:'전체' }, ...]
  boardOptions: { type: Object, default: null },
  showSubtitle: { type: Boolean, default: false },
  showVisibility: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  labels: { type: Object },
});

/** 폼 v-model: { subject, subTitle, inputType, viewYn, viewYnDt, contents } */
const form = defineModel({ type: Object, required: true }); // v-model
const filesProxy = defineModel('files', { type: Array, default: () => [] }); // v-model:files

// 컴포넌트 내부 기본 라벨
const defaultLabels = {
  title: '제목',
  subTitle: '서브제목',
  type: '공지 타입',
  visibility: '노출여부',
  visibilityDate: '노출날짜',
  content: '내용',
  attachments: '첨부파일',
  submit: '등록',
  saveDraft: '임시저장',
  loadDraft: '임시저장 불러오기',
};

const labels = computed(() => ({
  ...defaultLabels,
  ...(props.labels || {}),
}));

const base = useBaseStore();
const toastApi = useApiToast();
const BRANCH_OPTIONS = ref([]);

const emit = defineEmits(['submit', 'cancel', 'save-draft', 'load-draft']);

// CKEditor
const editor = DecoupledEditor;
const editorConfig = EditConfig(props.boardOptions?.boardType ?? '');

// Decoupled 툴바 상단 삽입
function onReady(editorInstance) {
  const editable = editorInstance.ui.getEditableElement();
  if (!editable) return;
  const toolbarEl = editorInstance.ui.view.toolbar.element;
  editable.parentElement.insertBefore(toolbarEl, editable);
}

// 첫 번째 옵션을 기본 선택으로 보장
function ensureDefaultInputType() {
  // viewYn 기본값 보정: 비어있으면 'Y'
  if (
    props.showVisibility &&
    form.value &&
    (form.value.viewYn == null || form.value.viewYn === '')
  ) {
    form.value.viewYn = 'Y';
  }

  // 이미 값이 있고, 옵션 중에 존재하면 유지
  const curr = form.value?.inputType ?? '';
  const exists = Array.isArray(props.typeOptions)
    ? props.typeOptions.some((o) => o?.codeId === curr)
    : false;

  if (!exists) {
    const first =
      Array.isArray(props.typeOptions) && props.typeOptions.length > 0
        ? (props.typeOptions[0]?.codeId ?? '')
        : '';
    form.value.inputType = first;
  }
}

// 공지선택 배열 초기화 보조: form.branchType이 없으면 배열로
function ensureBranchArray() {
  if (!Array.isArray(form.value.branchArray)) {
    form.value.branchArray = [];
  }
}

// 대리점 목록
async function getCommonBranch() {
  try {
    const res = await CommonAPI.getBranch(base.storeMenuType);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return;
    }

    const list = res.data?.resultData?.list ?? [];
    const options = list.map((it) => ({
      codeId: it.codeId ?? '',
      codeNm: it.codeNm ?? '',
    }));

    BRANCH_OPTIONS.value = options;
  } catch (e) {
    console.error(e);
    toast.error(e?.message || '정보를 불러오지 못했습니다.');
  }
}

onMounted(() => {
  getCommonBranch();
  ensureDefaultInputType();
  ensureBranchArray();
});

// 타입 변경 시: S가 아니면 선택값 비움
watch(
  () => form.value?.inputType,
  (val) => {
    if (val !== 'S') {
      form.value.branchArray = [];
    } else {
      ensureBranchArray();
    }
  },
);

watch(
  () => props.typeOptions,
  () => ensureDefaultInputType(),
  { immediate: false, deep: false },
);
</script>

<template>
  <CCard class="flex-grow-1">
    <CCardHeader class="d-flex justify-content-between align-items-center">
      <h6 class="mb-0">{{ props.boardOptions.modify ? '수정' : '등록' }}</h6>
    </CCardHeader>

    <CCardBody>
      <!-- 로딩 -->
      <UiLoading v-if="loading" />

      <CForm :disabled="disabled">
        <!-- 제목 + 타입 -->
        <CRow class="mb-3">
          <CCol class="flex-grow-1">
            <CFormLabel>{{ labels.title }} <span class="text-danger">*</span></CFormLabel>
            <CFormInput
              v-model="form.subject"
              :disabled="disabled"
              placeholder="제목을 입력하세요"
            />
          </CCol>
          <CCol md="4" v-if="typeOptions?.length">
            <CFormLabel>{{ labels.type }}</CFormLabel>
            <CFormSelect v-model="form.inputType" :disabled="disabled">
              <option v-for="(opt, idx) in typeOptions" :key="idx" :value="opt.codeId">
                {{ opt.codeNm }}
              </option>
            </CFormSelect>
          </CCol>
        </CRow>

        <!-- 공지선택 -->
        <CRow class="mb-3" v-if="form.inputType === 'S'">
          <CCol md="12">
            <CFormLabel>공지선택</CFormLabel>
            <div class="d-flex flex-wrap">
              <CFormCheck
                class="checkbox"
                v-for="(opt, idx) in BRANCH_OPTIONS"
                :key="opt.codeId || idx"
                v-model="form.branchArray"
                :id="opt.codeId"
                :value="opt.codeId"
                :label="opt.codeNm"
              />
            </div>
          </CCol>
        </CRow>

        <!-- 서브제목 (옵션) -->
        <CRow class="mb-3" v-if="showSubtitle">
          <CCol md="12">
            <CFormLabel>{{ labels.subTitle }}</CFormLabel>
            <CFormInput
              v-model="form.subtitle"
              :disabled="disabled"
              placeholder="서브제목을 입력하세요"
            />
          </CCol>
        </CRow>

        <!-- 노출 (옵션) -->
        <CRow class="mb-3" v-if="props.showVisibility">
          <CCol md="6">
            <CFormLabel>{{ labels.visibility }}</CFormLabel>
            <CFormSelect v-model="form.viewYn" :disabled="disabled">
              <option value="Y">Y</option>
              <option value="N">N</option>
            </CFormSelect>
          </CCol>
          <CCol md="6">
            <CFormLabel>{{ labels.visibilityDate }}</CFormLabel>
            <Datepicker
              v-model="form.viewYnDt"
              v-bind="datepickerFixed"
              locale="ko"
              :disabled="disabled"
              placeholder="노출날짜를 선택하세요"
              :ui="{ input: 'form-control form-control-sm' }"
            />
          </CCol>
        </CRow>

        <!-- 추가 필드용 슬롯(선택) -->
        <slot name="extra-fields" :form="form" />

        <!-- 에디터 (고정 설정) -->
        <div class="mb-3">
          <CFormLabel>{{ labels.content }} <span class="text-danger">*</span></CFormLabel>
          <ckeditor
            :editor="editor"
            v-model="form.contents"
            :config="editorConfig"
            @ready="onReady"
          />
        </div>

        <!-- 에디터 아래 슬롯(선택) -->
        <slot name="after-editor" :form="form" />

        <!-- 첨부파일 -->
        <div class="mb-4">
          <CFormLabel>{{ labels.attachments }}</CFormLabel>
          <UiAttachments
            v-model="filesProxy"
            :accept="[
              'image/*',
              'application/pdf',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'application/msword',
            ]"
            :max-count="10"
            :max-size="25 * 1024 * 1024"
            helper-text="최대 10개, 25MB/개 · 허용: 이미지/pdf/doc/docx"
            :disabled="disabled"
          />
        </div>
      </CForm>
    </CCardBody>
    <CCardFooter class="d-flex gap-2 justify-content-end">
      <CButton
        color="secondary"
        variant="outline"
        size="sm"
        :disabled="disabled"
        @click="$emit('save-draft')"
      >
        {{ labels.saveDraft }}
      </CButton>
      <CButton
        color="primary"
        variant="outline"
        size="sm"
        :disabled="disabled"
        @click="$emit('load-draft')"
      >
        {{ labels.loadDraft }}
      </CButton>
    </CCardFooter>
  </CCard>
  <div class="d-flex gap-2 justify-content-end mt-2">
    <CButton color="secondary" :disabled="disabled" @click="$emit('cancel')"> 뒤로 </CButton>
    <CButton color="primary" :disabled="disabled || loading" @click="$emit('submit')">
      {{ labels.submit }}
    </CButton>
  </div>
</template>

<style scoped>
.checkbox {
  margin-right: 15px;

  min-height: auto;
}
.checkbox > * {
  cursor: pointer;
}
.checkbox > :last-of-type {
  margin-bottom: 0;
}
</style>
