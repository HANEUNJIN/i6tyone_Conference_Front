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
  { key: 'licenseType', label: '타입', width: '20%' },
  { key: 'macAddress', label: '주소', width: '20%' },
  { key: 'ipAddress', label: '아이피', width: '20%' },
  { key: 'addYmd', label: '추가일', width: '20%' },
  { key: 'loginYmd', label: '마지막로그인', width: '20%' },
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
const licenseList = ref([]);
const licenseCntInfo = ref({});
const licenseCntInfoVer2 = ref({});
const tabletLicenseCntInfo = ref({});
const isLoading = ref(false);
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
      await fetchVersion2LicenseCnt;
    }
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  } finally {
    isLoading.value = false;
  }
};

const fetchTabletLicenseList = async () => {
  try {
    const res = await HospApi.getTabletLicenseList({
      licenseCd: storeLicenseCd.value,
    });

    if (!res.ok) return toastApi.errorFromResult(res);
    licenseList.value = res.data?.resultData?.list ?? [];
    const proSetupCnt = licenseList.value.filter((item) => item.licenseType === '2').length;
    const liteSetupCnt = licenseList.value.filter((item) => item.licenseType === '1').length;
    tabletLicenseCntInfo.value.proSetupCnt = proSetupCnt || 0;
    tabletLicenseCntInfo.value.liteSetupCnt = liteSetupCnt || 0;
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
};

const fetchVersion2LicenseCnt = async () => {
  try {
    const res = await HospApi.getVersion2LicenseCnt({
      licenseCd: storeLicenseCd.value,
      licenseType: 'TABLET',
    });
    if (!res.ok) return toastApi.errorFromResult(res);
    licenseCntInfoVer2.value = res.data?.resultData;
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
};

const handleMacClearConfirm = async () => {
  const confirm = await modal.show({
    title: 'Tablet MAC',
    message: '클리어 하시겠습니까?',
    confirmText: '확인',
  });
  if (!confirm) return;
  let formData = new FormData();
  formData.append('LicenseCd', storeLicenseCd.value);
  try {
    const res = await HospApi.putTabletLicenseClear(formData);
    if (!res.ok) return toastApi.errorFromResult(res);
    toast.success('클리어 되었습니다.');
    await fetchChartVersionCheck();
    await fetchTabletLicenseList();
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
};

onMounted(() => {
  fetchChartVersionCheck();
  fetchTabletLicenseList();
});
</script>

<template>
  <CCard>
    <CCardHeader>
      <h6 class="d-flex align-content-center gap-1 mb-0">
        <CImage :src="titleIcon" width="20" /> <span>Tablet 기기 정보</span>
      </h6>
    </CCardHeader>
    <CCardBody>
      <UiLoading v-if="isLoading" />
      <template v-if="chartVersion === '2.0'">
        <UiCustomGridTable :fields="GRID_TABLE_FIELDS" />
      </template>
      <template v-else>
        <UiDataTable :loading="isLoading" :columns="COLUMNS" :items="licenseList">
          <template #cell-licenseType="{ item }">
            {{
              item.licenseType === '1' ? '라이트' : item.licenseType === '2' ? '프로' : '알수없음'
            }}
          </template>
        </UiDataTable>
      </template>
    </CCardBody>
    <CCardFooter>
      <div class="d-flex justify-content-between align-items-center">
        <div class="d-flex gap-2" style="font-size: 13px; font-weight: bold">
          <span>라이트 : {{ tabletLicenseCntInfo.liteSetupCnt }}개</span> /
          <span>프로 : {{ tabletLicenseCntInfo.proSetupCnt }}개</span>
        </div>

        <CButton color="secondary" size="sm" @click="handleMacClearConfirm">맥클리어</CButton>
      </div>
    </CCardFooter>
  </CCard>
</template>

<style scoped></style>
