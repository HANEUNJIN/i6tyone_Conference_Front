<script setup>
import { ref, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { useApiToast } from '@/composables/useApiToast';
import { logFormData } from '@/utils/common';
import { useAuthStore } from '@/stores/auth';
import { NoticesAPI } from '@/api/notices';
import { ROUTE } from '@/constants/routeName';
import NoticeCreateCard from '@/components/notices/NoticeCreateCard.vue';
import { NixBoardType } from '@/constants';

// 라우팅/스토어/토스트
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const toastApi = useApiToast();
const toast = useToast();
const modal = useConfirmModal();

// 공지 타입 옵션
const INPUT_TYPE_OPTIONS = [{ codeId: 'B', codeNm: '본사' }];

const BOARD_OPTIONS = { boardType: NixBoardType.Hq };

const form = reactive({
  subject: '', // 공지 제목
  inputType: '', // 공지 타입
  contents: '', // v-model로 바인딩
});
const files = ref([]); // 첨부파일 v-model 대상
const isSubmitting = ref(false); //중복 제출 방지용

function validateForm(f) {
  if (!f.subject?.trim()) return '제목을 입력하세요.';
  if (!f.contents?.trim()) return '내용을 입력하세요.';
  return '';
}

function buildParams() {
  return {
    subject: (form.subject || '').trim(),
    inputType: form.inputType,
    contents: form.contents || '',
    userId: auth?.userInfo?.userId ?? '',
    boardType: BOARD_OPTIONS.boardType,
    branchArray: form.branchArray || [],
    files: Array.isArray(files.value) ? files.value : [],
  };
}

function createFormData(p, { includeFiles = true } = {}) {
  const fd = new FormData();
  // 파일(여러개면 같은 키로 반복 append)
  if (includeFiles) {
    for (const file of p.files) {
      if (file) fd.append('upload', file);
    }
  }
  const append = (k, v) => fd.append(k, v ?? '');
  append('InputType', p.inputType);
  append('BoardType', p.boardType);
  append('Subject', p.subject);
  append('Contents', p.contents);
  append('UserId', p.userId);
  append('BranchArray', p.branchArray);
  return fd;
}

async function handleSubmit() {
  if (isSubmitting.value) return; // 연속 클릭 방지
  const msg = validateForm(form);
  if (msg) return toast.error(msg);

  const confirm = await modal.show({
    title: '등록',
    message: '등록 하시겠습니까?',
    confirmText: '등록',
  });
  if (!confirm) return;

  try {
    isSubmitting.value = true;
    const params = buildParams();
    const formData = createFormData(params);
    logFormData(formData);

    const res = await NoticesAPI.postCreate(formData);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return;
    }

    toast.success('저장되었습니다.');
    handleBack();
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  } finally {
    isSubmitting.value = false;
  }
}

//임시저장
async function saveDraft() {
  const msg = validateForm(form);
  if (msg) return toast.error(msg);
  const confirm = await modal.show({
    title: '임시저장',
    message: `첨부파일은 임시저장에서 제외 됩니다.\n임시저장은 공지사항의 각 메뉴별로 따로 저장하게 됩니다. 저장하시겠습니까?`,
    confirmText: '저장',
  });
  if (!confirm) return;

  try {
    const params = buildParams();
    const formData = createFormData(params, { includeFiles: false }); // ← 첨부 제외
    logFormData(formData);
    const res = await NoticesAPI.postSaveDraft(formData);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return;
    }

    toast.success('임시 저장되었습니다.');
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
}

// 임시저장 불러오기
async function loadDraft() {
  const confirm = await modal.show({
    title: '임시저장 불러오기',
    message: '마지막 임시저장한 내용을 불러 오겠습니까?',
    confirmText: '불러오기',
  });
  if (!confirm) return;

  try {
    const params = {
      userId: auth?.userInfo?.userId,
      boardType: BOARD_OPTIONS.boardType,
    };
    const res = await NoticesAPI.getLoadDraft(params);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return;
    }
    const subject = res.data?.resultData?.subject;
    const contents = res.data?.resultData?.contents;
    if (subject != null || contents != null) {
      form.subject = subject ?? '';
      form.contents = contents ?? '';
      toast.success('임시저장 데이터를 불러왔습니다.');
    } else {
      toast.info('임시 저장한 데이터가 없습니다.');
    }
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
}

function handleBack() {
  router.push({ name: ROUTE.NixNotices.Hq.List, query: route.query });
}
</script>

<template>
  <NoticeCreateCard
    v-model="form"
    v-model:files="files"
    :type-options="INPUT_TYPE_OPTIONS"
    :board-options="BOARD_OPTIONS"
    :show-subtitle="false"
    :show-visibility="false"
    :disabled="isSubmitting"
    @submit="handleSubmit"
    @cancel="handleBack"
    @save-draft="saveDraft"
    @load-draft="loadDraft"
  />
</template>
