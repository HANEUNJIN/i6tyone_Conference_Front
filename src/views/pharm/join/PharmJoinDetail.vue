<script setup>
import UiGridTable from '@/components/ui/UiGridTable.vue';
import UiLoading from '@/components/ui/UiLoading.vue';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApiToast } from '@/composables/useApiToast';
import { useBaseStore } from '@/stores/base';
import { ROUTE } from '@/constants/routeName';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { useToast } from '@/composables/useToast';
import { formatPhoneKR } from '@/utils/common';
import { PharmAPI } from '@/api/temp/pharm';

// ----------------------
// ✨ composable / store
// ----------------------
const route = useRoute();
const router = useRouter();
const toastApi = useApiToast();
const base = useBaseStore();
const modal = useConfirmModal();
const toast = useToast();

// ----------------------
// ✨ reactive state
// ----------------------
const licenseCd = computed(() => route.query.licenseCd || '');

const detailInfo = ref({});
const isLoading = ref(false);
const isDeleting = ref(false);

const memberInfoFields = computed(() => [
  {
    label1: '약국명',
    value1: detailInfo.value.hospNm || '',
    colspan: true,
  },
  {
    label1: '핸드폰',
    value1: formatPhoneKR(detailInfo.value.capTelNo) || '',
    colspan: true,
  },
  {
    label1: '청구프로그램',
    value1: detailInfo.value.etc1 || '',
    colspan: true,
  },
]);

const statusInfoFields = computed(() => [
  {
    label1: '진행상태',
    value1: detailInfo.value.procSetYnNm,
    colspan: true,
  },
  {
    label1: '메모',
    value1: detailInfo.value.memo,
    colspan: true,
  },
]);

const fetchDetail = async () => {
  if (!licenseCd.value)
    return;

  isLoading.value = true;

  const params = { licenseCd: licenseCd.value };

  try {
    const res = await PharmAPI.getDetail(params);
    if (!res.ok)
      return toastApi.errorFromResult(res);

    detailInfo.value = res.data?.resultData ?? {};
  } catch (e) {
    toastApi.errorFromException(e);
  } finally {
    isLoading.value = false;
  }
};

const goBackToList = () => {
  router.push({ name: ROUTE.Pharm.PharmJoin.List, query: route.query });
};

const goModify = () => {
  router.push({
    name: ROUTE.Pharm.PharmJoin.Modify,
    query: { ...route.query, licenseCd: licenseCd.value },
  });
};

const onDelete = async () => {
  const ok = await modal.show({
    title: '삭제',
    message: '삭제 하시겠습니까?',
    confirmText: '삭제',
  });
  if (!ok)
    return;

  try {
    isDeleting.value = true;

    const params = {
      licenseCd: detailInfo.value.licenseCd,
    };

    const res = await PharmAPI.delete(params);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return;
    }

    toast.success('삭제되었습니다.');
    goBackToList();
  } catch (e) {
    toastApi.errorFromException(e);
  } finally {
    isDeleting.value = false;
  }
};

onMounted(() => {
  fetchDetail();
});
</script>

<template>
  <CCard class="mb-3">
    <CCardHeader class="d-flex justify-content-between align-items-center">
      <h6 class="mb-0">회원정보</h6>
    </CCardHeader>
    <CCardBody>
      <div class="loading" v-if="isLoading">
        <UiLoading />
      </div>
      <UiGridTable :fields="memberInfoFields" />
    </CCardBody>
  </CCard>

  <CCard class="mb-3">
    <CCardHeader class="d-flex justify-content-between align-items-center">
      <h6 class="mb-0">상태</h6>
    </CCardHeader>
    <CCardBody>
      <div class="loading" v-if="isLoading">
        <UiLoading />
      </div>
      <UiGridTable :fields="statusInfoFields" />
    </CCardBody>
  </CCard>
  <div class="d-flex justify-content-end gap-2">
    <CButton color="danger" @click="onDelete">삭제</CButton>
    <CButton color="secondary" @click="goBackToList">뒤로</CButton>
    <CButton color="warning" @click="goModify">수정</CButton>
  </div>
</template>

<style scoped>
.loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
}
</style>
