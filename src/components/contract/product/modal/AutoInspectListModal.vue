<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useBaseStore } from '@/stores/base';
import { ContractApi } from '@/api/temp/contract';
import { useApiToast } from '@/composables/useApiToast';
import UiModal from '@/components/ui/UiModal.vue';
import UiDataTable from '@/components/ui/UiDataTable.vue';

const COLUMNS = [
  { key: 'categoryNm', label: '카테고리명', width: '20%' },
  { key: 'itemCd', label: '항목코드', width: '10%' },
  { key: 'itemNm', label: '항목명', width: 'auto' },
  { key: 'price', label: '기본 금액', width: '12%' },
  { key: 'inspectAmt', label: '자동 검수 기준액', width: '12%' },
];

// ----------------------
//  ✨ Props & Emits
// ----------------------
const props = defineProps({
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
const autoInspectList = ref([]);
const isLoading = ref(false);
// ----------------------
//  ✨ methods / functions/
// ----------------------
const fetchList = async () => {
  const params = {
    menuType: storeMenuType.value,
  };
  try {
    isLoading.value = true;
    const res = await ContractApi.getAutoInspectList(params);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return { items: [], total: 0 };
    }
    autoInspectList.value = res.data?.resultData?.list ?? [];
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
  modalVisible,
  (v) => {
    if (v) fetchList();
  },
  { deep: true },
);
</script>

<template>
  <UiModal
    v-model:visible="modalVisible"
    title="자동검수 목록"
    :is-confirm-btn="false"
    @cancel="handleCancel"
  >
    <template #body>
      <UiDataTable
        :columns="COLUMNS"
        :items="autoInspectList"
        :loading="isLoading"
        :row-clickable="false"
        :row-key="(row, idx) => row.totNo ?? idx"
      >
        <template #cell-price="{ item }">
          {{ item.price.toLocaleString('ko-KR') || '0' }}
        </template>
        <template #cell-inspectAmt="{ item }">
          {{ item.inspectAmt.toLocaleString('ko-KR') || '0' }}
        </template>
      </UiDataTable>
    </template>
  </UiModal>
</template>

<style scoped></style>
