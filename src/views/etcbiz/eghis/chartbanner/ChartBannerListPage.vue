<script setup>
import { nextTick, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';
import { useApiToast } from '@/composables/useApiToast';
import { usePaginatedQueryList } from '@/composables/usePaginatedQueryList';
import { CFormSelect } from '@coreui/vue';
import { CommonAPI } from '@/api/temp/common';
import { useBaseStore } from '@/stores/base';
import { EtcbizAPI } from '@/api/temp/etcbiz';
import {
  datepickerFixed,
  formatPhoneKR,
  formatYmd,
  getTodayYmd,
  toYmdCompact,
} from '@/utils/common';
import Datepicker from '@vuepic/vue-datepicker';
import { ROUTE } from '@/constants/routeName';
import { useExcelDownload } from '@/composables/useExcelDownload';

import UiSearchBar from '@/components/ui/UiSearchBar.vue';
import UiDataTable from '@/components/ui/UiDataTable.vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import { EtcbizCommon } from '@/api/temp/etcbizCommon';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const base = useBaseStore();
const toast = useToast();
const toastApi = useApiToast();
const { downloadExcel } = useExcelDownload();

const PROC_TYPE = 'homepage';

const branchOptions = ref([]); // 대리점 옵션
const procSetYnOptions = ref([
  // 진행상태 옵션
  { codeId: '', codeNm: '진행상태' },
  { codeId: 'R', codeNm: '신청' },
  { codeId: 'I', codeNm: '진행' },
  { codeId: 'E', codeNm: '완료' },
  { codeId: 'H', codeNm: '보류' },
]);
const procFinalYnOptions = ref([
  // 계약상태 옵션
  { codeId: '', codeNm: '계약상태' },
  { codeId: 'N', codeNm: '미완료' },
  { codeId: 'Y', codeNm: '완료' },
]);
const procCodeOptions = ref([]); // procCode 옵션
const optionsLoading = ref(false); // 옵션 로딩 상태

const branch = ref(auth.userInfo.branch === '00' ? '' : auth.userInfo.branch); // 대리점
const procCode = ref('Eghis2');
const dateFrom = ref('2021-01-01');
const dateTo = ref(getTodayYmd());
const procAccYn = ref('1');
const procSetYn = ref(''); // 진행상태
const procFinalYn = ref('');
const excelTitle = ref('');

// 테이블 헤더 정의
const COLUMNS = [
  { key: 'totNo', label: '순번', width: '2%' },
  { key: 'corpNm', label: '대리점', width: '5%' },
  { key: 'hospNm', label: '병원명', width: '8%', align: 'left' },
  { key: 'addr', label: '주소', width: '19%', align: 'left' },
  { key: 'deptNm', label: '진료과', width: '4%' },
  { key: 'telNo', label: '전화번호', width: '4%' },
  { key: 'capNm', label: '대표자', width: '3%' },
  { key: 'entYmd', label: '신청일', width: '5%' },
  { key: 'procSetYnNm', label: '진행상태 ', width: '3%' },
  { key: 'procFinalYn', label: '계약완료', width: '3%' },
];

async function fetchSearchOptions() {
  optionsLoading.value = true;
  try {
    // 대리점 옵션
    const branchRes = await CommonAPI.getBranchCorp({
      bonsaFlag: '',
      menuType: base.storeMenuType,
    });
    if (!branchRes.ok) {
      toastApi.errorFromResult(branchRes);
    }
    const branchList = branchRes.data?.resultData?.list ?? [];
    branchOptions.value = [{ codeId: '', codeNm: '대리점' }, ...branchList];

    // proc 타입
    const procTypeRes = await EtcbizCommon.getProcCodeList({
      procType: PROC_TYPE,
      menuType: base.storeMenuType,
    });
    if (!procTypeRes.ok) {
      toastApi.errorFromResult(procTypeRes);
    }
    const procTypeList = procTypeRes.data?.resultData?.list ?? [];
    procCodeOptions.value = procTypeList;
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  } finally {
    optionsLoading.value = false;
  }
}

// usePaginatedQueryList 훅
const { loading, items, total, page, size, keyword, init, onSearch, onReset, onPageChanged } =
  usePaginatedQueryList(fetchList, {
    defaultKeyword: '',
    searchPushHistory: true,
    queryKeys: { page: 'page', size: 'size', keyword: 'keyword' },
    extra: { branch, procSetYn, procFinalYn, procCode, dateFrom, dateTo },
    autoSearchOnExtraChange: true,
    autoSearchExclude: ['dateFrom', 'dateTo'],
  });

async function fetchList({
  page,
  size,
  keyword,
  branch,
  procSetYn,
  procFinalYn,
  procCode,
  dateFrom,
  dateTo,
}) {
  const params = {
    procCode: procCode,
    dateFrom: toYmdCompact(dateFrom),
    dateTo: toYmdCompact(dateTo),
    autho: '1', //권한 작업 필요
    branch: branch,
    keyword: keyword,
    procAccYn: procAccYn.value,
    procSetYn: procSetYn,
    procFinalYn: procFinalYn,
    pageNum: page,
    pageSize: size,
  };
  try {
    const res = await EtcbizAPI.getChartBannerList(params);
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

// 상세 페이지 이동
function goDetail(item) {
  router.push({
    name: ROUTE.Etcbiz.ChartBanner.Detail,
    query: { ...route.query, licenseCd: item.licenseCd, procCode: procCode.value },
  });
}

// 엑셀
async function excelDownload() {
  if (formatYmd(dateTo.value) < formatYmd(dateFrom.value))
    return toast.error('조회 날짜가 잘못 입력되었습니다.');
  excelTitle.value = procCodeOptions.value.find((opt) => opt.codeId === procCode.value)?.codeNm;
  const params = {
    procCode: procCode.value,
    dateFrom: toYmdCompact(dateFrom.value),
    dateTo: toYmdCompact(dateTo.value),
    autho: '1', //권한 작업 필요
    branch: branch.value,
    keyword: keyword.value,
    procSetYn: procSetYn.value,
    procFinalYn: procFinalYn.value,
    title: excelTitle.value,
    procType: PROC_TYPE,
  };

  const excelRes = await EtcbizAPI.getChartBannerExcel(params);
  const fileName = `${excelTitle.value} 신청내역`;
  downloadExcel(excelRes, fileName);
}

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
        placeholder="병원명,원장,전화번호"
        @submit="onSearch"
        @reset="onReset"
      >
        <template #extra-front>
          <div class="d-flex flex-row align-items-center gap-1">
            <Datepicker
              v-model="dateFrom"
              v-bind="datepickerFixed"
              locale="ko"
              :clearable="false"
              style="width: 140px"
              :ui="{ input: 'form-control form-control-sm' }"
            />
            <span>~</span>
            <Datepicker
              v-model="dateTo"
              v-bind="datepickerFixed"
              locale="ko"
              :clearable="false"
              style="width: 140px"
              :ui="{ input: 'form-control form-control-sm' }"
            />
          </div>
        </template>
        <template #extra-back>
          <CFormSelect v-model="branch" size="sm" style="width: auto">
            <option v-for="opt in branchOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
          <CFormSelect v-model="procSetYn" size="sm" style="width: 120px">
            <option v-for="opt in procSetYnOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
          <CFormSelect v-model="procFinalYn" size="sm" style="width: 120px">
            <option v-for="opt in procFinalYnOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
          <CFormSelect v-model="procCode" size="sm" style="width: auto">
            <option v-for="opt in procCodeOptions" :key="opt.codeId" :value="opt.codeId">
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
        <template #cell-entYmd="{ item }">
          {{ formatYmd(item?.entYmd) }}
        </template>

        <template #cell-telNo="{ item }">
          {{ formatPhoneKR(item?.telNo) }}
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

<style scoped></style>
