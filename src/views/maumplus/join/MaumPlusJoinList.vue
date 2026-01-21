<script setup>
import { datepickerFixed, getTodayYmd, toYmdCompact } from '@/utils/common';
import UiSearchBar from '@/components/ui/UiSearchBar.vue';
import { CFormSelect } from '@coreui/vue';
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
import { CommonAPI } from '@/api/temp/common';
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
const procAccYn = ref('');
const procSetYn = ref('');
const procFinalCd = ref('');

const COLUMNS = [
  { key: 'totNo', label: '순번', width: '4%' },
  { key: 'birthday', label: 'Clify 가맹', width: '5%' },
  { key: 'centerName', label: '센터명', width: '16%', align: 'left' },
  { key: 'name', label: '신청자', width: '5%' },
  { key: 'roadAddress', label: '주소', width: '22%', align: 'left' },
  { key: 'phone', label: '핸드폰', width: '8%' },
  { key: 'onePersonYn', label: '1인센터', width: '4%' },
  { key: 'procAccYn', label: '피드백', width: '5%' },
  { key: 'procSetYn', label: '진행상태', width: '6%' },
  { key: 'procFinalCdNm', label: '계약상태', width: '6%' },
  { key: 'regDt', label: '신청일', width: '8%' },
];

const procAccYnOptions = ref([
  { codeId: '', codeNm: '피드백' },
  { codeId: 'Y', codeNm: '완료' },
  { codeId: 'N', codeNm: '미완료' },
]);

const procSetYnOptions = ref([
  { codeId: '', codeNm: '진행상태' },
  { codeId: 'R', codeNm: '신청' },
  { codeId: 'I', codeNm: '진행' },
  { codeId: 'E', codeNm: '완료' },
  { codeId: 'H', codeNm: '보류' },
]);

const procFinalCdNmOptions = ref([]);

const fetchSearchOptions = async () => {
  optionsLoading.value = true;

  try {
    //계약상태
    const procFinalCdNmRes = await CommonAPI.getCode('A31');
    if (!procFinalCdNmRes.ok) {
      toastApi.errorFromResult(procFinalCdNmRes);
    }

    const procFinalCdNmList = procFinalCdNmRes.data?.resultData?.list ?? [];
    procFinalCdNmOptions.value = [{ codeId: '', codeNm: '계약상태' }, ...procFinalCdNmList];
  } catch (e) {
    toastApi.errorFromException(e);
  } finally {
    optionsLoading.value = false;
  }
};

const fetchList = async ({ page, keyword }) => {
  const params = {
    dateFrom: toYmdCompact(dateFrom.value),
    dateTo: toYmdCompact(dateTo.value),
    keyword: keyword,
    pageNum: page,
    pageSize: 15,
    procAccYn: procAccYn.value,
    procSetYn: procSetYn.value,
    procFinalCd: procFinalCd.value,
  };

  try {
    const res = await MaumPlusAPI.getJoinList(params);
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
    extra: { procAccYn, procSetYn, procFinalCd },
    autoSearchOnExtraChange: true,
  });

const excelDownload = async () => {
  const params = {
    dateFrom: toYmdCompact(dateFrom.value),
    dateTo: toYmdCompact(dateTo.value),
    keyword: keyword.value,
    procAccYn: procAccYn.value,
    procSetYn: procSetYn.value,
    procFinalCd: procFinalCd.value,
  };

  const excelRes = await MaumPlusAPI.getJoinExcel(params);
  const fileName = '마음플러스신청내역';
  downloadExcel(excelRes, fileName);
};

const goDetail = (item) => {
  router.push({
    name: ROUTE.Maumplus.MaumPlusJoin.Detail,
    query: { ...route.query, bizNo: item.bizNo },
  });
};

onMounted(async () => {
  await fetchSearchOptions();
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
        placeholder="센터명,신청자,주소,연락처"
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

          <!--피드백-->
          <CFormSelect v-model="procAccYn" size="sm" style="width: auto">
            <option v-for="opt in procAccYnOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>

          <!--진행상태-->
          <CFormSelect v-model="procSetYn" size="sm" style="width: auto">
            <option v-for="opt in procSetYnOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>

          <!--계약상태-->
          <CFormSelect v-model="procFinalCd" size="sm" style="width: auto">
            <option v-for="opt in procFinalCdNmOptions" :key="opt.codeId" :value="opt.codeId">
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

        <!--피드백-->
        <template #cell-procAccYn="{ item }">
          <div v-if="item.procAccYn === 'Y'">완료</div>
          <div v-else>미완료</div>
        </template>

        <!--진행상태-->
        <template #cell-procSetYn="{ item }">
          <div v-if="item.procSetYn === 'N'"></div>
          <div v-else-if="item.procSetYn === 'I'">진행</div>
          <div v-else-if="item.procSetYn === 'E'">완료</div>
          <div v-else-if="item.procSetYn === 'H'">보류</div>
          <div v-else></div>
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
