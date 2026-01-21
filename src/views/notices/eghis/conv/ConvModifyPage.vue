<script setup>
import { ref, reactive, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import NoticeCreateCard from '@/components/notices/NoticeCreateCard.vue';
import { logFormData } from '@/utils/common';
import { useAuthStore } from '@/stores/auth';
import { NoticesAPI } from '@/api/notices';
import { useToast } from '@/composables/useToast';
import { useApiToast } from '@/composables/useApiToast';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { BoardType } from '@/constants/boardTypes';

const props = defineProps({
  seq: { type: String, required: true }, // 라우터 props에서 전달됨
});

const router = useRouter();
const auth = useAuthStore();
const toast = useToast();
const toastApi = useApiToast();
const modal = useConfirmModal();

const form = reactive({
  subject: '', // 공지 제목
  contents: '', // v-model로 바인딩
});
const files = ref([]); // 첨부파일 v-model 대상
const isSubmitting = ref(false); //중복 제출 방지용
const loading = ref(false); // 로딩 (스피너)

const BOARD_OPTIONS = {
  boardType: BoardType.Conv,
  modify: true,
};

function validateForm(f) {
  if (!f.subject?.trim()) return '제목을 입력하세요.';
  if (!f.contents?.trim()) return '내용을 입력하세요.';
  return '';
}

// 공지 상세(게시글 정보)
async function fetchDetail() {
  if (!props.seq) return;
  try {
    loading.value = true;
    // 상세 정보
    const res = await NoticesAPI.getDetail({
      seq: props.seq,
      userId: auth.userInfo?.userId ?? '',
    });
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return;
    }
    form.subject = res.data.resultData.subject;
    form.contents = res.data.resultData.contents;

    // 첨부파일 조회
    const filesRes = await NoticesAPI.getListFiles({ seq: props.seq });
    if (filesRes.ok) {
      files.value = filesRes.data?.resultData?.list ?? [];
    } else {
      toastApi.errorFromResult(filesRes, '첨부파일 조회 실패');
      return;
    }
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  } finally {
    loading.value = false;
  }
}

function buildParams() {
  return {
    subject: (form.subject || '').trim(),
    contents: form.contents || '',
    userId: auth?.userInfo?.userId ?? '',
    boardType: BOARD_OPTIONS.boardType,
    files: Array.isArray(files.value) ? files.value : [],
  };
}

function createFormData(p) {
  const fd = new FormData();
  // 파일(여러개면 같은 키로 반복 append)
  for (const file of p.files) {
    if (file) fd.append('upload', file);
  }
  const append = (k, v) => fd.append(k, v ?? '');
  append('Seq', props.seq);
  append('InputType', p.inputType);
  append('BoardType', p.boardType);
  append('Subject', p.subject);
  append('Contents', p.contents);
  append('UserId', p.userId);
  append('BranchArray', p.branchArray);
  return fd;
}

// 등록
async function handleSubmit() {
  if (isSubmitting.value) return; // 연속 클릭 방지
  const msg = validateForm(form);
  if (msg) return toast.error(msg);
  const confirm = await modal.show({
    title: '저장',
    message: '수정 내용을 저장하시겠습니까?',
    confirmText: '저장',
  });
  if (!confirm) return;

  try {
    isSubmitting.value = true;
    const params = buildParams();
    const formData = createFormData(params);
    logFormData(formData);

    const res = await NoticesAPI.putModify(formData);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return;
    }

    toast.success('수정되었습니다.');
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
    const formData = createFormData(params);
    formData.delete('Seq');
    logFormData(formData);
    const res = await NoticesAPI.postSaveDraft(formData);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return;
    }

    toast.success('저장 되었습니다.');
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
  router.back();
}

watch(
  () => props.seq,
  async () => {
    if (!props.seq) return;
    fetchDetail();
  },
  { immediate: true },
);

onMounted(() => {
  fetchDetail();
});
</script>

<template>
  <NoticeCreateCard
    v-model="form"
    v-model:files="files"
    :board-options="BOARD_OPTIONS"
    :show-subtitle="false"
    :show-visibility="false"
    :disabled="isSubmitting || loading"
    :loading="isSubmitting || loading"
    :labels="{ submit: '수정' }"
    @submit="handleSubmit"
    @cancel="handleBack"
    @save-draft="saveDraft"
    @load-draft="loadDraft"
  />
</template>
