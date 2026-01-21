<script setup>
import { ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ROUTE } from '@/constants/routeName';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';
import { useApiToast } from '@/composables/useApiToast';
import { CustUpdNoticesAPI } from '@/api/notices';

import NoticeDetailCard from '@/components/notices/NoticeDetailCard.vue';

const props = defineProps({
  seq: { type: String, required: true }, // 라우터 props에서 전달됨
  readLogSeq: { type: Number, required: true }, // 라우터 props에서 전달됨
});

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const toast = useToast();
const toastApi = useApiToast();

const detail = ref(null);
const loading = ref(false); // 상세 본문용 로딩 (스피너)

// 상세 정보
async function fetchDetail() {
  if (!props.seq || !props.readLogSeq) return;
  try {
    loading.value = true;
    const res = await CustUpdNoticesAPI.getDetail({
      seq: props.seq,
      readLogSeq: props.readLogSeq,
      userId: auth.userInfo?.userId ?? '',
    });

    if (!res.ok) {
      toastApi.errorFromResult(res);
      return;
    }
    detail.value = res.data?.resultData ?? null;
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  } finally {
    loading.value = false;
  }
}

// 뒤로가기
function goBackToList() {
  router.push({ name: ROUTE.Notices.CustUpd.List, query: route.query }); // 목록 쿼리 유지 복귀
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
  <NoticeDetailCard :detail="detail" :loading="loading" :show-back="true" @back="goBackToList" />
</template>
