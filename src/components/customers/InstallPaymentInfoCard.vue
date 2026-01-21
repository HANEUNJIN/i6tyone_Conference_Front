<script setup>
import { onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useBaseStore } from '@/stores/base';
import { HospApi } from '@/api/temp/hosp';
import { useApiToast } from '@/composables/useApiToast';
import { useToast } from '@/composables/useToast';
import { useExcelDownload } from '@/composables/useExcelDownload';
import { datepickerFixed, formatYmd, getTodayYmd } from '@/utils/common';
import Datepicker from '@vuepic/vue-datepicker';
import titleIcon from '@/assets/images/common/title-icon.png';
import UiDataTable from '@/components/ui/UiDataTable.vue';
import UiLoading from '@/components/ui/UiLoading.vue';

// 테이블 헤더 정의
const COLUMNS = [
  { key: 'itemNm', label: '명칭', width: '35%' },
  { key: 'insYmd', label: '설치일', width: '15%' },
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
const { downloadExcel } = useExcelDownload();
// ----------------------
//  ✨reactive, ref state
// ----------------------
const installInfoList = ref([]);
const unpaycostInstallSum = ref(0);
const dateFrom = ref('2023-01-01');
const dateTo = ref(getTodayYmd());
const isLoading = ref(false);
// ----------------------
//  ✨ methods / functions/
// ----------------------

const fetchInstallInfoList = async () => {
  isLoading.value = true;
  const params = {
    licenseCd: storeLicenseCd.value,
    menuType: storeMenuType.value,
  };
  try {
    const [infoRes, unpayRes] = await Promise.all([
      HospApi.getInstallInfo(params),
      HospApi.getInstallUnpay(params),
    ]);
    if (!infoRes.ok) return toastApi.errorFromResult(infoRes);
    if (!unpayRes.ok) return toastApi.errorFromResult(unpayRes);

    installInfoList.value = infoRes.data?.resultData?.list ?? [];
    unpaycostInstallSum.value = unpayRes.data?.resultData?.unpaycostInstallSum;
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  } finally {
    isLoading.value = false;
  }
};

const excelDownload = async () => {
  if (formatYmd(dateTo.value) < formatYmd(dateFrom.value))
    return toast.error('조회 날짜가 잘못 입력되었습니다.');
  const params = {
    dateFrom: dateFrom.value,
    dateTo: dateTo.value,
    licenseCd: storeLicenseCd.value,
  };
  const excelRes = await HospApi.getUsePayInfo(params);
  const fileName = '사용내역서';
  downloadExcel(excelRes, fileName);
};

onMounted(() => fetchInstallInfoList());
</script>

<template>
  <CCard>
    <CCardHeader>
      <h6 class="d-flex align-content-center gap-1 mb-0">
        <CImage :src="titleIcon" width="20" /> <span>설치비 수납정보</span>
      </h6>
    </CCardHeader>
    <CCardBody>
      <UiLoading v-if="isLoading" />
      <div
        class="d-flex justify-content-between align-items-center mb-2"
        v-if="installInfoList.length > 0"
      >
        <div class="d-flex align-items-center gap-2">
          <span>사용내역서</span>
          <Datepicker
            v-model="dateFrom"
            v-bind="datepickerFixed"
            locale="ko"
            style="width: 130px"
            :clearable="false"
            :ui="{ input: 'form-control form-control-sm' }"
          />
          <Datepicker
            v-model="dateTo"
            v-bind="datepickerFixed"
            locale="ko"
            style="width: 130px"
            :clearable="false"
            :ui="{ input: 'form-control form-control-sm' }"
          />
          <CButton color="success" size="sm" @click="excelDownload">액셀</CButton>
        </div>
        <div>
          <strong :class="{ 'text-danger': unpaycostInstallSum > 0 }"
            >(미수금액:{{ unpaycostInstallSum }})
          </strong>
        </div>
      </div>
      <UiDataTable :loading="isLoading" :columns="COLUMNS" :items="installInfoList" :hover="false">
        <template #cell-lastCost="{ item }">
          {{ item.lastCost.toLocaleString('ko-KR') }}
        </template>
      </UiDataTable>
    </CCardBody>
  </CCard>
</template>
