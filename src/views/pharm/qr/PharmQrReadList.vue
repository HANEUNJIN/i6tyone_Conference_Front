<script setup>
import { datepickerFixed, formatMoney, formatPhoneKR, formatYmd, toYmdCompact } from '@/utils/common';
import Datepicker from '@vuepic/vue-datepicker';
import UiDataTable from '@/components/ui/UiDataTable.vue';
import UiSearchBar from '@/components/ui/UiSearchBar.vue';
import { CFormSelect } from '@coreui/vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useBaseStore } from '@/stores/base';
import { useToast } from '@/composables/useToast';
import { useApiToast } from '@/composables/useApiToast';
import { useExcelDownload } from '@/composables/useExcelDownload';
import { usePaginatedQueryList } from '@/composables/usePaginatedQueryList';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { PharmAPI } from '@/api/temp/pharm';
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
const modal = useConfirmModal();
const { downloadExcel } = useExcelDownload();

// ----------------------
// ✨ reactive state
// ----------------------
const optionsLoading = ref(false);
const dateFrom = ref('2025-10-01');
const dateTo = ref('2025-10-31');

const expYmdYn = ref('');
const expYmdYnOptions = ref([
  { codeId: '', codeNm: '만료약국 포함' },
  { codeId: 'N', codeNm: '만료약국 미포함' },
  { codeId: 'Y', codeNm: '만료약국' },
]);

const COLUMNS = [
  { key: 'totNo', label: '순번', width: '4%' },
  { key: 'pharmNm', label: '약국명', width: '10%', align: left },
  { key: 'userNm', label: '약사명', width: '5%' },
  { key: 'userPhoneNo', label: '약국장 핸드폰번호', width: '5%' },
  { key: 'phoneNo', label: '약국 전화번호', width: '5%' },
  { key: 'programStatus', label: '사용현황', width: '4%' },
  { key: 'prodNm', label: 'QR상품명', width: '7%', align: left },
  { key: 'qrCnt', label: 'QR사용건수', width: '6%', align: right },
  { key: 'programAmt', label: '이지스팜요금', width: '7%', align: right },
  { key: 'accounting', label: 'QR요금', width: '5%', align: right },
  { key: 'sumAmt', label: '합계요금', width: '5%', align: right },
  { key: 'expYmd', label: '만료일', width: '5%' },
];

const fetchList = async ({ page, keyword }) => {
  if (formatYmd(dateTo.value) < formatYmd(dateFrom.value))
    return toast.error('조회 날짜가 잘못 입력되었습니다.');

  const params = {
    dateFrom: toYmdCompact(dateFrom.value),
    dateTo: toYmdCompact(dateTo.value),
    keyword: keyword,
    pageNum: page,
    expYmdYn: expYmdYn.value,
  };

  try {
    const res = await PharmAPI.getReadInfoList(params);
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
    extra: { expYmdYn },
    autoSearchOnExtraChange: true,
  });

const excelDownload = async () => {
  const params = {
    dateFrom: toYmdCompact(dateFrom.value),
    dateTo: toYmdCompact(dateTo.value),
    keyword: keyword.value,
    expYmdYn: expYmdYn.value,
  };

  const excelRes = await PharmAPI.getReadInfoExcel(params);
  const fileName = '상품사용현황';
  downloadExcel(excelRes, fileName);
};

const goDetail = (item) => {
  router.push({
    name: ROUTE.Pharm.PharmQrRead.Detail,
    query: {
      ...route.query,
      licenseCd: item.licenseCd,
      dateFrom: toYmdCompact(dateFrom.value),
      dateTo: toYmdCompact(dateTo.value),
      keyword: keyword.value,
      pharmNm: item.pharmNm,
      pageNum: page.value,
    },
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
        placeholder="약국명,약사명"
        @submit="onSearch"
      >
        <template #extra-front>
          <div class="d-flex flex-row align-items-center gap-1">
            <Datepicker
              v-model="dateFrom"
              v-bind="datepickerFixed"
              locale="ko"
              style="width: 140px"
              :clearable="false"
              :ui="{ input: 'form-control form-control-sm' }"
            />
            <span>~</span>
            <Datepicker
              v-model="dateTo"
              v-bind="datepickerFixed"
              locale="ko"
              style="width: 140px"
              :clearable="false"
              :ui="{ input: 'form-control form-control-sm' }"
            />
          </div>

          <!--만료약국-->
          <CFormSelect v-model="expYmdYn" size="sm" style="width: auto">
            <option v-for="opt in expYmdYnOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
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
        <!-- 약국장 핸드폰번호 -->
        <template #cell-userPhoneNo="{ item }">
          {{ formatPhoneKR(item?.userPhoneNo) }}
        </template>

        <!-- 약국 전화번호 -->
        <template #cell-phoneNo="{ item }">
          {{ formatPhoneKR(item?.phoneNo) }}
        </template>

        <!-- 이지스팜요금 -->
        <template #cell-programAmt="{ item }">
          {{ formatMoney(item?.programAmt) }}
        </template>

        <!-- QR요금 -->
        <template #cell-accounting="{ item }">
          {{ formatMoney(item?.accounting) }}
        </template>

        <!-- 합계요금 -->
        <template #cell-sumAmt="{ item }">
          {{ formatMoney(item?.sumAmt) }}
        </template>

        <!-- 만료일 -->
        <template #cell-expYmd="{ item }">
          {{ formatYmd(item?.expYmd) }}
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
