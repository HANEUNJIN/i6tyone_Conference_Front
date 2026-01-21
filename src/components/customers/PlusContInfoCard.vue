<script setup>
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useBaseStore } from '@/stores/base';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { useApiToast } from '@/composables/useApiToast';
import { useToast } from '@/composables/useToast';
import titleIcon from '@/assets/images/common/title-icon.png';
import UiGridTable from '@/components/ui/UiCustomGridTable.vue';
import { HospApi } from '@/api/temp/hosp';
import UiLoading from '@/components/ui/UiLoading.vue';

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
const plusContInfo = ref({});
const isLoading = ref(false);
const GRID_TABLE_FIELDS = computed(() => [
  {
    cols: [
      {
        label: '서버별도',
        value: plusContInfo.value.serverCheck || '-',
        labelWidth: 3,
        valueWidth: 1,
      },
      {
        label: '사전심사',
        value: plusContInfo.value.inspCheck || '-',
        labelWidth: 3,
        valueWidth: 1,
      },
      {
        label: '굿닥 사용',
        value: plusContInfo.value.goodocCheck || '-',
        labelWidth: 3,
        valueWidth: 1,
      },
    ],
  },
  {
    cols: [
      { label: 'EKG', value: plusContInfo.value.ekgCheck || '-', labelWidth: 3, valueWidth: 1 },
      {
        label: '전자서명',
        value: plusContInfo.value.emrCheck || '-',
        labelWidth: 3,
        valueWidth: 1,
      },
      { label: '정보교류', value: plusContInfo.value.iheYn || '-', labelWidth: 3, valueWidth: 1 },
    ],
  },
  {
    cols: [
      { label: 'SMS', value: plusContInfo.value.smsCheck || '-', labelWidth: 3, valueWidth: 1 },
      {
        label: '미러링 /미러링 약관',
        value: `${plusContInfo.value.mirroringYn || '-'}/${plusContInfo.value.mirroringProvisionYn || '-'}`,
        labelWidth: 3,
        valueWidth: 1,
      },
      {
        label: '과거영상연동',
        value: plusContInfo.value.pastImageCheck || '-',
        labelWidth: 3,
        valueWidth: 1,
      },
    ],
  },
  {
    cols: [
      {
        label: '영상관리',
        value: plusContInfo.value.imageCheck || '-',
        labelWidth: 3,
        valueWidth: 1,
      },
      { label: 'VAN', value: plusContInfo.value.vanCheck || '-', labelWidth: 3, valueWidth: 1 },
      { label: 'PACS', value: plusContInfo.value.pacsCheck || '-', labelWidth: 3, valueWidth: 1 },
    ],
  },
  {
    cols: [
      {
        label: '수탁기관(1)',
        value: plusContInfo.value.lab1Check || '-',
        labelWidth: 3,
        valueWidth: 1,
      },
      {
        label: '수탁기관(2)',
        value: plusContInfo.value.lab2Check || '-',
        labelWidth: 3,
        valueWidth: 1,
      },
      {
        label: 'Medi Age',
        value: plusContInfo.value.mediageYn || '-',
        labelWidth: 3,
        valueWidth: 1,
      },
    ],
  },
  {
    cols: [
      {
        label: '건강검진',
        value: plusContInfo.value.healthCheck || '-',
        labelWidth: 3,
        valueWidth: 1,
      },
      {
        label: 'Hello 100',
        value: plusContInfo.value.hello100Yn || '-',
        labelWidth: 3,
        valueWidth: 1,
      },
      {
        label: 'Hello CRM',
        value: plusContInfo.value.hellocrmYn || '-',
        labelWidth: 3,
        valueWidth: 1,
      },
    ],
  },
  {
    cols: [
      {
        label: '대기환자',
        value: plusContInfo.value.waitlistCheck || '-',
        labelWidth: 3,
        valueWidth: 1,
      },
      {
        label: 'CTI전화연결',
        value: plusContInfo.value.ctiYn || '-',
        labelWidth: 3,
        valueWidth: 1,
      },
      {
        label: 'Hello Media',
        value: plusContInfo.value.helloMediaYn || '-',
        labelWidth: 3,
        valueWidth: 1,
      },
    ],
  },
  {
    cols: [
      { label: '펜차트', value: plusContInfo.value.tabletYn || '-', labelWidth: 3, valueWidth: 1 },
      {
        label: '정신과유료서식',
        value: plusContInfo.value.paperAgreeYn || '-',
        labelWidth: 3,
        valueWidth: 1,
      },
    ],
  },
]);

// ----------------------
//  ✨ methods / functions/
// ----------------------
const fetchPlusContInfo = async () => {
  isLoading.value = true;
  try {
    const res = await HospApi.getPlusContInfo({
      licenseCd: storeLicenseCd.value,
      menuType: storeMenuType.value,
    });
    if (!res.ok) return toastApi.errorFromResult(res);

    plusContInfo.value = res.data?.resultData;
    console.log(plusContInfo.value);
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchPlusContInfo();
});
</script>

<template>
  <CCard class="h-100">
    <CCardHeader>
      <h6 class="d-flex align-content-center gap-1 mb-0">
        <CImage :src="titleIcon" width="20" /> <span>추가 예약 정보</span>
      </h6>
    </CCardHeader>
    <CCardBody>
      <UiLoading v-if="isLoading" />
      <UiGridTable :fields="GRID_TABLE_FIELDS" />
    </CCardBody>
  </CCard>
</template>

<style scoped></style>
