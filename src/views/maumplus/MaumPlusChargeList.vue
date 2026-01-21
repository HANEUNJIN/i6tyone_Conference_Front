<script setup>
import { datepickerFixed, formatMoney, formatYmd, getTodayYmd } from '@/utils/common';
import UiSearchBar from '@/components/ui/UiSearchBar.vue';
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
import { left, right } from '@popperjs/core';
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
const dateFrom = ref(getTodayYmd().slice(0, 7));

const COLUMNS = [
  { key: 'totNo', label: '순번', width: '3%' },
  { key: 'centerNm', label: '센터명', width: '10%', align: left },
  { key: 'centerSeq', label: '센터코드', width: '3%' },
  { key: 'prodNm', label: '요금제(전월기준)', width: '5%' },
  { key: 'prodAmt', label: '요금', width: '4%', align: right },
  { key: 'partnerAddCnt', label: '추가상담사', width: '4%', align: right },
  { key: 'partnerExpireCnt', label: '해제상담사', width: '5%', align: right },
  { key: 'useSmsCnt', label: 'SMS(20원)', width: '4%', align: right },
  { key: 'useLmsCnt', label: 'LMS(50원)', width: '4%', align: right },
  { key: 'useMmsCnt', label: 'MMS(100원)', width: '4%', align: right },
  { key: 'total', label: '총금액', width: '6%', align: right },
  { key: 'expireYmd', label: '만료일', width: '4%' },
];

const fetchList = async ({ page, keyword }) => {
  const params = {
    dateFrom: `${dateFrom.value.replace('-', '')}01`,
    keyword: keyword,
    pageNum: page,
    expYmdYn: '',
    PageSize: 15,
  };

  try {
    const res = await MaumPlusAPI.getChargeList(params);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return { items: [], total: 0 };
    }

    const list = res.data?.resultData ?? [];
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
    extra: { dateFrom },
    autoSearchOnExtraChange: true,
  });

const excelDownload = async () => {
  const params = {
    dateFrom: `${dateFrom.value.replace('-', '')}01`,
    keyword: keyword.value,
    pageNum: 1,
    expYmdYn: '',
    PageSize: 15,
  };

  const excelRes = await MaumPlusAPI.getChargeExcel(params);
  const fileName = '상품사용현황';
  downloadExcel(excelRes, fileName);
};

onMounted(() => {
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
        placeholder="센터명,대표자"
        @submit="onSearch"
      >
        <template #extra-front>
          <div class="d-flex flex-row align-items-center gap-1">
            <Datepicker
              v-model="dateFrom"
              v-bind="datepickerFixed"
              format="yyyy-MM"
              model-type="yyyy-MM"
              locale="ko"
              style="width: 140px"
              month-picker
              :clearable="false"
              :ui="{ input: 'form-control form-control-sm' }"
            />
          </div>
        </template>

        <template #extra-btn>
          <CButton color="success" size="sm" type="button" @click="excelDownload">엑셀</CButton>
          <div>
            1.메세지 과금 : 전월 1일~말일기준 2.요금제 과금 :전월 15일 기준의 요금제 적용 3.상담사
            과금(기본 상담사 이외에 추가된 상담사 수) :요금제 기준 동일 단 최초 1회 가입 후 해제시
            1개월 요금 청구 됨.
          </div>
        </template>
      </UiSearchBar>
    </CCardBody>
  </CCard>

  <!-- 목록 -->
  <CCard class="flex-grow-1">
    <CCardBody>
      <UiDataTable :columns="COLUMNS" :items="items" :loading="loading" :row-clickable="true">
        <!-- 요금 -->
        <template #cell-prodAmt="{ item }">
          {{ formatMoney(item.prodAmt) }}
        </template>

        <!-- 총(건) -->
        <template #cell-total="{ item }">
          {{
            formatMoney(
              item.partnerAddCnt * item.partnerAddAmt +
                item.partnerExpireCnt * item.partnerAddCnt +
                item.prodAmt +
                item.useSmsCnt * 20 +
                item.useLmsCnt * 50 +
                item.useMmsCnt * 100,
            )
          }}
        </template>

        <!-- 만료일 -->
        <template #cell-expireYmd="{ item }">
          {{ formatYmd(item.expireYmd) }}
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
