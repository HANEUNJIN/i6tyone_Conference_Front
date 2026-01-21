<script setup>
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useBaseStore } from '@/stores/base';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { useApiToast } from '@/composables/useApiToast';
import { useToast } from '@/composables/useToast';
import { HospApi } from '@/api/temp/hosp';
import titleIcon from '@/assets/images/common/title-icon.png';
import UiDataTable from '@/components/ui/UiDataTable.vue';
import UiCustomGridTable from '@/components/ui/UiCustomGridTable.vue';
import UiLoading from '@/components/ui/UiLoading.vue';
// 테이블 헤더 정의
const COLUMNS = [
  { key: 'setupType', label: '타입', width: '20%' },
  { key: 'macAddress', label: '주소', width: '20%' },
  { key: 'ipAddress', label: '아이피', width: '20%' },
  { key: 'addYmd', label: '추가일', width: '20%' },
  { key: 'loginYmd', label: '마지막로그인', width: '20%' },
];
const TODAY_LOG_COLUMNS = [
  { key: 'macAddress', label: '주소', width: '33.33%' },
  { key: 'ipAddress', label: '아이피', width: '33.33%' },
  { key: 'loginYmd', label: '당일 로그인', width: '33.33%' },
];
const GRID_TABLE_FIELDS = computed(() => [
  {
    cols: [
      { label: '사용가능', value: `${licenseCntInfoVer2.value.totCnt || '0'}개` },
      { label: '사용중', value: `${licenseCntInfoVer2.value.useCnt || '0'}개` },
    ],
  },
]);
// ----------------------
//  ✨composable / store
// ----------------------
const base = useBaseStore();
const modal = useConfirmModal();
const { storeMenuType, storeLicenseCd } = storeToRefs(base); // ref 형태로 추출
const toastApi = useApiToast();
const toast = useToast();
// ----------------------
//  ✨reactive, ref state
// ----------------------
const chartVersion = ref({});
const isShowTodayLog = ref(false);
const isLoading = ref(false);
const licenseList = ref([]);
const licenseCntInfo = ref({});
const licenseCntInfoVer2 = ref({});
const todayLoginLogList = ref([]);
// ----------------------
//  ✨ methods / functions/
// ----------------------
const fetchChartVersionCheck = async () => {
  isLoading.value = true;
  try {
    const res = await HospApi.getChartVersion({
      licenseCd: storeLicenseCd.value,
      menuType: storeMenuType.value,
    });
    if (!res.ok) return toastApi.errorFromResult(res);
    chartVersion.value = res.data?.resultData;
    if (chartVersion.value === '2.0') {
      console.log('2.0');
      await fetchChartVersion2();
    } else {
      console.log('1.0');
      await fetchChartVersion1();
    }
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  } finally {
    isLoading.value = false;
  }
};

const fetchChartVersion1 = async () => {
  try {
    const [listRes, cntRes] = await Promise.all([
      HospApi.getMacLicenseList({
        licenseCd: storeLicenseCd.value,
      }),
      HospApi.getMacLicenseCnt({
        licenseCd: storeLicenseCd.value,
      }),
    ]);

    if (!listRes.ok) return toastApi.errorFromResult(listRes);
    if (!cntRes.ok) return toastApi.errorFromResult(cntRes);
    licenseList.value = listRes.data?.resultData?.list ?? [];
    licenseCntInfo.value = cntRes.data?.resultData;
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
};

const fetchChartVersion2 = async () => {
  try {
    const [ver2CntRes, cntRes, todayLogRes] = await Promise.all([
      HospApi.getVersion2LicenseCnt({
        licenseCd: storeLicenseCd.value,
        licenseType: 'PC',
      }),
      HospApi.getMacLicenseCnt({
        licenseCd: storeLicenseCd.value,
      }),
      HospApi.getMacLTodayLoginLog({
        licenseCd: storeLicenseCd.value,
      }),
    ]);

    if (!ver2CntRes.ok) return toastApi.errorFromResult(ver2CntRes);
    if (!cntRes.ok) return toastApi.errorFromResult(cntRes);
    if (!todayLogRes.ok) return toastApi.errorFromResult(todayLogRes);

    licenseCntInfoVer2.value = ver2CntRes.data?.resultData;
    licenseCntInfo.value = cntRes.data?.resultData;
    todayLoginLogList.value = todayLogRes.data?.resultData?.list ?? [];
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
};

const handleMacClearConfirm = async () => {
  const confirm = await modal.show({
    title: 'PC MAC',
    message: '클리어 하시겠습니까?',
    confirmText: '확인',
  });
  if (!confirm) return;
  let formData = new FormData();
  formData.append('LicenseCd', storeLicenseCd.value);
  try {
    const res = await HospApi.putMacLicenseClear(formData);
    if (!res.ok) return toastApi.errorFromResult(res);
    toast.success('클리어 되었습니다.');
    await fetchChartVersionCheck();
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
};

onMounted(() => {
  fetchChartVersionCheck();
});
</script>

<template>
  <CCard>
    <CCardHeader>
      <h6 class="d-flex align-content-center gap-1 mb-0">
        <CImage :src="titleIcon" width="20" /> <span>PC 기기 정보</span>
      </h6>
    </CCardHeader>
    <CCardBody>
      <UiLoading v-if="isLoading" />
      <template v-if="chartVersion === '2.0'">
        <UiCustomGridTable :fields="GRID_TABLE_FIELDS" />
        <template v-if="isShowTodayLog">
          <UiDataTable
            v-if="todayLoginLogList.length > 0"
            :columns="TODAY_LOG_COLUMNS"
            :items="todayLoginLogList"
          />
          <p v-else class="mb-0 p-3 text-center">당일 접속 정보가 없습니다.</p>
        </template>
      </template>
      <template v-else>
        <UiDataTable :loading="isLoading" :columns="COLUMNS" :items="licenseList">
          <template #cell-setupType="{ item }">
            {{ item.setupType === 'C' ? '클라이언트' : item.setupType === 'S' ? '서버' : '프리' }}
          </template>
        </UiDataTable>
      </template>
    </CCardBody>
    <CCardFooter>
      <div class="d-flex justify-content-between align-items-center">
        <div class="d-flex gap-2" style="font-size: 13px; font-weight: bold">
          <span>프리 : {{ licenseCntInfo.freeSetupCnt }}개</span> /
          <span>클라이언트 : {{ licenseCntInfo.clientSetupCnt }}개</span> /
          <span>서버 : {{ licenseCntInfo.serverSetupCnt }}개</span>
        </div>
        <div class="d-flex align-items-center gap-3">
          <CFormCheck
            v-if="chartVersion === '02'"
            v-model="isShowTodayLog"
            label="당일 접속 보기"
            id="당일 접속 보기"
          />
          <CButton color="secondary" size="sm" @click="handleMacClearConfirm"
            >PC MAC 클리어</CButton
          >
        </div>
      </div>
    </CCardFooter>
  </CCard>
</template>

<style scoped></style>
