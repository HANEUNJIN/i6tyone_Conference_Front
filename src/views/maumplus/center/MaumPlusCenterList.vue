<script setup>
import { datepickerFixed, formatYmd, getTodayYmd, toYmdCompact } from '@/utils/common';
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
import { MaumPlusAPI } from '@/api/maumPlus';
import { ROUTE } from '@/constants';
import { useExcelDownload } from '@/composables/useExcelDownload';

// ----------------------
// ✨ composable / store
// ----------------------
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const base = useBaseStore();
const toast = useToast();
const toastApi = useApiToast();
const { downloadExcel } = useExcelDownload();

// ----------------------
// ✨ reactive state
// ----------------------
const optionsLoading = ref(false);
const dateFrom = ref('2023-09-01');
const dateTo = ref(getTodayYmd());

const COLUMNS = [
  { key: 'totNo', label: '순번', width: '4%' },
  { key: 'clifyYn', label: 'Clify 가맹', width: '5%' },
  { key: 'centerNm', label: '센터명', width: '16%', align: 'left' },
  { key: 'repNm', label: '대표자', width: '5%' },
  { key: 'addrHd', label: '주소', width: '22%', align: 'left' },
  { key: 'repPhone', label: '핸드폰', width: '8%' },
  { key: 'domain', label: '도메인', width: '7%' },
  { key: 'onePersonYn', label: '1인센터', width: '4%' },
  { key: 'centerSeq', label: '센터코드', width: '6%' },
  { key: 'expireYmd', label: '해지일', width: '5%' },
  { key: 'regDt', label: '생성일', width: '8%' },
];

const fetchList = async ({ page, keyword }) => {
  const params = {
    procCode: 'MaumPlus',
    dateFrom: toYmdCompact(dateFrom.value),
    dateTo: toYmdCompact(dateTo.value),
    keyword: keyword,
    pageNum: page,
    pageSize: 15,
  };

  try {
    const res = await MaumPlusAPI.getCenterList(params);
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

const excelDownload = async () => {
  const params = {
    dateFrom: toYmdCompact(dateFrom.value),
    dateTo: toYmdCompact(dateTo.value),
    keyword: keyword.value,
  };

  const excelRes = await MaumPlusAPI.getCenterExcel(params);
  const fileName = '마음플러스센터정보';
  downloadExcel(excelRes, fileName);
};

const goDetail = (item) => {
  router.push({
    name: ROUTE.Maumplus.MaumPlusCenter.Detail,
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
        placeholder="센터명,대표자,주소,연락처"
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
        <template #extra-btn>
          <CButton color="success" size="sm" type="button" @click="excelDownload">엑셀</CButton>
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
        <!--Clify 가맹-->
        <template #cell-birthday="{ item }">
          <div v-if="item.birthday === 'clify'">O</div>
          <div v-else></div>
        </template>

        <!--1인센터-->
        <template #cell-onePersonYn="{ item }">
          <div v-if="item.onePersonYn === 'Y'">O</div>
          <div v-else></div>
        </template>

        <!-- 해지일 -->
        <template #cell-expireYmd="{ item }">
          {{ formatYmd(item.expireYmd) }}
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
