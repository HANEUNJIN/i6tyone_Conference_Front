<script setup>
import { datepickerFixed, formatYmd, getTodayYmd, toYmdCompact } from '@/utils/common';
import Datepicker from '@vuepic/vue-datepicker';
import UiDataTable from '@/components/ui/UiDataTable.vue';
import UiSearchBar from '@/components/ui/UiSearchBar.vue';
import { CFormSelect } from '@coreui/vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import { nextTick, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useBaseStore } from '@/stores/base';
import { useToast } from '@/composables/useToast';
import { useApiToast } from '@/composables/useApiToast';
import { CommonAPI } from '@/api/temp/common';
import { PenChart } from '@/api/temp/penChart';
import { useExcelDownload } from '@/composables/useExcelDownload';
import { usePaginatedQueryList } from '@/composables/usePaginatedQueryList';
import { left } from '@popperjs/core';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const base = useBaseStore();
const toast = useToast();
const toastApi = useApiToast();
const { downloadExcel } = useExcelDownload();

const optionsLoading = ref(false);
const sumInfo = ref([]);

const dateFrom = ref('2021-01-01');
const dateTo = ref(getTodayYmd());

const branchOptions = ref([]);
const branch = ref(auth.userInfo.branch === '00' ? '' : auth.userInfo.branch);

const customersOptions = ref([
  { codeId: '', codeNm: '고객타입' },
  { codeId: 'O', codeNm: '기고객' },
  { codeId: 'N', codeNm: '신규고객' },
]);
const customer = ref();

const COLUMNS = [
  { key: 'totNo', label: '순번', width: '5%' },
  { key: 'branchNm', label: '지역', width: '8%' },
  { key: 'corpNm', label: '대리점', width: '10%' },
  { key: 'hospNm', label: '병원명', width: '20%', align: left },
  { key: 'addYmd', label: '설치일(펜차트)', width: '8%' },
  { key: 'setupYmd', label: '설치일(이지스차트)', width: '8%' },
  { key: 'licenseTypeNm', label: '제품타입', width: '7%' },
  { key: 'ipAddress', label: 'Agent ip', width: '10%' },
  // { key: 'useYn', label: '사용여부', width: '10%' },
  { key: 'cnt', label: '펜차트설치수량', width: '7%' },
];

const fetchSearchOptions = async () => {
  optionsLoading.value = true;

  try {
    const branchRes = await CommonAPI.getBranchCorp({
      bonsaFlag: '',
      menuType: base.storeMenuType,
    });
    if (!branchRes.ok) {
      toastApi.errorFromResult(branchRes);
    }
    const branchList = branchRes.data?.resultData?.list ?? [];
    branchOptions.value = [{ codeId: '', codeNm: '대리점' }, ...branchList];
  } catch (e) {
    toastApi.errorFromException(e);
  } finally {
    optionsLoading.value = false;
  }
};

const fetchList = async ({ page, size, keyword, branch }) => {
  const params = {
    dateFrom: toYmdCompact(dateFrom.value),
    dateTo: toYmdCompact(dateTo.value),
    customerType: customer.value,
    autho: '1',
    branch: branch,
    keyword: keyword,
    pageNum: page,
    pageSize: size,
  };

  try {
    const sumInfoRes = await PenChart.getSumInfo(params);
    if (!sumInfoRes.ok) {
      toastApi.errorFromResult(sumInfoRes);
    }

    sumInfo.value = sumInfoRes.data?.resultData ?? [];

    const res = await PenChart.getList(params);
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
    extra: { branch, customer },
    autoSearchOnExtraChange: true,
  });

const excelDownload = async () => {
  if (formatYmd(dateTo.value) < formatYmd(dateFrom.value))
    return toast.error('조회 날짜가 잘못 입력되었습니다.');

  const params = {
    customerType: customer.value,
    dateFrom: toYmdCompact(dateFrom.value),
    dateTo: toYmdCompact(dateTo.value),
    autho: '1',
    branch: branch.value,
    keyword: keyword.value,
  };

  const excelRes = await PenChart.getExcel(params);
  const fileName = 'PenChart';
  downloadExcel(excelRes, fileName);
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
        placeholder="병원명"
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
        </template>
        <template #extra-back>
          <!--대리점-->
          <CFormSelect v-model="branch" size="sm" style="width: auto">
            <option v-for="opt in branchOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
          <!--고객타입-->
          <CFormSelect v-model="customer" size="sm" style="width: 120px">
            <option v-for="opt in customersOptions" :key="opt.codeId" :value="opt.codeId">
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
      <p class="mb-2" v-if="!loading">
        총 펜차트 설치 수량 : {{ sumInfo.penchartTotCnt }} 개 ( Lite: {{ sumInfo.penchartLite }} 개
        Pro: {{ sumInfo.penchartPro }} 개 )
      </p>

      <UiDataTable :columns="COLUMNS" :items="items" :loading="loading" />

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
