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
import { useExcelDownload } from '@/composables/useExcelDownload';
import { usePaginatedQueryList } from '@/composables/usePaginatedQueryList';
import { HelloMediaAPI } from '@/api/helloMedia';
import { ROUTE } from '@/constants/routeName';

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

const dateFrom = ref('2021-01-01');
const dateTo = ref(getTodayYmd());

const helloMediaYn = ref('');
const procType = ref('');
const procAccYn = ref('');
const procAccStep = ref('');
const procSetYn = ref('');
const reviewSt = ref('');
const branchEtc = ref('');
const procTrsYn = ref('');

const branchOptions = ref([]);
const branch = ref(auth.userInfo.branch === '00' ? '' : auth.userInfo.branch);

const branchEtcOptions = ref([
  { codeId: '', codeNm: '타대리점' },
  { codeId: '1', codeNm: '이원의료재단' },
  { codeId: '2', codeNm: '녹십자' },
  { codeId: '3', codeNm: '씨젠' },
  { codeId: '4', codeNm: '아름누리' },
]);
const procTypeOptions = ref([
  { codeId: '', codeNm: '가입형태(라이선스)' },
  { codeId: 'HelloMedia', codeNm: '가입자' },
  { codeId: 'HelloMediaTmp', codeNm: '미가입자' },
]);
const helloMediaYnOptions = ref([
  { codeId: '', codeNm: '연동현황' },
  { codeId: 'Y', codeNm: '완료' },
  { codeId: 'N', codeNm: '미완료' },
]);
const procTrsYnOptions = ref([
  { codeId: '', codeNm: '신청현황' },
  { codeId: '1', codeNm: '신청' },
  { codeId: '2', codeNm: '접수확인' },
  { codeId: '3', codeNm: '접수완료' },
  { codeId: '4', codeNm: '신청취소' },
]);
const procAccStepOptions = ref([
  { codeId: '', codeNm: '배송현황' },
  { codeId: '1', codeNm: '배송계획 중' },
  { codeId: '2', codeNm: '배송계획 완료' },
  { codeId: '3', codeNm: '배송계획 확정' },
]);
const procSetYnOptions = ref([
  { codeId: '', codeNm: '설치현황' },
  { codeId: '1', codeNm: '설치일자확정' },
  { codeId: '2', codeNm: '설치완료' },
]);
const reviewStOptions = ref([
  { codeId: '', codeNm: '만족도조사' },
  { codeId: '1', codeNm: '조사전' },
  { codeId: '2', codeNm: '조사완료' },
]);

const COLUMNS = [
  { key: 'totNo', label: '순번', width: '3%' },
  { key: 'corpNm', label: '대리점', width: '7%' },
  { key: 'procType', label: '가입형태(라이선스)', width: '7%' },
  { key: 'hello100UseYn', label: '헬로100', width: '7%' },
  { key: 'hospNm', label: '병원명', width: '12%', align: 'left' },
  { key: 'regDt', label: '등록일', width: '7%' },
  { key: 'deptNm', label: '진료과', width: '7%' },
  { key: 'capNm', label: '대표자명', width: '6%' },
  { key: 'telNo', label: '대표번호', width: '6%' },
  { key: 'helloMediaYnNm', label: '연동현황', width: '6%' },
  { key: 'procTrsYnNm', label: '신청현황', width: '6%' },
  { key: 'procAccStepNm', label: '배송현황', width: '6%' },
  { key: 'procSetYn', label: '설치현황', width: '6%' },
  { key: 'reviewStNm', label: '만족도', width: '6%' },
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

const fetchList = async ({
  page,
  size,
  keyword,
  branch,
  helloMediaYn,
  procType,
  procAccYn,
  procAccStep,
  procSetYn,
  reviewSt,
  branchEtc,
  procTrsYn,
}) => {
  const params = {
    dateFrom: toYmdCompact(dateFrom.value),
    dateTo: toYmdCompact(dateTo.value),
    helloMediaYn: helloMediaYn,
    procType: procType,
    procAccYn: procAccYn,
    procAccStep: procAccStep,
    procSetYn: procSetYn,
    reviewSt: reviewSt,
    autho: '1',
    branch: branch,
    keyword: keyword,
    pageNum: page,
    pageSize: size,
    branchEtc: branchEtc,
    procTrsYn: procTrsYn,
    reqConfirmYn: procTrsYn,
  };

  try {
    const res = await HelloMediaAPI.getList(params);
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
    extra: {
      branch,
      helloMediaYn,
      procType,
      procAccYn,
      procAccStep,
      procSetYn,
      reviewSt,
      branchEtc,
      procTrsYn,
    },
    autoSearchOnExtraChange: true,
  });

const excelDownload = async () => {
  if (formatYmd(dateTo.value) < formatYmd(dateFrom.value))
    return toast.error('조회 날짜가 잘못 입력되었습니다.');

  const params = {
    dateFrom: toYmdCompact(dateFrom.value),
    dateTo: toYmdCompact(dateTo.value),
    helloMediaYn: helloMediaYn.value,
    procType: procType.value,
    procAccYn: procAccYn.value,
    procAccStep: procAccStep.value,
    autho: '1',
    branch: branch.value,
    branchEtc: branchEtc.value,
    keyword: keyword.value,
  };

  const excelRes = await HelloMediaAPI.getExcel(params);
  const fileName = 'HelloMedia';
  downloadExcel(excelRes, fileName);
};

const goDetail = (item) => {
  router.push({
    name: ROUTE.Etcbiz.HelloMedia.Detail,
    query: { ...route.query, licenseCd: item.licenseCd },
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
        placeholder="병원명,대표자,주소,전화번호"
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

          <!--타대리점-->
          <CFormSelect v-model="branchEtc" size="sm" style="width: 120px">
            <option v-for="opt in branchEtcOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>

          <!--가입형태-->
          <CFormSelect v-model="procType" size="sm" style="width: 120px">
            <option v-for="opt in procTypeOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>

          <!--연동현황-->
          <CFormSelect v-model="helloMediaYn" size="sm" style="width: 120px">
            <option v-for="opt in helloMediaYnOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>

          <!--신청현황-->
          <CFormSelect v-model="procTrsYn" size="sm" style="width: 120px">
            <option v-for="opt in procTrsYnOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>

          <!--배송현황-->
          <CFormSelect v-model="procAccStep" size="sm" style="width: 120px">
            <option v-for="opt in procAccStepOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>

          <!--설치현황-->
          <CFormSelect v-model="procSetYn" size="sm" style="width: 120px">
            <option v-for="opt in procSetYnOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>

          <!--만족도조사-->
          <CFormSelect v-model="reviewSt" size="sm" style="width: 120px">
            <option v-for="opt in reviewStOptions" :key="opt.codeId" :value="opt.codeId">
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
        <template #cell-regDt="{ item }">
          {{ item.regDt ? item.regDt.substring(0, 10) : '-' }}
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
