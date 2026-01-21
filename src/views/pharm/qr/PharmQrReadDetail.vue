<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApiToast } from '@/composables/useApiToast';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { useToast } from '@/composables/useToast';
import { useBaseStore } from '@/stores/base';
import { ROUTE } from '@/constants/routeName';
import UiLoading from '@/components/ui/UiLoading.vue';
import UiDataTable from '@/components/ui/UiDataTable.vue';
import { PharmAPI } from '@/api/temp/pharm';
import { formatYmd } from '@/utils/common';
import UiSearchBar from '@/components/ui/UiSearchBar.vue';

// ----------------------
// ✨ composable / store
// ----------------------
const route = useRoute();
const router = useRouter();
const toastApi = useApiToast();
const base = useBaseStore();
const modal = useConfirmModal();
const toast = useToast();

// ----------------------
// ✨ reactive state
// ----------------------
const licenseCd = computed(() => route.query.licenseCd || '');
const dateFrom = computed(() => route.query.dateFrom || '');
const dateTo = computed(() => route.query.dateTo || '');
const keyword = computed(() => route.query.keyword || '');
const pharmNm = computed(() => route.query.pharmNm || '');
const pageNum = computed(() => route.query.pageNum || '');

const isLoading = ref(false);
const loading = ref(false);
const items = ref([]);
const detailItems = ref([]);
const keywordDetail = ref('');
const currentPcMac = ref(''); //현재 선택된 PC MAC 주소

const COLUMNS = [
  { key: 'no', label: '순번', width: '4%' },
  { key: 'pcMac', label: 'PC MAC 주소', width: '10%' },
  { key: 'cnt', label: '사용건수', width: '5%' },
];

const DETAIL_COLUMNS = [
  { key: 'totNo', label: '순번', width: '7%' },
  { key: 'hospCd', label: '요양기관번호', width: '10%' },
  { key: 'clinicYmd', label: '진료일', width: '10%' },
  { key: 'billNo', label: '처방전번호', width: '10%' },
  { key: 'verNo', label: '버전정보', width: '10%' },
  { key: 'regDt', label: '사용날짜', width: '10%' },
];

//PC별 리딩개수
const fetchList = async () => {
  try {
    const params = {
      licenseCd: licenseCd.value,
      dateFrom: dateFrom.value,
      dateTo: dateTo.value,
    };

    const res = await PharmAPI.getReadInfoPcList(params);
    if (!res.ok) {
      return toastApi.errorFromResult(res);
    }
    let pcList = res.data?.resultData?.list ?? [];
    items.value = pcList.map((item, index) => ({ ...item, no: index + 1 }));

    if (items.value.length > 0) {
      currentPcMac.value = items.value[0].pcMac;
      await fetchDetailList(currentPcMac.value);
    }
  } catch (e) {
    return toastApi.errorFromException(e);
  }
};

//PC 리딩 상세정보
const fetchDetailList = async (pcMac) => {
  try {
    const detailParams = {
      licenseCd: licenseCd.value,
      pcMac: pcMac,
      dateFrom: dateFrom.value,
      dateTo: dateTo.value,
      keyword: keywordDetail.value,
      pageNum: pageNum.value,
    };

    const detailRes = await PharmAPI.getReadInfoPcDetail(detailParams);
    if (!detailRes.ok) {
      return toastApi.errorFromResult(detailRes);
    }
    let detailList = detailRes.data?.resultData?.list ?? [];
    detailItems.value = detailList.map((item, index) => ({ ...item, no: index + 1 }));
  } catch (e) {
    return toastApi.errorFromException(e);
  }
};

const goDetail = (row) => {
  currentPcMac.value = row.pcMac;
  fetchDetailList(currentPcMac.value);
};

const goBackToList = () => {
  router.push({ name: ROUTE.Pharm.PharmQrRead.List, query: route.query });
};


onMounted(() => {
  fetchList();
});
</script>

<template>
  <CCard class="mb-3">
    <CCardHeader class="d-flex justify-content-between align-items-center">
      <h6 class="mb-0">PC별 리딩개수</h6>
      <span :style="{ fontWeight: 'bold' }">
        [ {{ keyword }} 약국: {{ pharmNm }} {{ `${formatYmd(dateFrom)} ~ ${formatYmd(dateTo)}` }} ]</span>
    </CCardHeader>
    <CCardBody>
      <div class="loading" v-if="isLoading">
        <UiLoading />
      </div>
      <UiDataTable
        :loading="isLoading"
        :columns="COLUMNS"
        :items="items"
        :row-clickable="true"
        :row-key="(row, idx) => row.totNo ?? idx"
        @row-click="({ row }) => goDetail(row)" />
    </CCardBody>
  </CCard>

  <CCard class="mb-3">
    <CCardHeader class="d-flex justify-content-between align-items-center">
      <h6 class="mb-0">PC 리딩 상세정보</h6>
      <span :style="{ fontWeight: 'bold' }">
        [ PC MAC 주소 : {{ currentPcMac }} ]
      </span>
    </CCardHeader>
    <CCardBody>
      <div class="loading" v-if="isLoading">
        <UiLoading />
      </div>
      <div class="mb-3">
        <UiSearchBar
          v-model="keywordDetail"
          :loading="loading"
          :show-reset="false"
          placeholder="요양기관,진료일,처방전번호,버전정보"
          @submit="fetchDetailList(currentPcMac)"
        />
      </div>

      <UiDataTable :loading="isLoading" :columns="DETAIL_COLUMNS" :items="detailItems" />
    </CCardBody>
  </CCard>

  <div class="d-flex justify-content-end gap-2">
    <CButton color="secondary" @click="goBackToList">뒤로</CButton>
  </div>
</template>
