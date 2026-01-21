<script setup>
import { formatMoney } from '@/utils/common';
import UiDataTable from '@/components/ui/UiDataTable.vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import UiSearchBar from '@/components/ui/UiSearchBar.vue';
import { CFormSelect } from '@coreui/vue';
import { onMounted, ref } from 'vue';
import { CommonAPI } from '@/api/temp/common';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useBaseStore } from '@/stores/base';
import { useToast } from '@/composables/useToast';
import { useApiToast } from '@/composables/useApiToast';
import { usePaginatedQueryList } from '@/composables/usePaginatedQueryList';
import { ROUTE } from '@/constants';
import { PharmAPI } from '@/api/temp/pharm';

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
const optionsLoading = ref(false);
const prodCd = ref('');
const prodCdOptions = ref([]);

const COLUMNS = [
  { key: 'totNo', label: '순번', width: '5%' },
  { key: 'prodCd', label: '상품타입', width: '7%' },
  { key: 'prodNm', label: '상품명', width: '20%', align: 'left' },
  { key: 'prodAmt', label: '상품가격', width: '7%', align: 'right' },
  { key: 'maxCnt', label: '건수', width: '7%', align: 'right' },
  { key: 'unitAmt', label: '건당가격', width: '7%', align: 'right' },
  { key: 'statusYnNm', label: '상태', width: '7%' },
  { key: 'regDt', label: '등록일', width: '7%' },
];

const fetchSearchOptions = async () => {
  optionsLoading.value = true;

  try {
    const prodCdRes = await CommonAPI.getCodePharmList('02');
    if (!prodCdRes.ok) {
      toastApi.errorFromResult(prodCdRes);
    }
    const prodCdList = prodCdRes.data?.resultData?.list ?? [];
    prodCdOptions.value = [...prodCdList];
  } catch (e) {
    toastApi.errorFromException(e);
  } finally {
    optionsLoading.value = false;
  }
};

const fetchList = async ({ page, keyword }) => {
  try {
    const params = {
      keyword: keyword,
      pageNum: page,
      prodType: prodCd.value,
    };

    const res = await PharmAPI.getProdList(params);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return { items: [], total: 0 };
    }

    const list = res.data?.resultData?.list ?? [];
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
    extra: { prodCd },
    autoSearchOnExtraChange: true,
  });

const goDetail = (item) => {
  router.push({
    name: ROUTE.Pharm.PharmProd.Detail,
    query: { ...route.query, prodId: item.prodId },
  });
};

onMounted(() => {
  fetchSearchOptions();
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
        <template #extra-back>
          <CFormSelect v-model="prodCd" size="sm" style="width: auto">
            <option v-for="opt in prodCdOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
        </template>

        <template #extra-btn>
          <CButton color="dark" size="sm" type="button"
                   @click="() => router.push({ name: ROUTE.Pharm.PharmProd.Create })">등록
          </CButton>
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
        <template #cell-prodAmt="{ item }">
          {{ formatMoney(item.prodAmt) }}
        </template>

        <template #cell-maxCnt="{ item }">
          {{ formatMoney(item.maxCnt) }}
        </template>

        <template #cell-unitAmt="{ item }">
          {{ formatMoney(item.unitAmt) }}
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
