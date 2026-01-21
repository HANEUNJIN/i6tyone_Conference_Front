<script setup>
import {
  datepickerFixed,
  formatYmd,
  getPrevMonthEndDay,
  getPrevMonthStartDay,
  toYmdCompact,
} from '@/utils/common';
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
import { left, right } from '@popperjs/core';

// ----------------------
// ✨ composable / store
// ----------------------
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const base = useBaseStore();
const toast = useToast();
const toastApi = useApiToast();

// ----------------------
// ✨ reactive state
// ----------------------
const dateFrom = ref(getPrevMonthStartDay());
const dateTo = ref(getPrevMonthEndDay());
const expYmdYn = ref('');

const COLUMNS = [
  { key: 'totNo', label: '순번', width: '4%' },
  { key: 'centerNm', label: '센터명', width: '15%', align: left },
  { key: 'centerSeq', label: '센터코드', width: '5%' },
  { key: 'repNm', label: '대표자', width: '5%' },
  { key: 'prodNm', label: '요금제(현재기준)', width: '5%' },
  { key: 'useSmsCnt', label: 'SMS(건)', width: '6%', align: right },
  { key: 'useLmsCnt', label: 'LMS(건)', width: '7%', align: right },
  { key: 'useMmsCnt', label: 'MMS(건)', width: '6%', align: right },
  { key: 'msgCnt', label: '총(건)', width: '6%', align: right },
  { key: 'expireYmd', label: '만료일', width: '4%' },
];

const expYmdYnOptions = ref([
  { codeId: '', codeNm: '만료센터 포함' },
  { codeId: 'N', codeNm: '만료센터 미포함' },
  { codeId: 'Y', codeNm: '만료센터' },
]);

const fetchList = async ({ page, keyword }) => {
  const params = {
    dateFrom: toYmdCompact(dateFrom.value),
    dateTo: toYmdCompact(dateTo.value),
    keyword: keyword,
    pageNum: page,
    expYmdYn: expYmdYn.value,
    PageSize: 15,
  };

  try {
    const res = await MaumPlusAPI.getUseList(params);
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
    extra: { expYmdYn },
    autoSearchOnExtraChange: true,
  });

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

          <!--만료센터-->
          <CFormSelect v-model="expYmdYn" size="sm" style="width: auto">
            <option v-for="opt in expYmdYnOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
        </template>
      </UiSearchBar>
    </CCardBody>
  </CCard>

  <!-- 목록 -->
  <CCard class="flex-grow-1">
    <CCardBody>
      <UiDataTable :columns="COLUMNS" :items="items" :loading="loading" :row-clickable="true">
        <!-- 총(건) -->
        <template #cell-msgCnt="{ item }">
          {{ item.useSmsCnt + item.useLmsCnt + item.useMmsCnt }}
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
