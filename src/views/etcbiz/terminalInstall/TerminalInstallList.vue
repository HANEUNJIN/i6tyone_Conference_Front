<script setup>
import { datepickerFixed, formatYmd, getTodayYmd, toYmdCompact } from '@/utils/common';
import Datepicker from '@vuepic/vue-datepicker';
import UiDataTable from '@/components/ui/UiDataTable.vue';
import UiSearchBar from '@/components/ui/UiSearchBar.vue';
import { CFormSelect } from '@coreui/vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import { nextTick, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useBaseStore } from '@/stores/base';
import { useToast } from '@/composables/useToast';
import { useApiToast } from '@/composables/useApiToast';
import { CommonAPI } from '@/api/temp/common';
import { useExcelDownload } from '@/composables/useExcelDownload';
import { usePaginatedQueryList } from '@/composables/usePaginatedQueryList';
import { TerminalInstallAPI } from '@/api/temp/terminalInstall';
import { ROUTE } from '@/constants/routeName';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const base = useBaseStore();
const toast = useToast();
const toastApi = useApiToast();
const { downloadExcel } = useExcelDownload();

const optionsLoading = ref(false);

const dateFrom = ref('2023-01-01');
const dateTo = ref(getTodayYmd());

const branchOptions = ref([]);
const branch = ref(auth.userInfo.branch === '00' ? '' : auth.userInfo.branch);

const COLUMNS = [
  { key: 'totNo', label: '순번', width: '2%' },
  { key: 'regDt', label: '접수일', width: '4%' },
  { key: 'reportNo', label: '영업번호', width: '2%' },
  { key: 'licenseCd', label: '라이선스', width: '4%' },
  { key: 'vanCdNm', label: '단말기업체', width: '4%' },
  { key: 'hospNm', label: '병원명', width: '7%', align: 'left' },
  { key: 'branchNm', label: '지역', width: '4%' },
  { key: 'corpNm', label: '대리점', width: '4%' },
  { key: 'contractUserNm', label: '계약담당자', width: '4%' },
  { key: 'vanStepCdNm', label: '계약현황', width: '4%' },
  { key: 'signYmd', label: '계약일', width: '4%' },
  { key: 'insStepCdNm', label: '설치현황', width: '4%' },
  { key: 'insEndYmd', label: '설치일', width: '6%' },
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
    autho: '1',
    BranchEtc: '',
    dateFrom: toYmdCompact(dateFrom.value),
    dateTo: toYmdCompact(dateTo.value),
    branch: branch,
    keyword: keyword,
    pageNum: page,
    pageSize: size,
    menuType: base.storeMenuType,
  };

  try {
    const res = await TerminalInstallAPI.getList(params);
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
    extra: { branch },
    autoSearchOnExtraChange: true,
  });

const excelDownload = async () => {
  if (formatYmd(dateTo.value) < formatYmd(dateFrom.value))
    return toast.error('조회 날짜가 잘못 입력되었습니다.');

  const params = {
    autho: '1',
    BranchEtc: '',
    dateFrom: toYmdCompact(dateFrom.value),
    dateTo: toYmdCompact(dateTo.value),
    branch: branch.value,
    keyword: keyword.value,
    menuType: base.storeMenuType,
  };

  const excelRes = await TerminalInstallAPI.getExcel(params);
  const fileName = '단말기설치현황';
  downloadExcel(excelRes, fileName);
};

const goDetail = (item) => {
  const routeName =
    base.storeMenuType === 'E'
      ? ROUTE.Etcbiz.TerminalInstall.Detail
      : ROUTE.NixEtcbiz.TerminalInstall.Detail;

  router.push({
    name: routeName,
    query: { ...route.query, contractNo: item.contractNo, licenseCd: item.licenseCd },
  });
};

onMounted(() => {
  fetchSearchOptions();
  init();
});

watch(
  () => base.storeMenuType,
  () => {
    init();
  },
);
</script>

<template>
  <!-- 검색 -->
  <CCard class="mb-3">
    <CCardBody>
      <UiSearchBar
        v-model="keyword"
        :loading="loading"
        :show-reset="false"
        placeholder="병원명,원장,전화번호"
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
        <template #cell-signYmd="{ item }">
          {{ formatYmd(item?.signYmd) }}
        </template>

        <template #cell-insEndYmd="{ item }">
          {{ formatYmd(item?.insEndYmd) }}
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
