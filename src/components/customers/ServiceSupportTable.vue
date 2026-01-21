<script setup>
import { onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useBaseStore } from '@/stores/base';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { useApiToast } from '@/composables/useApiToast';
import { useToast } from '@/composables/useToast';
import UiDataTable from '@/components/ui/UiDataTable.vue';
import { ServiceAPI } from '@/api/temp/service';
import { usePaginatedQueryList } from '@/composables/usePaginatedQueryList';
import UiGridTable from '@/components/ui/UiGridTable.vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import { useEventStore } from '@/stores/event';

// 테이블 헤더 정의
const COLUMNS = [
  { key: 'totNo', label: 'No', width: '4%' },
  { key: 'regDt', label: '요청일', width: '15%' },
  { key: 'purposeTot', label: '목적', width: '10%' },
  { key: 'reqMattersSum', label: '문의사항', width: 'auto' },
  { key: 'procEr', label: '처리자', width: '6%' },
  { key: 'procDate', label: '처리일', width: '15%' },
  { key: 'procCondNm', label: '결과', width: '12%' },
  { key: 'passEr', label: '인수자', width: '6%' },
  { key: 'passDate', label: '처리일', width: '15%' },
  { key: 'passCond', label: '지원분류', width: '10%' },
];
const COLLAPSED_FIELDS = [
  {
    label1: '문의사항',
    key: 'reqMatters',
    colspan: true,
  },
  {
    label1: '처리자',
    key1: 'procEr',
    label2: '처리일',
    key2: 'procDate',
  },
  {
    label1: '처리결과',
    key: 'procCondNm',
    colspan: true,
  },
  {
    label1: '인수자',
    key1: 'passEr',
    label2: '인수일',
    key2: 'passDate',
  },
  {
    label1: 'CS팀처리',
    key: 'procWay',
    colspan: true,
  },
  {
    label1: '인수처리내용',
    key: 'passWay',
    colspan: true,
  },
  {
    label1: '첨부이미지',
    key: 'fileImages',
    colspan: true,
  },
];
// ----------------------
//  ✨composable / store
// ----------------------
const base = useBaseStore();
const eventStore = useEventStore();
const modal = useConfirmModal();
const { storeMenuType, storeLicenseCd } = storeToRefs(base); // ref 형태로 추출
const toastApi = useApiToast();
const toast = useToast();
// ----------------------
//  ✨reactive, ref state
// ----------------------
const fileImages = ref([]);
const isLoading = ref(false);
// ----------------------
//  ✨ methods / functions/
// ----------------------
const fetchServiceSupportList = async () => {
  const params = {
    licenseCd: storeLicenseCd.value,
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
    const serviceSupportList = list.map((e) => {
      return { ...e, collapsed: false, collapseVisible: false };
    });

    return { items: serviceSupportList, total: Number(total) || 0 };
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
    return { items: [], total: 0 };
  }
};

// usePaginatedQueryList 훅
const { loading, items, total, page, size, init, onPageChanged } = usePaginatedQueryList(
  fetchServiceSupportList,
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

const handleRowClick = async (row) => {
  await fetchFileImages(row.seq);
};

// 상태 변화 감지
watch(
  () => eventStore.isTriggered,
  (v) => {
    if (v) {
      init();
      eventStore.resetEvent();
    }
  },
);

onMounted(() => {
  init();
});
</script>

<template>
  <UiDataTable
    :loading="loading"
    :columns="COLUMNS"
    :items="items"
    :hover="false"
    collapsed
    :row-clickable="true"
    @row-click="
      ({ row }) => {
        handleRowClick(row);
      }
    "
  >
    <template #row-collapsed="{ item }">
      <UiGridTable :fields="COLLAPSED_FIELDS">
        <template #value-reqMatters>
          <pre>{{ item.reqMatters }}</pre>
        </template>
        <template #value-procEr>{{ item.procEr }} </template>
        <template #value-procDate>{{ item.procDate }} </template>
        <template #value-procCondNm>{{ item.procCondNm }}</template>
        <template #value-passEr>{{ item.passEr }}</template>
        <template #value-passDate>{{ item.passDate }}</template>
        <template #value-procWay>
          <pre>{{ item.procWay }}</pre>
        </template>
        <template #value-passWay>
          <pre>{{ item.passWay }}</pre>
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
    :total="total"
    :show-size-select="false"
    :edge-count="4"
    :mid-count="3"
    @change="onPageChanged"
  />
</template>

<style scoped></style>
