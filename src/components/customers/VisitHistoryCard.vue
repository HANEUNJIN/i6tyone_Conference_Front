<script setup>
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useBaseStore } from '@/stores/base';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { useApiToast } from '@/composables/useApiToast';
import { useToast } from '@/composables/useToast';
import titleIcon from '@/assets/images/common/title-icon.png';
import UiDataTable from '@/components/ui/UiDataTable.vue';
import UiGridTable from '@/components/ui/UiGridTable.vue';
import UiPagination from '@/components/ui/UiPagination.vue';

import { usePaginatedQueryList } from '@/composables/usePaginatedQueryList';
import { SalesAPI } from '@/api/temp/sales';

// 테이블 헤더 정의
const COLUMNS = [
  { key: 'totNo', label: '순번', width: '5%' },
  { key: 'visitYmd', label: '날짜', width: '14%' },
  { key: 'visitTypeNm', label: '방문타입', width: '10%' },
  { key: 'userNm', label: '방문자', width: '15%' },
  { key: 'content', label: '내용', width: 'auto', align: 'left' },
  { key: 'spcNote', label: '특이사항', width: 'auto', align: 'left' },
];
const COLLAPSED_FIELDS = [
  {
    label1: '내용',
    key: 'content',
    colspan: true,
  },

  {
    label1: '특이사항',
    key: 'spcNote',
    colspan: true,
  },
];

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

// ----------------------
//  ✨ methods / functions/
// ----------------------

const fetchVisitList = async () => {
  const params = {
    licenseCd: storeLicenseCd.value,
    pageNum: page.value,
    pageSize: size.value,
  };
  try {
    const res = await SalesAPI.getVisitList(params);
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

// usePaginatedQueryList 훅
const { loading, items, total, page, size, init, onPageChanged } = usePaginatedQueryList(
  fetchVisitList,
  {
    defaultKeyword: '',
    defaultSize: 5,
    disableUrlSync: true,
  },
);

onMounted(() => init());
</script>

<template>
  <CCard>
    <CCardHeader>
      <h6 class="d-flex align-content-center gap-1 mb-0">
        <CImage :src="titleIcon" width="20" /> <span>방문내역</span>
      </h6>
    </CCardHeader>
    <CCardBody>
      <UiDataTable
        :loading="loading"
        :columns="COLUMNS"
        :items="items"
        :hover="false"
        collapsed
        :row-clickable="true"
      >
        <template #row-collapsed="{ item }">
          <UiGridTable :fields="COLLAPSED_FIELDS">
            <template #value-content>
              <pre>{{ item.content }}</pre>
            </template>
            <template #value-spcNote>
              <pre>{{ item.spcNote }}</pre>
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
    </CCardBody>
  </CCard>
</template>
