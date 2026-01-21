<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { HospApi } from '@/api/temp/hosp';
import { useBaseStore } from '@/stores/base';
import { useApiToast } from '@/composables/useApiToast';
import { formatYmd } from '@/utils/common';
import UiModal from '@/components/ui/UiModal.vue';
import UiGridTable from '@/components/ui/UiCustomGridTable.vue';
import UiLoading from '@/components/ui/UiLoading.vue';

// ----------------------
//  ✨ Props & Emits
// ----------------------
const props = defineProps({
  modelValue: { type: Object, default: null },
  visible: { type: Boolean, default: false },
});

const emit = defineEmits(['update:visible']);

const modalVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

// ----------------------
//  ✨composable / store
// ----------------------
const base = useBaseStore();
const { storeMenuType } = storeToRefs(base); // ref 형태로 추출
const toastApi = useApiToast();
// ----------------------
//  ✨reactive, ref state
// ----------------------
const customerInfo = ref({});
const isLoading = ref(false); // 상세 본문용 로딩 (스피너)

const GRID_TABLE_FIELDS = computed(() => [
  {
    cols: [
      {
        label: '상호명 [원장명]',
        value: `${customerInfo.value.hospNm || '-'} [${customerInfo.value.mainDoctorNm || '-'}] `,
      },
      { label: '고객구분', value: customerInfo.value.hospGbNm || '-' },
    ],
  },
  {
    cols: [
      {
        label: '사업자번호',
        value: customerInfo.value.businessNo || '-',
      },
      { label: '요양기관번호', value: customerInfo.value.hospCd || '-' },
    ],
  },
  {
    cols: [
      {
        label: '이메일',
        value: customerInfo.value.taxEmail || '-',
      },
      { label: '대표번호', key: 'hospTel' },
    ],
  },
  {
    cols: [
      {
        label: 'Fax',
        value: customerInfo.value.faxNo || '-',
      },
      { label: '추가번호', value: '-' },
    ],
  },
  {
    cols: [
      {
        label: '대표진료과',
        value: customerInfo.value.deptNm || '-',
      },
      { label: '핸드폰번호', key: 'doctTel' },
    ],
  },
  {
    cols: [
      {
        label: '업태구분',
        value: customerInfo.value.cond1 || '-',
      },
      { label: '계약/유지보수일/오픈일', key: 'contractDate' },
    ],
  },
  {
    cols: [
      {
        label: '주소',
        value: customerInfo.value.hospAddr || '-',
      },
      { label: '세금계산서', value: customerInfo.value.taxPrsnNo || '-' },
    ],
  },
  {
    cols: [
      {
        label: '서버IP',
        value: customerInfo.value.serverIp || '-',
      },
      { label: '메신저IP', value: customerInfo.value.messengerIp || '-' },
    ],
  },
  {
    cols: [
      {
        label: '펜차트 에이전트 IP',
        value: customerInfo.value.penAgentInfo || '-',
      },
      { label: '펜차트 WIFI 이름', value: customerInfo.value.penWifiInfo || '-' },
    ],
  },
  {
    cols: [
      {
        label: '이지스 차트버전',
        key: 'chartVersion',
      },
    ],
    colspan: true,
  },
]);
// ----------------------
//  ✨ methods / functions/
// ----------------------
const fetchCustomerInfo = async () => {
  isLoading.value = true;
  try {
    const res = await HospApi.getCustomerInfo({
      licenseCd: props.modelValue?.licenseCd,
      menuType: storeMenuType.value,
    });
    if (!res.ok) return toastApi.errorFromResult(res);
    customerInfo.value = res.data?.resultData;
    console.log(customerInfo.value);
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  } finally {
    isLoading.value = false;
  }
};

const handleCancel = () => {
  modalVisible.value = false;
};

watch(
  () => props.modelValue,
  (v) => {
    fetchCustomerInfo();
  },
);
</script>

<template>
  <UiModal
    v-model:visible="modalVisible"
    :title="props.modelValue?.hospNm"
    :is-confirm-btn="false"
    cancel-text="닫기"
    @cancel="handleCancel"
  >
    <template #body>
      <UiLoading v-if="isLoading" />
      <UiGridTable :fields="GRID_TABLE_FIELDS">
        <template #value-hospTel>
          <a :href="`tel:${customerInfo.hospTel}`">{{ customerInfo.hospTel }}</a>
        </template>
        <template #value-doctTel>
          <a :href="`tel:${customerInfo.doctTel}`">{{ customerInfo.doctTel }}</a>
        </template>
        <template #value-contractDate>
          {{ customerInfo.setupYmd }} / {{ customerInfo.startYmd }} / {{ customerInfo.openYmd }}
        </template>
        <template #value-chartVersion>
          <span class="text-danger">
            <template v-if="customerInfo.eghis2InstYmd != null && customerInfo.eghis2InstYmd != ''">
              2.0 [설치일 {{ formatYmd(customerInfo.eghis2InstYmd) }}]
            </template>
            <template v-else> 1.0 </template>
          </span>
        </template>
      </UiGridTable>
    </template>
  </UiModal>
</template>

<style scoped></style>
