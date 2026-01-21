<script setup>
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { ServiceAPI } from '@/api/temp/service';
import { useBaseStore } from '@/stores/base';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';
import { useApiToast } from '@/composables/useApiToast';
import { usePaginatedQueryList } from '@/composables/usePaginatedQueryList';
import { formatYmd } from '@/utils/common';
import UiSearchBar from '@/components/ui/UiSearchBar.vue';
import UiDataTable from '@/components/ui/UiDataTable.vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import UiGridTable from '@/components/ui/UiGridTable.vue';

// 테이블 헤더 정의
const COLUMNS = [
  { key: 'totNo', label: '순번', width: '4%' },
  { key: 'hospNm', label: '병원명', width: '14%' },
  { key: 'purposeTot', label: '목적', width: '6%' },
  { key: 'reqMatters', label: '문의사항', width: 'auto', align: 'left' },
  { key: 'procEr', label: '처리자', width: '5%' },
  { key: 'procDate', label: '처리일', width: '10%' },
  { key: 'procCondNm', label: '결과', width: '8%' },
  { key: 'passEr', label: '인수자', width: '5%' },
  { key: 'passDate', label: '인수일', width: '10%' },
];

const COLLAPSED_FIELDS = [
  { label1: '문의사항', key: 'reqMatters', colspan: true },
  { label1: 'CS팀처리', key: 'procWay', colspan: true },
];
// ----------------------
//  ✨composable / store
// ----------------------
const route = useRoute();
const auth = useAuthStore();
const base = useBaseStore();
const { storeMenuType } = storeToRefs(base);
const toastApi = useApiToast();
const toast = useToast();
// ----------------------
//  ✨reactive, ref state
// ----------------------

// ----------------------
//  ✨ methods / functions/
// ----------------------
// usePaginatedQueryList 훅
const { loading, items, total, page, size, keyword, init, onSearch, onPageChanged } =
  usePaginatedQueryList(fetchList, {
    defaultKeyword: '',
    searchPushHistory: true,
    queryKeys: { page: 'page', size: 'size', keyword: 'keyword' },
  });

async function fetchList({ page, size, keyword }) {
  const params = {
    keyword: keyword,
    pageSize: size,
    pageNum: page,
  };

  try {
    const res = await ServiceAPI.getSupportBackupList(params);
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
}

onMounted(() => {
  init();
});
</script>

<template>
  <CCard class="mb-3">
    <CCardBody class="d-flex flex-row align-items-center gap-2 flex-wrap">
      <UiSearchBar
        v-model="keyword"
        :loading="loading"
        :show-reset="false"
        placeholder="검색명"
        @submit="onSearch"
      />
      <p class="mb-0">* 병원검색에 매핑되어 있지 않은 과거 자료 입니다.(엑셀 수기로 남겼던 정보)</p>
    </CCardBody>
  </CCard>

  <!-- 목록 -->
  <CCard class="flex-grow-1">
    <CCardBody>
      <UiDataTable
        collapsed
        :columns="COLUMNS"
        :items="items"
        :loading="loading"
        :row-clickable="true"
        :row-key="(row, idx) => row.totNo ?? idx"
        @row-click="({ row }) => handleRowClick(row)"
      >
        <template #cell-hospNm="{ item }">
          <template v-if="storeMenuType === 'N'">
            {{ item.hospNm ? item.hospNm + ` (${item.areaNm || '-'})` : '[미확인 거래처]' }}
          </template>
          <template v-else>
            {{ item.hospNm }}
          </template>
        </template>
        <template #cell-passDate="{ item }">
          {{ formatYmd(item.passDate) }}
        </template>

        <template #row-collapsed="{ item }">
          <UiGridTable :fields="COLLAPSED_FIELDS">
            <template #value-reqMatters>
              <pre>{{ item.reqMatters || '-' }}</pre>
            </template>
            <template #value-procWay>
              <pre>{{ item.procWay || '-' }}</pre>
            </template>
          </UiGridTable>
        </template>
      </UiDataTable>
      <div v-if="total > 0" class="mt-auto">
        <UiPagination
          v-model:page="page"
          v-model:size="size"
          :edge-count="4"
          :mid-count="3"
          :size-options="[15, 20, 50]"
          :total="total"
          @change="onPageChanged"
        />
      </div>
    </CCardBody>
  </CCard>
</template>
