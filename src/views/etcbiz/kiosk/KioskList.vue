<script setup>
import { datepickerFixed, formatYmd, getTodayYmd, toYmdCompact } from '@/utils/common';
import UiDataTable from '@/components/ui/UiDataTable.vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import UiSearchBar from '@/components/ui/UiSearchBar.vue';
import { CFormSelect } from '@coreui/vue';
import Datepicker from '@vuepic/vue-datepicker';
import { nextTick, onMounted, ref } from 'vue';
import { CommonAPI } from '@/api/temp/common';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useBaseStore } from '@/stores/base';
import { useToast } from '@/composables/useToast';
import { useApiToast } from '@/composables/useApiToast';
import { usePaginatedQueryList } from '@/composables/usePaginatedQueryList';
import { useExcelDownload } from '@/composables/useExcelDownload';
import { KioskAPI } from '@/api/kiosk';
import { left } from '@popperjs/core';
import { ROUTE } from '@/constants';
import { useFileActions } from '@/composables/useFileActions';

// ----------------------
// ✨ composable / store
// ----------------------
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const base = useBaseStore();
const toast = useToast();
const toastApi = useApiToast();
const { handleFile } = useFileActions();
const { downloadExcel } = useExcelDownload();

// ----------------------
// ✨ reactive state
// ----------------------
const optionsLoading = ref(false);
const dateFrom = ref('2023-01-01');
const dateTo = ref(getTodayYmd());

const branchOptions = ref([]);
const branch = ref(auth.userInfo.branch === '00' ? '' : auth.userInfo.branch);

const COLUMNS = [
  { key: 'pdfUrl', label: '계약서', width: '2%' },
  { key: 'totNo', label: '순번', width: '2%' },
  { key: 'reportNo', label: '영업번호', width: '2%' },
  { key: 'completeDt', label: '계약 완료일', width: '4%' },
  { key: 'licenseCdView', label: '라이선스', width: '4%' },
  { key: 'hospNm', label: '병원명', width: '7%', align: left },
  { key: 'branchNm', label: '지역', width: '4%' },
  { key: 'corpNm', label: '대리점', width: '5%' },
  { key: 'serviceUserNm', label: '유지보수담당자', width: '4%' },
  { key: 'hello100Yn', label: '헬로100사용', width: '3%' },
  { key: 'mainDoctorNm', label: '원장명', width: '4%' },
  { key: 'businessNo', label: '원장번호', width: '4%' },
  { key: 'reqYn', label: '홈페이지주문', width: '3%' },
  { key: 'cnt', label: '설치수량(키/프/하/점)', width: '6%' },
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
    procCode: 'MedicalMachine',
    dateFrom: toYmdCompact(dateFrom.value),
    dateTo: toYmdCompact(dateTo.value),
    autho: '1',
    branch: branch,
    BranchEtc: '',
    keyword: keyword,
    pageNum: page,
    pageSize: size,
    menuType: base.storeMenuType,
  };

  try {
    const res = await KioskAPI.getList(params);
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
    procCode: 'MedicalMachine',
    dateFrom: toYmdCompact(dateFrom.value),
    dateTo: toYmdCompact(dateTo.value),
    autho: '1',
    branch: branch.value,
    BranchEtc: '',
    keyword: keyword.value,
    menuType: base.storeMenuType,
  };

  const excelRes = await KioskAPI.getExcel(params);
  const fileName = 'kiosk';
  downloadExcel(excelRes, fileName);
};

const fileOpen = (pdfUrl) => {
  handleFile(pdfUrl, {
    fileName: '',
    confirmTitle: '',
    confirmMessage: 'pdf 파일을 여시겠습니까?',
  });
};

const goDetail = (item) => {
  const routeName =
    base.storeMenuType === 'E' ? ROUTE.Etcbiz.Kiosk.Detail : ROUTE.NixEtcbiz.Kiosk.Detail;

  router.push({
    name: routeName,
    query: { ...route.query, licenseCd: item.licenseCd, menuType: base.storeMenuType },
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
        <template #cell-pdfUrl="{ item }">
          <CButton color="success" size="sm" type="button" @click.stop="fileOpen(item.pdfUrl)">
            <CIcon name="cil-file" />
          </CButton>
        </template>

        <template #cell-completeDt="{ item }">
          {{ formatYmd(item.completeDt) }}
        </template>

        <template #cell-cnt="{ item }">
          {{ item.kioskCnt }} / {{ item.prCnt }} / {{ item.buCnt }} / {{ item.keyPadCnt }}
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
