<script setup>
import { onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useBaseStore } from '@/stores/base';
import { HospApi } from '@/api/temp/hosp';
import { useApiToast } from '@/composables/useApiToast';
import { useToast } from '@/composables/useToast';
import titleIcon from '@/assets/images/common/title-icon.png';
import UiDataTable from '@/components/ui/UiDataTable.vue';
import UiLoading from '@/components/ui/UiLoading.vue';

// 테이블 헤더 정의
const COLUMNS = [
  { key: 'itemNm', label: '명칭', width: '35%' },
  { key: 'startYm', label: '청구월', width: '15%' },
  { key: 'lastCost', label: '금액(단가*수량)', width: '20%' },
  { key: 'qty', label: '수량', width: '10%' },
  { key: 'payYm', label: '수납여부', width: '20%' },
];
// ----------------------
//  ✨composable / store
// ----------------------
const base = useBaseStore();
const { storeMenuType, storeLicenseCd } = storeToRefs(base); // ref 형태로 추출
const toastApi = useApiToast();
const toast = useToast();
// ----------------------
//  ✨reactive, ref state
// ----------------------
const monthInfoList = ref([]);
const unpaycostSum = ref(0);
const month = ref(2);
const isLoading = ref(false);
// ----------------------
//  ✨ methods / functions/
// ----------------------
const fetchMonthInfoList = async () => {
  isLoading.value = true;
  const params = {
    licenseCd: storeLicenseCd.value,
    menuType: storeMenuType.value,
    month: month.value,
  };
  try {
    const [infoRes, unpayRes] = await Promise.all([
      HospApi.getMonthCharge(params),
      HospApi.getMonthUnpay({
        licenseCd: storeLicenseCd.value,
        menuType: storeMenuType.value,
      }),
    ]);
    if (!infoRes.ok) return toastApi.errorFromResult(infoRes);
    if (!unpayRes.ok) return toastApi.errorFromResult(unpayRes);

    monthInfoList.value = infoRes.data?.resultData?.list ?? [];
    unpaycostSum.value = unpayRes.data?.resultData?.unpaycostSum;
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  } finally {
    isLoading.value = false;
  }
};

const handleMonthMore = () => {
  month.value += 6;
  fetchMonthInfoList();
};

const handleMonthInit = () => {
  month.value = 2;
  fetchMonthInfoList();
};

onMounted(() => fetchMonthInfoList());
</script>

<template>
  <CCard>
    <CCardHeader>
      <h6 class="d-flex align-content-center gap-1 mb-0">
        <CImage :src="titleIcon" width="20" /> <span>월회비 수납정보</span>
      </h6>
    </CCardHeader>
    <CCardBody>
      <UiLoading v-if="isLoading" />
      <div class="d-flex justify-content-end mb-2" v-if="monthInfoList.length > 0">
        <strong :class="{ 'text-danger': unpaycostSum > 0 }">(미수금액:{{ unpaycostSum }})</strong>
      </div>
      <UiDataTable :loading="isLoading" :columns="COLUMNS" :items="monthInfoList" :hover="false">
        <template #cell-lastCost="{ item }">
          {{ item.lastCost.toLocaleString('ko-KR') }}
        </template>
      </UiDataTable>
      <div class="d-flex justify-content-center gap-2 mt-2" v-if="monthInfoList.length > 0">
        <CButton color="secondary" size="sm" @click="handleMonthMore">6개월 더보기</CButton>
        <CButton v-if="month > 2" variant="outline" size="sm" @click="handleMonthInit"
          >접기</CButton
        >
      </div>
    </CCardBody>
  </CCard>
</template>
