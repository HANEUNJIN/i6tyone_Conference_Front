<script setup>
import UiGridTable from '@/components/ui/UiGridTable.vue';
import UiLoading from '@/components/ui/UiLoading.vue';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApiToast } from '@/composables/useApiToast';
import { useBaseStore } from '@/stores/base';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { useToast } from '@/composables/useToast';
import { PharmAPI } from '@/api/temp/pharm';
import { formatMoney } from '@/utils/common';
import { CommonAPI } from '@/api/temp/common';
import { useAuthStore } from '@/stores/auth';
import { ROUTE } from '@/constants';

// ----------------------
// ✨ composable / store
// ----------------------
const route = useRoute();
const router = useRouter();
const toastApi = useApiToast();
const base = useBaseStore();
const modal = useConfirmModal();
const toast = useToast();
const auth = useAuthStore();

// ----------------------
// ✨ reactive state
// ----------------------
const prodId = computed(() => route.query.prodId || '');

const optionsLoading = ref(false);
const isLoading = ref(false);
const isSubmitting = ref(false);
const isDeleting = ref(false);

const detailInfo = ref({});
const prodCdOptions = ref([]);

const memberInfoFields = computed(() => [
  {
    label1: '상품타입',
    value1: detailInfo.value.prodCdNm || '',
    colspan: true,
  },
  {
    label1: '상품명',
    value1: detailInfo.value.prodNm || '',
    colspan: true,
  },
  {
    label1: '상품가격',
    value1: formatMoney(detailInfo.value.prodAmt) || '',
    colspan: true,
  },
  {
    label1: '건수',
    value1: formatMoney(detailInfo.value.maxCnt) || '',
    colspan: true,
  },
  {
    label1: '건당 가격',
    value1: formatMoney(detailInfo.value.unitAmt) || '',
    colspan: true,
  },
  {
    label1: '상태값',
    value1: detailInfo.value.statusYn === 'Y' ? '사용' : '미사용',
    colspan: true,
  },
]);

const fetchSearchOptions = async () => {
  optionsLoading.value = true;

  try {
    const prodCdRes = await CommonAPI.getCodePharmList('02');
    if (!prodCdRes.ok) {
      toastApi.errorFromResult(prodCdRes);
    }
    const prodCdList = prodCdRes.data?.resultData?.list ?? [];
    prodCdOptions.value = [{ codeId: '', codeNm: '상품선택' }, ...prodCdList];
  } catch (e) {
    toastApi.errorFromException(e);
  } finally {
    optionsLoading.value = false;
  }
};

const fetchDetail = async () => {
  if (!prodId.value)
    return;

  isLoading.value = true;

  try {
    const res = await PharmAPI.getProdDetail(prodId.value);
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
  router.push({ name: ROUTE.Pharm.PharmProd.List, query: route.query });
};

const goModify = () => {
  router.push({
    name: ROUTE.Pharm.PharmProd.Modify,
    query: { ...route.query, prodId: prodId.value },
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
      prodId: detailInfo.value.prodId,
    };

    const res = await PharmAPI.deleteProd(params);
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
  fetchSearchOptions();
  fetchDetail();
});
</script>

<template>
  <CCard class="mb-3">
    <CCardHeader class="d-flex justify-content-between align-items-center">
      <h6 class="mb-0">상세정보</h6>
    </CCardHeader>
    <CCardBody>
      <div class="loading" v-if="isLoading">
        <UiLoading />
      </div>
      <UiGridTable :fields="memberInfoFields" />
    </CCardBody>
  </CCard>

  <div class="d-flex justify-content-end gap-2">
    <CButton color="secondary" @click="goBackToList">뒤로</CButton>
    <CButton color="warning" @click="goModify">수정</CButton>
    <CButton color="danger" @click="onDelete">삭제</CButton>
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
