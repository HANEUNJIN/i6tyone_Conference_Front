<script setup>
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { NoticesAPI } from '@/api/notices';
import { useToast } from '@/composables/useToast';
import { useApiToast } from '@/composables/useApiToast';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { ROUTE } from '@/constants/routeName';

import NoticeDetailCard from '@/components/notices/NoticeDetailCard.vue';

const props = defineProps({
  seq: { type: String, required: true },
});

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const toast = useToast();
const toastApi = useApiToast();
const modal = useConfirmModal();

const list = ref(null);
const files = ref([]);
const loading = ref(false);

const fetchList = async () => {
  const seq = props.seq;
  if (!seq) return;

  try {
    loading.value = true;

    const params = {
      seq: props.seq,
      userId: auth.userInfo?.userId ?? '',
    };

    const res = await NoticesAPI.getDetail(params);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return;
    }

    list.value = res.data?.resultData ?? null;

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

const handleBack = () => {
  router.push({
    name: ROUTE.NixNotices.Etc.List,
    query: route.query,
  });
};

const handleEdit = () => {
  router.push({
    name: ROUTE.NixNotices.Etc.Modify,
    query: { ...route.query, seq: String(props.seq) },
  });
};

const handleDelete = async () => {
  const ok = await modal.show({
    title: '삭제',
    message: '삭제 하시겠습니까?',
    confirmText: '삭제',
  });

  if (!ok) return;

  try {
    const params = { seq: props.seq };
    const res = await NoticesAPI.delete(params);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return;
    }

    toast.success('삭제되었습니다.');
    handleBack();
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

watch(
  () => props.seq,
  async () => {
    if (!props.seq) return;

    await fetchList();
  },
  { immediate: true },
);
</script>

<template>
  <NoticeDetailCard
    :detail="list"
    :files="files"
    :loading="loading"
    :show-back="true"
    :show-edit="true"
    :show-delete="true"
    @back="handleBack"
    @edit="handleEdit"
    @delete="handleDelete"
  />
</template>
