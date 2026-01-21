<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import NoticeCreateCard from '@/components/notices/NoticeCreateCard.vue';
import { logFormData } from '@/utils/common';
import { useAuthStore } from '@/stores/auth';
import { NoticesAPI } from '@/api/notices';
import { useToast } from '@/composables/useToast';
import { useApiToast } from '@/composables/useApiToast';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { ROUTE } from '@/constants/routeName';
import { NixBoardType } from '@/constants';

const props = defineProps({
  seq: { type: String, required: true },
});

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const toast = useToast();
const toastApi = useApiToast();
const modal = useConfirmModal();
const loading = ref(false);

const inputForm = reactive({
  subject: '',
  inputType: '',
  contents: '',
});

const files = ref([]);
const isDisabled = ref(false);
const labels = { type: '구분', submit: '수정' };

const getDetailList = async () => {
  const seq = props.seq;
  if (!seq) return;

  try {
    loading.value = true;

    const params = {
      seq: seq,
      userId: auth.userInfo?.userId ?? '',
    };

    const res = await NoticesAPI.getDetail(params);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return;
    }

    inputForm.subject = res.data.resultData.subject;
    inputForm.inputType = res.data.resultData.inputType;
    inputForm.contents = res.data.resultData.contents;

    const fileParams = { seq: props.seq };

    const resFiles = await NoticesAPI.getListFiles(fileParams);
    if (resFiles.ok) {
      files.value = resFiles.data?.resultData?.list ?? [];
    } else {
      toastApi.errorFromResult(resFiles, '첨부파일 조회 실패');
    }
  } catch (e) {
    toastApi.errorFromException(e);
  } finally {
    loading.value = false;
  }
};

const handleEdit = async () => {
  const errorMsg = validationCheck(inputForm);
  if (errorMsg) return toast.error(errorMsg);

  const confirm = await modal.show({
    title: '저장',
    message: '수정 내용을 저장하시겠습니까?',
    confirmText: '저장',
  });

  if (!confirm) return;

  try {
    isDisabled.value = true;

    const params = makeParams();
    const formData = createFormData(params);
    logFormData(formData);

    const res = await NoticesAPI.putModify(formData);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return;
    }

    toast.success('수정되었습니다.');
    reflash();
  } catch (e) {
    toastApi.errorFromException(e);
  } finally {
    isDisabled.value = false;
  }
};

const handleTempSave = async () => {
  const errorMsg = validationCheck(inputForm);
  if (errorMsg) return toast.error(errorMsg);

  const confirm = await modal.show({
    title: '임시저장',
    message: `첨부파일은 임시저장에서 제외 됩니다.\n임시저장은 공지사항의 각 메뉴별로 따로 저장하게 됩니다. 저장하시겠습니까?`,
    confirmText: '저장',
  });

  if (!confirm) return;

  try {
    const params = makeParams();
    const formData = createFormData(params, { includeFiles: false });
    logFormData(formData);

    const res = await NoticesAPI.postSaveDraft(formData);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return;
    }

    toast.success('임시 저장되었습니다.');
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

const validationCheck = (inputForm) => {
  if (inputForm.subject.length === 0) return '제목을 입력하세요.';
  else if (inputForm.contents.length === 0) return '내용을 입력하세요.';
};

const makeParams = () => {
  return {
    inputType: (inputForm.inputType || '').trim(),
    boardType: NixBoardType.TipAndEtc,
    subject: (inputForm.subject || '').trim(),
    contents: inputForm.contents || '',
    userId: auth?.userInfo?.userId ?? '',
    branchArray: inputForm.branchArray || [],
    files: Array.isArray(files.value) ? files.value : [],
  };
};

const createFormData = (p, { includeFiles = true } = {}) => {
  const fd = new FormData();
  if (includeFiles) {
    for (const file of p.files) {
      if (file) fd.append('upload', file);
    }
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
};

const handleTempRestore = async () => {
  const confirm = await modal.show({
    title: '임시저장 불러오기',
    message: '마지막 임시저장한 내용을 불러 오겠습니까?',
    confirmText: '불러오기',
  });

  if (!confirm) return;

  try {
    const params = {
      userId: auth?.userInfo?.userId,
      boardType: NixBoardType.TipAndEtc,
    };

    const res = await NoticesAPI.getLoadDraft(params);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return;
    }

    const subject = res.data?.resultData?.subject;
    const contents = res.data?.resultData?.contents;
    if (subject != null || contents != null) {
      inputForm.subject = subject ?? '';
      inputForm.contents = contents ?? '';
      toast.success('임시저장 데이터를 불러왔습니다.');
    } else {
      toast.info('임시 저장한 데이터가 없습니다.');
    }
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

const reflash = () => {
  router.push({
    name: ROUTE.NixNotices.Etc.List,
    query: route.query,
  });
};

const handleBack = () => {
  router.back();
};

onMounted(() => {
  getDetailList();
});
</script>

<template>
  <NoticeCreateCard
    v-model="inputForm"
    v-model:files="files"
    :board-options="NixBoardType.TipAndEtc"
    :disabled="isDisabled"
    :labels="labels"
    @submit="handleEdit"
    @save-draft="handleTempSave"
    @load-draft="handleTempRestore"
    @cancel="handleBack"
  />
</template>
