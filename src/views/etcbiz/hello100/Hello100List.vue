<script setup>
import { datepickerFixed, formatYmd, getTodayYmd, toYmdCompact } from '@/utils/common';
import Datepicker from '@vuepic/vue-datepicker';
import { CFormSelect } from '@coreui/vue';
import UiSearchBar from '@/components/ui/UiSearchBar.vue';
import UiDataTable from '@/components/ui/UiDataTable.vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import { nextTick, onMounted, ref, watch } from 'vue';
import { CommonAPI } from '@/api/temp/common';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useBaseStore } from '@/stores/base';
import { useToast } from '@/composables/useToast';
import { useApiToast } from '@/composables/useApiToast';
import { usePaginatedQueryList } from '@/composables/usePaginatedQueryList';
import { Hello100 } from '@/api/hello100';
import { useExcelDownload } from '@/composables/useExcelDownload';
import { ROUTE } from '@/constants/routeName';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const base = useBaseStore();
const toast = useToast();
const toastApi = useApiToast();
const { downloadExcel } = useExcelDownload();

const optionsLoading = ref(false);

const dateFrom = ref('2020-01-01');
const dateTo = ref(getTodayYmd());

const branchOptions = ref([]);
const branch = ref(auth.userInfo.branch === '00' ? '' : auth.userInfo.branch);

const checkConfirmYn = ref(false);
const checkLicenseYn = ref(false);
const procSetYn = ref(false);
const checkHello100Yn = ref(false);
const checkSendYn = ref(false);

const COLUMNS = [
  { key: 'totNo', label: '순번', width: '4%' },
  { key: 'branchNm', label: '대리점', width: '8%' },
  { key: 'hospNm', label: '병원명', width: '13%', align: 'left' },
  { key: 'procCode', label: '전자계약', width: '4%' },
  { key: 'entYmd', label: '등록일', width: '6%' },
  { key: 'capNm', label: '대표자명', width: '5%' },
  { key: 'telNo', label: '대표번호', width: '7%' },
  { key: 'confirmYn', label: '승인 여부', width: '7%' },
  { key: 'procTrsYn', label: '패키지전달 여부', width: '7%' },
  { key: 'hello100Yn', label: '라이선스', width: '7%' },
  { key: 'procSetYn', label: '대리점 세팅', width: '7%' },
  { key: 'sendYn', label: '알림톡(접수)', width: '7%' },
  { key: 'sendTestResultYn', label: '알림톡(검사)', width: '7%' },
  { key: 'procAccStep', label: 'hello100 확인', width: '7%' },
];

const fetchList = async ({ page, keyword, branch }) => {
  const params = {
    autho: '1',
    branch: branch,
    dateFrom: toYmdCompact(dateFrom.value),
    dateTo: toYmdCompact(dateTo.value),
    checkConfirmYn: checkConfirmYn.value ? 'Y' : 'N',
    checkLicenseYn: checkLicenseYn.value ? 'Y' : 'N',
    checkBranchSetYn: procSetYn.value ? 'Y' : 'N',
    checkHello100Yn: checkHello100Yn.value ? 'Y' : 'N',
    checkSendYn: checkSendYn.value ? 'Y' : 'N',
    keyword: keyword,
    pageNum: page,
    menuType: base.storeMenuType,
  };

  try {
    const res = await Hello100.getList(params);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return { items: [], total: 0 };
    }

    const list = (res.data?.resultData?.list ?? []).map((item) => ({
      ...item,
      hospNm: `(${item.chartVersionTypeNm}) ${item.hospNm}`,
      procCode: item.procCode === 'hello100E' ? 'O' : 'X',
    }));

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

const onCreate = () => {
  const routeName =
    base.storeMenuType === 'E' ? ROUTE.Etcbiz.Hello100.Create : ROUTE.NixEtcbiz.Hello100.Create;
  router.push({ name: routeName });
};

const excelDownload = async () => {
  if (formatYmd(dateTo.value) < formatYmd(dateFrom.value))
    return toast.error('조회 날짜가 잘못 입력되었습 니다.');

  const params = {
    autho: '1',
    branch: branch.value,
    dateFrom: toYmdCompact(dateFrom.value),
    dateTo: toYmdCompact(dateTo.value),
    confirmYn: checkConfirmYn.value ? 'Y' : 'N',
    licenseYn: checkLicenseYn.value ? 'Y' : 'N',
    branchSetYn: procSetYn.value ? 'Y' : 'N',
    hello100Yn: checkHello100Yn.value ? 'Y' : 'N',
    sendYn: checkSendYn.value ? 'Y' : 'N',
    menuType: base.storeMenuType,
  };

  const excelRes = await Hello100.getExcel(params);
  const fileName = 'Hello100';
  downloadExcel(excelRes, fileName);
};

const goDetail = (item) => {
  const routeName =
    base.storeMenuType === 'E' ? ROUTE.Etcbiz.Hello100.Detail : ROUTE.NixEtcbiz.Hello100.Detail;

  router.push({
    name: routeName,
    query: { ...route.query, licenseCd: item.licenseCd, menuType: base.storeMenuType },
  });
};

const fetchSearchOptions = async () => {
  optionsLoading.value = true;

  try {
    // 대리점 옵션
    const branchRes = await CommonAPI.getBranchCorpNmY({ menuType: base.storeMenuType });
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
  <CCard class="mb-2">
    <CCardBody>
      <UiSearchBar
        v-model="keyword"
        placeholder="병원,대표자,주소,전화번호"
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

          <!-- 대리점 -->
          <CFormSelect v-model="branch" size="sm" style="width: auto">
            <option v-for="opt in branchOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
        </template>

        <template #extra-btn>
          <!--          Todo: 사용여부 체크 후 삭제 예정.-->
          <!--          <CButton color="dark" size="sm" type="button" @click="onCreate">등록 </CButton>-->
          <CButton color="success" size="sm" @click="excelDownload">엑셀 </CButton>

          <!-- 체크박스 -->
          <CFormCheck
            class="checkbox"
            id="checkConfirmYn"
            label="대리점 승인"
            v-model="checkConfirmYn"
          />

          <CFormCheck
            class="checkbox"
            id="checkLicenseYn"
            label="라이선스 발급"
            v-model="checkLicenseYn"
          />

          <CFormCheck class="checkbox" id="procSetYn" label="대리점 세팅" v-model="procSetYn" />

          <CFormCheck
            class="checkbox"
            id="checkHello100Yn"
            label="Hello100 확인"
            v-model="checkHello100Yn"
          />

          <CFormCheck class="checkbox" id="checkSendYn" label="알림톡 발송" v-model="checkSendYn" />
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

        <template #cell-procAccStep="{ item }">
          <div v-if="item.procAccStep === 'ready'">연동전</div>
          <div v-else-if="item.procAccStep === 'accept'">연동완료</div>
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
