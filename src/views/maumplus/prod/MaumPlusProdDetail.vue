<script setup>
import UiGridTable from '@/components/ui/UiGridTable.vue';
import UiLoading from '@/components/ui/UiLoading.vue';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApiToast } from '@/composables/useApiToast';
import { useBaseStore } from '@/stores/base';
import { ROUTE } from '@/constants/routeName';
import { formatMoney } from '@/utils/common';
import { MaumPlusAPI } from '@/api/maumPlus';

// ----------------------
// ✨ composable / store
// ----------------------
const route = useRoute();
const router = useRouter();
const toastApi = useApiToast();
const base = useBaseStore();

// ----------------------
// ✨ reactive state
// ----------------------
const prodId = computed(() => route.query.prodId || '');

const detailInfo = ref({});
const isLoading = ref(false);

const statusInfoFields = computed(() => [
  {
    label1: '상품코드',
    value1: detailInfo.value.prodId,
    colspan: true,
  },
  {
    label1: '상품타입',
    value1: detailInfo.value.payType === 'M' ? '월결제' : '년결제',
    colspan: true,
  },
  {
    label1: '상품명',
    value1: detailInfo.value.prodNm,
    colspan: true,
  },
  {
    label1: '기본상담사수',
    value1: detailInfo.value.partnerCnt,
    colspan: true,
  },
  {
    label1: '상품가격',
    value1: formatMoney(detailInfo.value.prodAmt),
    colspan: true,
  },
  {
    label1: '상담사추가 가격',
    value1: formatMoney(detailInfo.value.partnerAddAmt),
    colspan: true,
  },
  {
    label1: '상태값',
    value1: detailInfo.value.statusYn === 'Y' ? '사용' : '미사용',
    colspan: true,
  },
]);

const fetchDetail = async () => {
  if (!prodId.value)
    return;

  isLoading.value = true;

  try {
    const params = {
      prodId: prodId.value,
    };

    const res = await MaumPlusAPI.getProdDetail(params);
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
  router.push({ name: ROUTE.Maumplus.MaumPlusProd.List, query: route.query });
};

const goModify = () => {
  router.push({
    name: ROUTE.Maumplus.MaumPlusProd.Modify,
    query: { ...route.query, prodId: prodId.value },
  });
};

const onDelete = () => {

};

onMounted(() => {
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
      <UiGridTable :fields="statusInfoFields" />
    </CCardBody>
  </CCard>
  <div class="d-flex justify-content-end gap-2">
    <CButton color="secondary" @click="goBackToList">뒤로</CButton>
    <CButton color="danger" @click="onDelete">삭제</CButton>
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
