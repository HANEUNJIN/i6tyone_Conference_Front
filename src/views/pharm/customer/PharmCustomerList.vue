<script setup>
import { datepickerFixed, formatMoney, formatPhoneKR, formatYmd, getTodayYmd, toYmdCompact } from '@/utils/common';
import Datepicker from '@vuepic/vue-datepicker';
import { CFormSelect } from '@coreui/vue';
import UiSearchBar from '@/components/ui/UiSearchBar.vue';
import UiDataTable from '@/components/ui/UiDataTable.vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import { onMounted, ref } from 'vue';
import { CommonAPI } from '@/api/temp/common';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useBaseStore } from '@/stores/base';
import { useToast } from '@/composables/useToast';
import { useApiToast } from '@/composables/useApiToast';
import { usePaginatedQueryList } from '@/composables/usePaginatedQueryList';
import { useExcelDownload } from '@/composables/useExcelDownload';
import { ROUTE } from '@/constants/routeName';
import { PharmAPI } from '@/api/temp/pharm';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const base = useBaseStore();
const toast = useToast();
const toastApi = useApiToast();
const { downloadExcel } = useExcelDownload();

const optionsLoading = ref(false);

const dateFrom = ref('2021-01-01');
const dateTo = ref(getTodayYmd());

const companyCd = ref(''); //업체
const companyCdOptions = ref([]);

const companyBusiCd = ref(''); //영업 업체
const companyBusiCdOptions = ref([]);

const program = ref(''); //프로그램현황
const programOptions = [
  { codeId: '', codeNm: '프로그램현황 (체크박스 값 무관)' },
  { codeId: 'A', codeNm: '체크 박스 해당(AND 조건)' },
  { codeId: 'O', codeNm: '체크 박스 포함(OR 조건)' },
];

const use = ref(''); //미사용포험
const useOptions = [
  { codeId: '', codeNm: '미사용포함' },
  { codeId: 'Y', codeNm: '미사용' },
  { codeId: 'N', codeNm: '미사용제외' },
];

const test = ref(''); //테스트포함
const testOptions = [
  { codeId: '', codeNm: '테스트포함' },
  { codeId: 'Y', codeNm: '테스트' },
  { codeId: 'N', codeNm: '테스트제외' },
];

//CheckBox
const chkProPharm = ref(false);
const chkProCrm = ref(false);
const chkProQr = ref(false);

const COLUMNS = [
  { key: 'totNo', label: '순번', width: '3%' },
  { key: 'pharmNm', label: '약국명', width: '13%', align: 'left' },
  { key: 'companyCdNm', label: '업체구분', width: '7%' },
  { key: 'userNm', label: '약국장명', width: '5%' },
  { key: 'userPhoneNo', label: '약국장 핸드폰번호', width: '7%' },
  { key: 'phoneNo', label: '약국 전화번호', width: '6%' },
  { key: 'prodNm', label: 'QR프로그램', width: '8%', align: 'left' },
  { key: 'pcCnt', label: 'QR-PC수', width: '5%', align: 'right' },
  { key: 'pharmPcCnt', label: '이지스팜-PC수', width: '6%', align: 'right' },
  { key: 'programStatus', label: '사용현황', width: '5%', align: 'right' },
  { key: 'programAmt', label: '이지스팜요금', width: '5%', align: 'right' },
  { key: 'startYmd', label: '사용일', width: '5%' },
  { key: 'expYmd', label: '만료일', width: '5%' },
];

const fetchList = async ({ page, keyword, size }) => {
  let chkProPharmYn = chkProPharm.value ? 'E' : '';
  let chkProCrmYn = chkProCrm.value ? 'C' : '';
  let chkProQrYn = chkProQr.value ? 'Q' : '';

  const params = {
    dateFrom: toYmdCompact(dateFrom.value),
    dateTo: toYmdCompact(dateTo.value),
    programStatus: chkProPharmYn + chkProCrmYn + chkProQrYn,
    chkType: program.value,
    expYmdType: use.value,
    testYn: test.value,
    chkProPharm: chkProPharmYn,
    chkProCrm: chkProCrmYn,
    chkProQr: chkProQrYn,
    companyCd: companyCd.value,
    companyBusiCd: companyBusiCd.value,
    keyword: keyword,
    pageNum: page,
    pageSize: size,
  };

  try {
    const res = await PharmAPI.getLicenseList(params);
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
    extra: { companyCd, companyBusiCd, program, use, test, chkProPharm, chkProCrm, chkProQr },
    autoSearchOnExtraChange: true,
  });

const onCreate = () => {
  router.push({ name: ROUTE.Pharm.PharmCustomer.Create });
};

const excelDownload = async () => {
  if (formatYmd(dateTo.value) < formatYmd(dateFrom.value))
    return toast.error('조회 날짜가 잘못 입력되었습 니다.');

  let chkProPharmYn = chkProPharm.value ? 'E' : '';
  let chkProCrmYn = chkProCrm.value ? 'C' : '';
  let chkProQrYn = chkProQr.value ? 'Q' : '';

  const params = {
    dateFrom: toYmdCompact(dateFrom.value),
    dateTo: toYmdCompact(dateTo.value),
    programStatus: chkProPharmYn + chkProCrmYn + chkProQrYn,
    chkType: program.value,
    expYmdType: use.value,
    testYn: test.value,
    chkProPharm: chkProPharmYn,
    chkProCrm: chkProCrmYn,
    chkProQr: chkProQrYn,
    companyCd: companyCd.value,
    companyBusiCd: companyBusiCd.value,
    keyword: keyword,
  };

  const excelRes = await PharmAPI.getExcel(params);
  const fileName = '약국정보';
  downloadExcel(excelRes, fileName);
};

const goDetail = (item) => {
  router.push({
    name: ROUTE.Pharm.PharmCustomer.Detail,
    query: { ...route.query, licenseCd: item.licenseCd, applyYmd: item.applyYmd },
  });
};

const fetchSearchOptions = async () => {
  optionsLoading.value = true;

  try {
    // 업체
    const companyCdRes = await CommonAPI.getCodePharmList('01');
    if (!companyCdRes.ok) {
      toastApi.errorFromResult(companyCdRes);
    }
    const companyCdList = companyCdRes.data?.resultData?.list ?? [];
    companyCdOptions.value = [{ codeId: '', codeNm: '업체' }, ...companyCdList];

    //영업 업체
    const companyBusiCdRes = await CommonAPI.getCodePharmList('04');
    if (!companyBusiCdRes.ok) {
      toastApi.errorFromResult(companyBusiCdRes);
    }
    const companyBusiCdList = companyBusiCdRes.data?.resultData?.list ?? [];
    companyBusiCdOptions.value = [{ codeId: '', codeNm: '업체' }, ...companyBusiCdList];
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
</script>

<template>
  <!-- 검색 -->
  <CCard class="mb-2">
    <CCardBody>
      <UiSearchBar
        v-model="keyword"
        placeholder="약국,원장,전화번호"
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
          <!-- 업체 -->
          <CFormSelect v-model="companyCd" size="sm" style="width: auto">
            <option v-for="opt in companyCdOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>

          <!-- 영업 업체 -->
          <CFormSelect v-model="companyBusiCd" size="sm" style="width: auto">
            <option v-for="opt in companyBusiCdOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>

          <!-- 프로그램현황 -->
          <CFormSelect v-model="program" size="sm" style="width: auto">
            <option v-for="opt in programOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>

          <!-- 미사용포함 -->
          <CFormSelect v-model="use" size="sm" style="width: auto">
            <option v-for="opt in useOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>

          <!-- 테스트포함 -->
          <CFormSelect v-model="test" size="sm" style="width: auto">
            <option v-for="opt in testOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
        </template>

        <template #extra-btn>
          <CButton color="dark" size="sm" type="button" @click="onCreate">등록</CButton>
          <CButton color="success" size="sm" @click="excelDownload">엑셀</CButton>

          <!-- 체크박스 -->
          <CFormCheck
            class="checkbox"
            id="chkProPharm"
            label="이지스팜"
            v-model="chkProPharm"
          />

          <CFormCheck
            class="checkbox"
            id="chkProCrm"
            label="CRM 서비스"
            v-model="chkProCrm"
          />

          <CFormCheck
            class="checkbox"
            id="chkProQr"
            label="QR 서비스"
            v-model="chkProQr"
          />
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
        <!-- 약국장 핸드폰번호 -->
        <template #cell-userPhoneNo="{ item }">
          {{ formatPhoneKR(item?.userPhoneNo) }}
        </template>

        <!-- 이지스팜요금 -->
        <template #cell-programAmt="{ item }">
          {{ formatMoney(item?.programAmt) }}
        </template>

        <!-- 사용일 -->
        <template #cell-startYmd="{ item }">
          {{ formatYmd(item?.startYmd) }}
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
