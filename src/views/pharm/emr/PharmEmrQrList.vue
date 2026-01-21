<script setup>
import { datepickerFixed, formatMoney, getTodayYmd } from '@/utils/common';
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
import { PharmAPI } from '@/api/temp/pharm';
import { left, right } from '@popperjs/core';
import { useExcelDownload } from '@/composables/useExcelDownload';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const base = useBaseStore();
const toast = useToast();
const toastApi = useApiToast();
const { downloadExcel } = useExcelDownload();

const dateFrom = ref(getTodayYmd().slice(0, 7));

const COLUMNS = [
  { key: 'no', label: '순번', width: '5%' },
  { key: 'prodNm', label: '상품명', width: '10%', align: left },
  { key: 'cnt1', label: '이지스전자차트(건)', width: '5%', align: right },
  { key: 'cnt2', label: '이원헬스케어(건)', width: '5%', align: right },
  { key: 'cnt3', label: '비트컴퓨터(건)', width: '5%', align: right },
  { key: 'cnt4', label: '포인트닉스(건)', width: '4%', align: right },
  { key: 'cnt5', label: '가천대길병원(건)', width: '7%', align: right },
  { key: 'cnt6', label: '전능아이티(건)', width: '6%', align: right },
  { key: 'totalCnt', label: '총건수(건)', width: '6%', align: right },
  { key: 'unitAmt', label: '건당요금(원)', width: '5%', align: right },
  { key: 'totalAmt', label: '총금액(원)', width: '5%', align: right },
];

const fetchList = async () => {
  const params = {
    dateFrom: dateFrom.value.replace('-', ''),
  };

  try {
    const res = await PharmAPI.getEmrQrList(params);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return { items: [], total: 0 };
    }

    const resList = res.data?.resultData?.list ?? [];
    const list = resList.map((item, index) => ({ ...item, no: index + 1 }));
    const total = res.data?.resultData?.totCnt ?? list?.[0]?.totCnt ?? 0;

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

// 기존에 사용하던 소스를 기반으로 엑셀 다운로드 기능 훅에 통합함
const excelDownload = async () => {
  // 우선 id 를 이용하여 table 을 가져옵니다.
  let table = document.getElementById('excel_table');
  // css 를 입히는 과정에서 class 가 2개 이상이 되면 적용이 되지 않으므로 class 를 하나로 만들어주도록 합니다.
  table.classList.remove('table-striped');

  let styles = '<style>\n';
  styles += '.table{width: 100%;}\n';
  styles += ".conTxt{mso-number-format:'@' }\n";
  styles += ".conNumber{mso-number-format:'###,#' }\n";
  styles += '.head-title{border-top: 1px solid #dee2e6; border-bottom: 2px solid #dee2e6;}\n';
  styles += '.first-td{background-color: #F2F2F2;}\n';
  styles += '.last-td{background-color: #F2F2F2;}\n';
  styles += '</style>';

  let template =
    '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->' +
    styles +
    '</head><body>{table}</body></html>';

  const ctx = {
    worksheet: '상품기준QR현황',
    table: table.outerHTML
  };

  const excelContent = template.replace(/{(\w+)}/g, (m, p) => ctx[p]);

  // Blob을 만들어 downloadExcel로 전달
  const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });

  const excelRes = { data: blob };
  const fileName = '상품기준QR현황';
  await downloadExcel(excelRes, fileName);
};

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

        <template #extra-btn>
          <CButton color="success" size="sm" type="button" @click="excelDownload">엑셀</CButton>
        </template>
      </UiSearchBar>
    </CCardBody>
  </CCard>

  <!-- 목록 -->
  <CCard class="flex-grow-1" id="excel_table">
    <CCardBody>
      <UiDataTable :columns="COLUMNS" :items="items" :loading="loading" :summary="true">
        <!-- 건당요금(원) -->
        <template #cell-unitAmt="{ item }">
          {{ formatMoney(item.unitAmt) }}
        </template>

        <!-- 총금액(원) -->
        <template #cell-totalAmt="{ item }">
          {{ formatMoney(item.totalAmt) }}
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
