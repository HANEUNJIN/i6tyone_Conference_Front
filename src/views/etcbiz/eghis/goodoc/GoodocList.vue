<script setup>
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
import { GoodocAPI } from '@/api/goodoc';
import { formatPhoneKR, formatYmd } from '@/utils/common';
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
const branchOptions = ref([]);
const branch = ref(auth.userInfo.branch === '00' ? '' : auth.userInfo.branch);

const wifiYn = ref();
const goodocAccStep = ref();
const goodocTrsYn = ref();
const branchSetYn = ref();
const goodocFinalYn = ref();

const wifiYnOptions = ref([
  { codeId: '', codeNm: '와이파이여부' },
  { codeId: 'Y', codeNm: 'Y' },
  { codeId: 'N', codeNm: 'N' },
]);

const goodocAccStepOptions = ref([
  { codeId: '', codeNm: '접수상태' },
  { codeId: 'accept', codeNm: '승인완료' },
  { codeId: 'ready', codeNm: '승인전' },
  { codeId: 'cancel', codeNm: '취소' },
  { codeId: 'etc', codeNm: '보류' },
]);

const goodocTrsYnOptions = ref([
  { codeId: '', codeNm: '장비배송' },
  { codeId: 'Y', codeNm: 'Y' },
  { codeId: 'N', codeNm: 'N' },
]);

const branchSetYnOptions = ref([
  { codeId: '', codeNm: '대리점세팅' },
  { codeId: 'Y', codeNm: 'Y' },
  { codeId: 'N', codeNm: 'N' },
]);

const goodocFinalYnOptions = ref([
  { codeId: '', codeNm: '굿닥확인' },
  { codeId: 'Y', codeNm: 'Y' },
  { codeId: 'N', codeNm: 'N' },
]);

const COLUMNS = [
  { key: 'totNo', label: '순번', width: '5%' },
  { key: 'branchNm', label: '지역', width: '7%' },
  { key: 'corpNm', label: '대리점', width: '10%' },
  { key: 'inputEtc', label: '유입경로', width: '6%' },
  { key: 'hospNm', label: '병원명', width: '15%', align: 'left' },
  { key: 'entYmd', label: '등록일', width: '7%' },
  { key: 'deptCd', label: '진료과', width: '5%' },
  { key: 'capNm', label: '대표자명', width: '5%' },
  { key: 'capTelNo', label: '휴대폰', width: '7%' },
  { key: 'wifiYn', label: 'WIFI여부', width: '7%' },
  { key: 'goodocAccStep', label: '접수상태', width: '7%' },
  { key: 'goodocTrsYn', label: '장비배송', width: '7%' },
  { key: 'branchSetYn', label: '대리점세팅', width: '7%' },
  { key: 'goodocFinalYn', label: '굿닥확인', width: '7%' },
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
  wifiYn,
  goodocAccStep,
  goodocTrsYn,
  branchSetYn,
  goodocFinalYn,
}) => {
  const params = {
    autho: '1',
    branch: branch,
    keyword: keyword,
    pageNum: page,
    pageSize: size,
    wifiYn: wifiYn,
    goodocAccStep: goodocAccStep,
    goodocTrsYn: goodocTrsYn,
    branchSetYn: branchSetYn,
    goodocFinalYn: goodocFinalYn,
  };

  try {
    const res = await GoodocAPI.getList(params);
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
    extra: { branch, wifiYn, goodocAccStep, goodocTrsYn, branchSetYn, goodocFinalYn },
    autoSearchOnExtraChange: true,
  });

const excelDownload = async () => {
  const excelRes = await GoodocAPI.getExcel(branch.value);
  const fileName = 'Goodoc';
  downloadExcel(excelRes, fileName);
};

const goDetail = (item) => {
  if (item.inputEtc === 'Y') return;

  router.push({
    name: ROUTE.Etcbiz.Goodoc.Detail,
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
        placeholder="병원,대표자,주소,전화번호"
        @submit="onSearch"
      >
        <template #extra-back>
          <!--대리점-->
          <CFormSelect v-model="branch" size="sm" style="width: auto">
            <option v-for="opt in branchOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
          <!--와이파이여부-->
          <CFormSelect v-model="wifiYn" size="sm" style="width: auto">
            <option v-for="opt in wifiYnOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
          <!--접수상태-->
          <CFormSelect v-model="goodocAccStep" size="sm" style="width: auto">
            <option v-for="opt in goodocAccStepOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
          <!--장비배송-->
          <CFormSelect v-model="goodocTrsYn" size="sm" style="width: auto">
            <option v-for="opt in goodocTrsYnOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
          <!--대리점세팅-->
          <CFormSelect v-model="branchSetYn" size="sm" style="width: auto">
            <option v-for="opt in branchSetYnOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
          <!--굿닥확인-->
          <CFormSelect v-model="goodocFinalYn" size="sm" style="width: 120px">
            <option v-for="opt in goodocFinalYnOptions" :key="opt.codeId" :value="opt.codeId">
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
        <!-- 유입경로 -->
        <template #cell-inputEtc="{ item }">
          <div v-if="item.inputEtc === 'Y'">기타</div>
          <div v-else>이지스</div>
        </template>

        <!-- 등록일-->
        <template #cell-entYmd="{ item }">
          {{ formatYmd(item?.entYmd) }}
        </template>

        <!-- 휴대폰 -->
        <template #cell-capTelNo="{ item }">
          {{ formatPhoneKR(item?.capTelNo) }}
        </template>

        <!-- 접수상태 -->
        <template #cell-goodocAccStep="{ item }">
          <div v-if="item.goodocAccStep === 'accept'">승인완료</div>
          <div v-else-if="item.goodocAccStep === 'ready'">승인전</div>
          <div v-else-if="item.goodocAccStep === 'cancel'">취소</div>
          <div v-else-if="item.goodocAccStep === 'etc'">보류</div>
        </template>

        <!-- 장비배송 -->
        <template #cell-goodocTrsYn="{ item }">
          <div v-if="item.inputEtc === 'Y'"></div>
          <div v-else-if="item.goodocTrsYn === 'Y'">{{ item.goodocTrsYn }}</div>
          <div v-else-if="item.goodocTrsYn === 'N'">{{ item.goodocTrsYn }}</div>
          <div v-else>Y</div>
        </template>

        <!-- 대리점세팅 -->
        <template #cell-branchSetYn="{ item }">
          <div v-if="item.inputEtc === 'Y'"></div>
          <div v-else-if="item.branchSetYn === 'Y'">{{ item.branchSetYn }}</div>
          <div v-else-if="item.branchSetYn === 'N'">{{ item.branchSetYn }}</div>
          <div v-else>Y</div>
        </template>

        <!-- 굿닥확인 -->
        <template #cell-goodocFinalYn="{ item }">
          <div v-if="item.inputEtc === 'Y'"></div>
          <div v-else-if="item.goodocFinalYn === 'Y'">{{ item.goodocFinalYn }}</div>
          <div v-else-if="item.goodocFinalYn === 'N'">{{ item.goodocFinalYn }}</div>
          <div v-else>Y</div>
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
