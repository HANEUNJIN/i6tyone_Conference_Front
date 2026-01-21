<script setup>
import { datepickerFixed, formatPhoneKR, formatYmd, getTodayYmd, toYmdCompact } from '@/utils/common';
import UiSearchBar from '@/components/ui/UiSearchBar.vue';
import Datepicker from '@vuepic/vue-datepicker';
import UiDataTable from '@/components/ui/UiDataTable.vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import { nextTick, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBaseStore } from '@/stores/base';
import { useApiToast } from '@/composables/useApiToast';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';
import { usePaginatedQueryList } from '@/composables/usePaginatedQueryList';
import { ROUTE } from '@/constants';
import { PharmAPI } from '@/api/temp/pharm';
import { left } from '@popperjs/core';

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
const dateFrom = ref('2021-01-01');
const dateTo = ref(getTodayYmd());

const COLUMNS = [
  { key: 'totNo', label: '순번', width: '4%' },
  { key: 'hospNm', label: '약국명', width: '10%', align: left },
  { key: 'capTelNo', label: '핸드폰', width: '7%' },
  { key: 'etc1', label: '청구프로그램', width: '9%' },
  { key: 'entYmd', label: '신청일', width: '7%' },
  { key: 'procSetYnNm', label: '진행상태', width: '6%' }
];

const fetchList = async ({ page, keyword, size }) => {
  const params = {
    dateFrom: toYmdCompact(dateFrom.value),
    dateTo: toYmdCompact(dateTo.value),
    keyword: keyword,
    pageNum: page,
    pageSize: size,
  };

  try {
    const res = await PharmAPI.getList(params);
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
    autoSearchOnExtraChange: true,
  });

const goDetail = (item) => {
  router.push({
    name: ROUTE.Pharm.PharmJoin.Detail,
    query: { ...route.query, licenseCd: item.licenseCd },
  });
};

onMounted(async () => {
  await nextTick();
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
        placeholder="약국,원장,전화번호"
        @submit="onSearch"
      >
        <template #extra-front>
          <div class="d-flex flex-row align-items-center gap-1">
            <Datepicker
              v-model="dateFrom"
              v-bind="datepickerFixed"
              locale="ko"
              style="width: 140px"
              :ui="{ input: 'form-control form-control-sm' }"
            />
            <span>~</span>
            <Datepicker
              v-model="dateTo"
              v-bind="datepickerFixed"
              locale="ko"
              style="width: 140px"
              :ui="{ input: 'form-control form-control-sm' }"
            />
          </div>
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
        <!--핸드폰-->
        <template #cell-capTelNo="{ item }">
          {{formatPhoneKR(item.capTelNo)}}
        </template>

        <!-- 신청일 -->
        <template #cell-entYmd="{ item }">
          {{ formatYmd(item.entYmd) }}
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
