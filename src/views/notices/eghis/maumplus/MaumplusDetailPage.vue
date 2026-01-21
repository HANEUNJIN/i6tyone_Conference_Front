<script setup>
import { ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { NoticesAPI } from '@/api/notices';
import { useToast } from '@/composables/useToast';
import { useApiToast } from '@/composables/useApiToast';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { ROUTE } from '@/constants/routeName';

import NoticeDetailCard from '@/components/notices/NoticeDetailCard.vue';

const props = defineProps({
  seq: { type: String, required: true }, // 라우터 props에서 전달됨
});

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const toast = useToast();
const toastApi = useApiToast();
const modal = useConfirmModal();

const detail = ref(null);
const loading = ref(false); // 상세 본문용 로딩 (스피너)
const isDeleting = ref(false); // 삭제 시

const files = ref([]); // 첨부 리스트

// 공지 상세(게시글 정보)
async function fetchDetail() {
  if (!props.seq) return;
  try {
    loading.value = true;
    const res = await NoticesAPI.getDetail({
      seq: props.seq,
      userId: auth.userInfo?.userId ?? '',
    });
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return;
    }
    detail.value = res.data?.resultData ?? null;

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

// 파일 다운로드
async function downloadFile(file) {
  if (!file?.seq || !file?.fileSeq) return;
  try {
    const res = await NoticesAPI.getDownloadFile({
      seq: file.seq,
      fileSeq: file.fileSeq,
    });
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return;
    }

    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.oriFileName || 'download';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
}

// 삭제하기
async function handleDelete() {
  const ok = await modal.show({
    title: '삭제',
    message: '삭제 하시겠습니까?',
    confirmText: '삭제',
  });
  if (!ok) return;

  try {
    isDeleting.value = true;
    const res = await NoticesAPI.delete({
      seq: props.seq,
    });
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return;
    }

    toast.success('삭제되었습니다.');
    goBackToList();
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  } finally {
    isDeleting.value = false;
  }
}

// 뒤로가기
function goBackToList() {
  router.push({ name: ROUTE.Notices.Maumplus.List, query: route.query }); // 목록 쿼리 유지 복귀
}

// 수정하기
function handleModify() {
  router.push({
    name: ROUTE.Notices.Maumplus.Modify,
    query: { ...route.query, seq: String(props.seq) },
  });
}

watch(
  () => props.seq,
  async () => {
    if (!props.seq) return;

    await fetchDetail();
  },
  { immediate: true },
);
</script>

<template>
  <NoticeDetailCard
    :detail="detail"
    :files="files"
    :loading="loading"
    :show-back="true"
    :show-edit="true"
    :show-delete="true"
    @back="goBackToList"
    @edit="handleModify"
    @delete="handleDelete"
    @download="downloadFile"
  />
</template>
