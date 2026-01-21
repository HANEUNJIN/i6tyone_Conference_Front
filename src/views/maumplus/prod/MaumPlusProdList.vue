<script setup>
import { formatMoney } from '@/utils/common';
import UiSearchBar from '@/components/ui/UiSearchBar.vue';
import UiDataTable from '@/components/ui/UiDataTable.vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import { nextTick, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBaseStore } from '@/stores/base';
import { useApiToast } from '@/composables/useApiToast';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';
import { usePaginatedQueryList } from '@/composables/usePaginatedQueryList';
import { MaumPlusAPI } from '@/api/maumPlus';
import { left, right } from '@popperjs/core';
import { ROUTE } from '@/constants';

// ----------------------
// ✨ composable / store
// ----------------------
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const base = useBaseStore();
const toast = useToast();
const toastApi = useApiToast();

// ----------------------
// ✨ reactive state
// ----------------------
const COLUMNS = [
  { key: 'totNo', label: '순번', width: '5%' },
  { key: 'payType', label: '결제타입', width: '7%' },
  { key: 'prodNm', label: '상품명', width: '20%', align: left },
  { key: 'prodId', label: '상품코드', width: '7%', align: right },
  { key: 'partnerCnt', label: '기본상담사수', width: '7%', align: right },
  { key: 'partnerAddAmt', label: '상담사추가금액', width: '7%', align: right },
  { key: 'prodAmt', label: '상품가격', width: '7%', align: right },
  { key: 'statusYn', label: '상태', width: '7%' },
  { key: 'regDt', label: '등록일', width: '7%' },
];

const fetchList = async ({ page, size, keyword }) => {
  const params = {
    keyword: keyword,
    pageNum: page,
    PageSize: size,
  };

  try {
    const res = await MaumPlusAPI.getProdList(params);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return { items: [], total: 0 };
    }

    const list = res.data?.resultData.list ?? [];
    const total = res.data?.resultData?.totCnt ?? list?.[0]?.totCnt ?? 0;
    return { items: list, total: Number(total) || 0 };
  } catch (e) {
    toastApi.errorFromException(e);
    return { items: [], total: 0 };
  }
};

// usePaginatedQueryList 훅
const { loading, items, total, page, size, keyword, init, onSearch, onPageChanged } =
  usePaginatedQueryList(fetchList, {
    defaultKeyword: '',
    searchPushHistory: true,
    queryKeys: { page: 'page', size: 'size', keyword: 'keyword' },
    autoSearchOnExtraChange: true,
  });

const goDetail = (item) => {
  router.push({
    name: ROUTE.Maumplus.MaumPlusProd.Detail,
    query: { ...route.query, prodId: item.prodId },
  });
};

onMounted(() => {
  init();
});
</script>

<template>
  <!-- 검색 -->
  <CCard class="mb-3">
    <CCardBody>
      <UiSearchBar
        v-model="keyword"
        :loading="loading"
        :show-reset="false"
        placeholder="상품타입,상품명"
        @submit="onSearch"
      >
        <template #extra-btn>
          <CButton color="primary" size="sm" type="button" @click="onSubmit">등록</CButton>
        </template>
      </UiSearchBar>
    </CCardBody>
  </CCard>

  <!-- 목록 -->
  <CCard class="flex-grow-1">
    <CCardBody>
      <UiDataTable
        :columns="COLUMNS"
        :items="items"
        :loading="loading"
        :row-clickable="true"
        :row-key="(row, idx) => row.totNo ?? idx"
        @row-click="({ row }) => goDetail(row)"
      >
        <!-- 결제타입 -->
        <template #cell-payType="{ item }">
          {{ item.payType === 'M' ? '월결제' : '년결제' }}
        </template>

        <!-- 상담사추가금액 -->
        <template #cell-partnerAddAmt="{ item }">
          {{ formatMoney(item.partnerAddAmt) }}
        </template>

        <!-- 상품가격 -->
        <template #cell-prodAmt="{ item }">
          {{ formatMoney(item.prodAmt) }}
        </template>

        <!-- 상태 -->
        <template #cell-statusYn="{ item }">
          {{ item.statusYn === 'Y' ? '사용' : '미사용' }}
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
