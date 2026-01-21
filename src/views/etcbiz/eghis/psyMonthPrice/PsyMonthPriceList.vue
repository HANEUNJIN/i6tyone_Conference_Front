<script setup>
import { datepickerFixed, getTodayYmd } from '@/utils/common';
import Datepicker from '@vuepic/vue-datepicker';
import UiDataTable from '@/components/ui/UiDataTable.vue';
import UiSearchBar from '@/components/ui/UiSearchBar.vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useBaseStore } from '@/stores/base';
import { useToast } from '@/composables/useToast';
import { useApiToast } from '@/composables/useApiToast';
import { usePaginatedQueryList } from '@/composables/usePaginatedQueryList';
import { PsyApi } from '@/api/temp/psy';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const base = useBaseStore();
const toast = useToast();
const toastApi = useApiToast();

const dateFrom = ref(getTodayYmd().slice(0, 7));
const sumInfo = ref({
  clinicYm: '',
  priceSum: 0,
  useCntSum: 0,
});

const COLUMNS = [
  { key: 'no', label: '순번', width: '4%' },
  { key: 'hospNm', label: '병원명', width: '*', align: 'left' },
  { key: 'hospNo', label: '요양기관코드', width: '20%' },
  { key: 'useCnt', label: '사용건수', width: '20%', align: 'right' },
  { key: 'price', label: '총사용요금(단위:원)', width: '20%', align: 'right' },
];

const fetchList = async ({ page, size }) => {
  const params = {
    dateMonth: dateFrom.value.replace('-', ''),
    pageNum: page,
    pageSize: size,
  };

  try {
    const res = await PsyApi.getList(params);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return { items: [], total: 0 };
    }

    const list = res.data?.resultData ?? [];
    const total = list?.[0]?.pageTotalCnt ?? 0;

    list.forEach((e) => {
      e.clinicYm = e.clinicYm.substr(0, 4) + '-' + e.clinicYm.substr(4, 2);

      sumInfo.value.clinicYm = e.clinicYm;
      sumInfo.value.priceSum = e.sumPrice;
      sumInfo.value.useCntSum = e.sumCnt;
    });

    return { items: list, total: Number(total) || 0 };
  } catch (e) {
    toastApi.errorFromException(e);
    return { items: [], total: 0 };
  }
};

// usePaginatedQueryList 훅
const { loading, items, total, page, size, init, onSearch, onPageChanged } = usePaginatedQueryList(
  fetchList,
  {
    defaultKeyword: '',
    searchPushHistory: true,
    queryKeys: { page: 'page', size: 'size' },
    extra: { dateFrom },
    autoSearchOnExtraChange: true,
  },
);

onMounted(init);
</script>

<template>
  <!-- 검색 -->
  <CCard class="mb-3">
    <CCardBody>
      <UiSearchBar
        :loading="loading"
        :show-input="false"
        :show-reset="false"
        placeholder="병원명"
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
      </UiSearchBar>
    </CCardBody>
  </CCard>

  <!-- 목록 -->
  <CCard class="flex-grow-1">
    <CCardBody>
      <p class="mb-2">
        {{ sumInfo.clinicYm }}월 총 사용 금액: {{ sumInfo.priceSum }} 건수: {{ sumInfo.useCntSum }}
      </p>

      <UiDataTable :columns="COLUMNS" :items="items" :loading="loading" />

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
