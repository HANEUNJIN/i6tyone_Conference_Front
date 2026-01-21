<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { ServiceAPI } from '@/api/temp/service';
import { useBaseStore } from '@/stores/base';
import { useApiToast } from '@/composables/useApiToast';
import { usePaginatedQueryList } from '@/composables/usePaginatedQueryList';
import UiModal from '@/components/ui/UiModal.vue';
import UiDataTable from '@/components/ui/UiDataTable.vue';
import UiGridTable from '@/components/ui/UiGridTable.vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import fileIcon from '@/assets/images/fileIcon.gif';

const COLUMNS = [
  { key: 'totNo', label: 'No', width: '4%' },
  { key: 'regDt', label: '요청일', width: '12%' },
  { key: 'purposeTot', label: '목적', width: '10%' },
  { key: 'reqMatters', label: '문의사항', width: 'auto', align: 'left' },
  { key: 'procEr', label: '처리자', width: '6%' },
  { key: 'procDate', label: '처리일', width: '12%' },
  { key: 'procCondNm', label: '결과', width: '6%' },
  { key: 'passEr', label: '인수자', width: '6%' },
  { key: 'passDate', label: '처리일', width: '12%' },
  { key: 'passCond', label: '지원분류', width: '6%' },
];

const COLLAPSED_FIELDS = [
  { label1: '문의사항', key: 'reqMatters', colspan: true },
  { label1: 'CS팀처리', key: 'procWay', colspan: true },
  { label1: '인수처리내용', key: 'passWay', colspan: true },
  { label1: '첨부이미지', key: 'fileImages', colspan: true },
];

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
const fileImages = ref([]);
// ----------------------
//  ✨ methods / functions/
// ----------------------
const fetchList = async () => {
  const params = {
    licenseCd: props.modelValue?.licenseCd,
    pageNum: page.value,
    pageSize: size.value,
    menuType: storeMenuType.value,
  };
  try {
    const res = await ServiceAPI.getSupportList(params);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return { items: [], total: 0 };
    }
    const list = res.data?.resultData?.list ?? [];
    const total = res.data?.resultData?.totCnt ?? list?.[0]?.totCnt ?? 0;

    return { items: list, total: Number(total) || 0 };
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
    return { items: [], total: 0 };
  }
};

const { loading, items, total, page, size, init, onPageChanged } = usePaginatedQueryList(
  fetchList,
  {
    defaultKeyword: '',
    defaultSize: 5,
    disableUrlSync: true,
  },
);

const fetchFileImages = async (seq) => {
  try {
    const res = await ServiceAPI.getServicePassImg({
      seq: seq,
      menuType: storeMenuType.value,
    });
    if (!res.ok) return toastApi.errorFromResult(res);
    fileImages.value = res.data?.resultData?.list ?? [];
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
};

const handleRowClick = (row) => {
  fileImages.value = [];
  fetchFileImages(row.seq);
};

const handleCancel = () => {
  modalVisible.value = false;
  init();
};

watch(
  () => props.modelValue,
  (v) => {
    init();
  },
);
</script>

<template>
  <UiModal
    v-model:visible="modalVisible"
    :title="'[' + props.modelValue?.hospNm + ']' + ' 문의내역 히스토리'"
    size="xl"
    :is-confirm-btn="false"
    @cancel="handleCancel"
  >
    <template #body>
      <UiDataTable
        collapsed
        :columns="COLUMNS"
        :items="items"
        :loading="loading"
        :row-clickable="true"
        :row-key="(row, idx) => row.totNo ?? idx"
        @row-click="
          ({ row }) => {
            handleRowClick(row);
          }
        "
      >
        <template #cell-reqMatters="{ item }">
          <div class="d-flex gap-1 align-items-center">
            <p class="truncate-multiline">
              {{ item.reqMatters }}
            </p>
            <CImage :src="fileIcon" v-if="item.imageYn === 'Y'" />
          </div>
        </template>
        <template #row-collapsed="{ item }">
          <UiGridTable :fields="COLLAPSED_FIELDS">
            <template #value-reqMatters>
              <pre>{{ item.reqMatters || '-' }}</pre>
            </template>
            <template #value-procWay>
              <pre>{{ item.procWay || '-' }}</pre>
            </template>
            <template #value-passWay>
              <pre>{{ item.passWay || '-' }}</pre>
            </template>
            <template #value-fileImages>
              <div v-for="(file, idx) in fileImages" :key="idx" class="mt-2">
                <CImage :src="`data:image/gif;base64,${file.base64Img}`" width="100%" />
              </div>
            </template>
          </UiGridTable>
        </template>
      </UiDataTable>
      <UiPagination
        v-if="total > 0"
        v-model:page="page"
        v-model:size="size"
        :edge-count="4"
        :mid-count="3"
        :show-size-select="false"
        :total="total"
        @change="onPageChanged"
      />
    </template>
  </UiModal>
</template>

<style scoped></style>
