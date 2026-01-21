<script setup>
import { nextTick, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { useApiToast } from '@/composables/useApiToast';
import { usePaginatedQueryList } from '@/composables/usePaginatedQueryList';
import { useAuthStore } from '@/stores/auth';
import { CFormSelect } from '@coreui/vue';
import { NixEtcbizApi } from '@/api/nixetcbiz';
import { useBaseStore } from '@/stores/base';
import { EtcbizCommon } from '@/api/temp/etcbizCommon';
import { datepickerFixed, formatYmd, getTodayYmd, toYmdCompact } from '@/utils/common';
import Datepicker from '@vuepic/vue-datepicker';
import UiSearchBar from '@/components/ui/UiSearchBar.vue';
import UiDataTable from '@/components/ui/UiDataTable.vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import { useExcelDownload } from '@/composables/useExcelDownload';
import { ROUTE } from '@/constants/routeName';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const toastApi = useApiToast();
const auth = useAuthStore();
const base = useBaseStore();
const { downloadExcel } = useExcelDownload();

const optionsLoading = ref(false);
const PROC_TYPE = 'homepage_nix';

const procOptions = ref([]);
const progressOptions = ref([
  { codeId: '', codeNm: '진행상태' },
  { codeId: 'I', codeNm: '진행' },
  { codeId: 'E', codeNm: '완료' },
  { codeId: 'H', codeNm: '보류' },
]);
const contractOptions = ref([
  { codeId: '', codeNm: '계약여부' },
  { codeId: 'N', codeNm: '미완료' },
  { codeId: 'Y', codeNm: '완료' },
]);

const procCode = ref('Leaflet');
const progressSt = ref('');
const contractYn = ref('');

const branch = ref(auth.userInfo.branch === '00' ? '' : auth.userInfo.branch);
const dateFrom = ref('2021-01-01');
const dateTo = ref(getTodayYmd());
const procAccYn = ref('1');
const procSetYn = ref('');
const procFinalYn = ref('');
const excelTitle = ref('');

const COLUMNS = [
  { key: 'totNo', label: '순번', width: '3%' },
  { key: 'hospNm', label: '병원명', width: '10%', align: 'left' },
  { key: 'addr', label: '주소', width: '20%', align: 'left' },
  { key: 'deptNm', label: '진료과', width: '4%' },
  { key: 'telNo', label: '전화번호', width: '6%' },
  { key: 'capNm', label: '대표자', width: '5%' },
  { key: 'entYmd', label: '신청일', width: '6%' },
  { key: 'procSetYnNm', label: '진행상태 ', width: '4%' },
  { key: 'procFinalYn', label: '계약완료', width: '4%' },
];

const fetchSearchOptions = async () => {
  try {
    optionsLoading.value = true;

    const params = { procType: PROC_TYPE, menuType: base.storeMenuType };
    const procRes = await EtcbizCommon.getProcCodeList(params);
    if (!procRes.ok) {
      toastApi.errorFromResult(procRes);
    }
    procOptions.value = procRes.data?.resultData?.list ?? [];
  } catch (e) {
    toastApi.errorFromException(e);
  } finally {
    optionsLoading.value = false;
  }
};

const fetchList = async ({ page, size, keyword, branch, procSetYn, procFinalYn, procCode }) => {
  const params = {
    procCode: procCode,
    dateFrom: toYmdCompact(dateFrom.value),
    dateTo: toYmdCompact(dateTo.value),
    autho: '1', // 권한 작업 필요
    branch: branch,
    keyword: keyword,
    procAccYn: procAccYn.value,
    procSetYn: procSetYn,
    procFinalYn: procFinalYn,
    pageNum: page,
    pageSize: size,
  };

  try {
    const res = await NixEtcbizApi.getApplicationList(params);
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
    extra: { branch, procSetYn, procFinalYn, procCode },
    autoSearchOnExtraChange: true,
  });

const goDetail = (item) => {
  router.push({
    name: ROUTE.NixEtcbiz.Application.Detail,
    query: { ...route.query, licenseCd: item.licenseCd, procCode: procCode.value },
  });
};

const excelDownload = async () => {
  if (formatYmd(dateTo.value) < formatYmd(dateFrom.value))
    return toast.error('조회 날짜가 잘못 입력되었습니다.');
  excelTitle.value = procOptions.value.find((opt) => opt.codeId === procCode.value)?.codeNm;

  const params = {
    procCode: procCode.value,
    dateFrom: toYmdCompact(dateFrom.value),
    dateTo: toYmdCompact(dateTo.value),
    autho: '1',
    branch: branch.value,
    keyword: keyword.value,
    procSetYn: procSetYn.value,
    procFinalYn: procFinalYn.value,
  };

  const excelRes = await NixEtcbizApi.getApplicationExcel(params);
  const fileName = `${excelTitle.value} 주문신청내역`;
  downloadExcel(excelRes, fileName);
};

onMounted(() => {
  fetchSearchOptions();
  init();
});
</script>

<template>
  <!-- 검색 -->
  <CCard class="mb-2">
    <CCardBody>
      <UiSearchBar
        v-model="keyword"
        placeholder="병원명,원장,전화번호"
        :loading="loading"
        :show-reset="false"
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
          <!--procCode 목록-->
          <CFormSelect v-model="procCode" style="width: 160px" size="sm">
            <option v-for="(opt, idx) in procOptions" :key="idx" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>

          <!--진행상태-->
          <CFormSelect v-model="progressSt" style="width: 120px" size="sm">
            <option v-for="(opt, idx) in progressOptions" :key="idx" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>

          <!--계약여부-->
          <CFormSelect v-model="contractYn" style="width: 120px" size="sm">
            <option v-for="(opt, idx) in contractOptions" :key="idx" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
        </template>

        <template #extra-btn>
          <CButton color="success" size="sm" @click="excelDownload">엑셀 </CButton>
        </template>
      </UiSearchBar>
    </CCardBody>
  </CCard>

  <!-- 목록 -->
  <CCard class="flex-grow-1">
    <CCardBody class="ccard-body">
      <UiDataTable
        :columns="COLUMNS"
        :items="items"
        :loading="loading"
        :row-clickable="true"
        :row-key="(row, idx) => row.totNo ?? idx"
        @row-click="({ row }) => goDetail(row)"
      >
        <template #cell-entYmd="{ item }">
          {{ formatYmd(item?.entYmd) }}
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
