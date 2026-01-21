<script setup>
import { computed, onMounted, ref } from 'vue';
import UiGridTable from '@/components/ui/UiGridTable.vue';
import { useRoute, useRouter } from 'vue-router';
import { EtcbizAPI } from '@/api/temp/etcbiz';
import { useApiToast } from '@/composables/useApiToast';
import { formatYmd } from '@/utils/common';
import UiLoading from '@/components/ui/UiLoading.vue';
import { ROUTE } from '@/constants/routeName';

const route = useRoute();
const router = useRouter();
const toastApi = useApiToast();

const licenseCd = computed(() => route.query.licenseCd || '');
const procCode = computed(() => route.query.procCode || '');

const detailInfo = ref({}); // 상세 정보
const isLoading = ref(false); // 상세 본문용 로딩 (스피너)

const fmtAddress = (addr, zoneCode) => {
  if (!addr) return '';
  const z =
    zoneCode && zoneCode !== 'null' && String(zoneCode).trim() !== ''
      ? ` [우편번호 : ${zoneCode}]`
      : '';
  return `${addr}${z}`;
};

async function fetchDetail() {
  if (!licenseCd.value) return;
  const params = {
    licenseCd: licenseCd.value,
    procCode: procCode.value,
  };
  isLoading.value = true;
  try {
    const res = await EtcbizAPI.getChartBannerDetail(params);
    if (!res.ok) return toastApi.errorFromResult(res);

    detailInfo.value = res.data?.resultData ?? {};
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  } finally {
    isLoading.value = false;
  }
}

const applyInfoFields = computed(() => [
  {
    label1: '병원명',
    value1: detailInfo.value.hospNm || '',
    label2: '대리점',
    value2: detailInfo.value.corpNm || '',
  },
  {
    label1: '라이센스번호',
    value1: detailInfo.value.licenseCd || '',
    label2: '요양기관번호',
    value2: detailInfo.value.hospNo || '',
  },
  {
    label1: '전화번호',
    value1: detailInfo.value.telNo || '',
    label2: '대표자',
    value2: detailInfo.value.capNm || '',
  },
  {
    label1: '진료과',
    value1: detailInfo.value.deptNm || '',
    label2: '수량',
    value2: detailInfo.value.reqCnt || '',
  },
  {
    label1: '주소',
    value1: fmtAddress(detailInfo.value.addr, detailInfo.value.zoneCode),
    label2: '이메일',
    value2: detailInfo.value.email || '',
  },
  {
    label1: '사업자등록증(사업자번호)',
    value1: detailInfo.value.businessNo || '',
    label2: '헬로100사용여부',
    value2: detailInfo.value.hello100Yn || '',
  },
  {
    label1: '개인정보 제3자 제공 동의 체크',
    value1: detailInfo.value.thirdTermsYn || '',
    colspan: true,
  },
  {
    label1: '금액',
    value1: `단가:${detailInfo.value.reqPrice || 0} 합계금액 :${detailInfo.value.reqPriceSum || 0}`,
    colspan: true,
  },
]);

const procSetLabelMap = { N: '-', I: '진행', E: '완료', H: '보류' };

const statusInfoFields = computed(() => [
  {
    label1: '피드백여부',
    value1: detailInfo.value.procAccYn === 'Y' ? '완료' : '미완료',
    colspan: true,
  },
  {
    label1: '진행상태',
    value1: procSetLabelMap[detailInfo.value.procSetYn],
    colspan: true,
  },
  {
    label1: '계약완료여부',
    value1: detailInfo.value.procFinalYn === 'Y' ? '완료' : '미완료',
    colspan: true,
  },
  {
    label1: '해피콜여부',
    value1:
      detailInfo.value.happyCallYn === 'N'
        ? '미완료'
        : `완료 (${formatYmd(detailInfo.value.happyCallYmd)})`,
    colspan: true,
  },
  {
    label1: '영업특이사항',
    value1: detailInfo.value.memo,
    colspan: true,
  },
]);

function goBackToList() {
  router.push({ name: ROUTE.Etcbiz.ChartBanner.List, query: route.query });
}

function goModify() {
  router.push({
    name: ROUTE.Etcbiz.ChartBanner.Modify,
    query: { ...route.query, licenseCd: licenseCd.value, procCode: procCode.value },
  });
}

onMounted(() => {
  fetchDetail();
});
</script>

<template>
  <CCard class="mb-3">
    <CCardHeader><h6 class="mb-0">신청정보</h6></CCardHeader>
    <CCardBody>
      <div class="loading" v-if="isLoading">
        <UiLoading />
      </div>
      <UiGridTable :fields="applyInfoFields" />
    </CCardBody>
  </CCard>
  <CCard class="mb-3">
    <CCardHeader class="d-flex justify-content-between align-items-center">
      <h6 class="mb-0">진행상태</h6>
    </CCardHeader>
    <CCardBody>
      <div class="loading" v-if="isLoading">
        <UiLoading />
      </div>
      <UiGridTable :fields="statusInfoFields" />
    </CCardBody>
  </CCard>
  <div class="d-flex justify-content-end gap-2">
    <CButton color="secondary" @click="goBackToList">뒤로</CButton>
    <CButton color="warning" @click="goModify">수정</CButton>
  </div>
</template>

<style scoped>
.loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
}
</style>
