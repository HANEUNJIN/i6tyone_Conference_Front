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
const agencyInfo = ref({});
const isLoading = ref(false); // 상세 본문용 로딩 (스피너)

const GRID_TABLE_FIELDS = computed(() => [
  {
    cols: [{ label: '담당 대리점', key: 'branchNm', labelWidth: 4, valueWidth: 8 }],
    colspan: true,
  },
  {
    cols: [
      {
        label: '계약 담당자',
        value: agencyInfo.value.contMng || '-',
        labelWidth: 4,
        valueWidth: 8,
      },
    ],
    colspan: true,
  },
  {
    cols: [
      {
        label: '계약 담당자 연락처',
        value: agencyInfo.value.contMngTel || '-',
        labelWidth: 4,
        valueWidth: 8,
      },
    ],
    colspan: true,
  },
  {
    cols: [{ label: '서비스 대리점', key: 'serviceBranchNm', labelWidth: 4, valueWidth: 8 }],
    colspan: true,
  },
  {
    cols: [
      {
        label: '서비스 담당자',
        value: agencyInfo.value.serviceUserNm || '-',
        labelWidth: 4,
        valueWidth: 8,
      },
    ],
    colspan: true,
  },
  {
    cols: [
      {
        label: '서비스 담당자 연락처',
        value: agencyInfo.value.serviceUserPhone || '-',
        labelWidth: 4,
        valueWidth: 8,
      },
    ],
    colspan: true,
  },
  {
    cols: [
      {
        label: '기존 차트업체',
        value: agencyInfo.value.hospPchart || '-',
        labelWidth: 4,
        valueWidth: 8,
      },
    ],
    colspan: true,
  },
]);
// ----------------------
//  ✨ methods / functions/
// ----------------------
const fetchAgencyInfo = async () => {
  isLoading.value = true;
  try {
    const res = await HospApi.getAgencyInfo({
      licenseCd: props.modelValue?.licenseCd,
      menuType: storeMenuType.value,
    });
    if (!res.ok) return toastApi.errorFromResult(res);
    agencyInfo.value = res.data?.resultData;
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
    fetchAgencyInfo();
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
        <template #value-branchNm>
          {{ agencyInfo.branchNm || '-' }}
          <span class="text-danger">[{{ agencyInfo.serviceCorpNm || '-' }}]</span>
        </template>
        <template #value-serviceBranchNm>
          <span class="text-danger">{{ agencyInfo.serviceBranchNm || '-' }}</span>
        </template>
      </UiGridTable>
    </template>
  </UiModal>
</template>

<style scoped></style>
