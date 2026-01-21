<script setup>
import { computed, onMounted, ref } from 'vue';
import UiGridTable from '@/components/ui/UiGridTable.vue';
import UiLoading from '@/components/ui/UiLoading.vue';
import { useRoute, useRouter } from 'vue-router';
import { useApiToast } from '@/composables/useApiToast';
import { useBaseStore } from '@/stores/base';
import { KioskAPI } from '@/api/kiosk';
import { formatPhoneKR, formatYmd } from '@/utils/common';
import UiDataTable from '@/components/ui/UiDataTable.vue';
import { ROUTE } from '@/constants';
import { left, right } from '@popperjs/core';

// ----------------------
// ✨ composable / store
// ----------------------
const base = useBaseStore();
const route = useRoute();
const router = useRouter();
const toastApi = useApiToast();

const licenseCd = computed(() => route.query.licenseCd || '');
const storeMenuType = computed(() => route.query.storeMenuType || '');

// ----------------------
// ✨ reactive state
// ----------------------
const detailInfo = ref({});
const itemContract = ref({});
const isLoading = ref(false);

const applyInfoFields = computed(() => [
  {
    label1: '라이선스번호',
    value1: detailInfo.value.licenseCd || '',
    colspan: true,
  },
  {
    label1: '요양기관명',
    value1: detailInfo.value.hospNm || '',
    label2: '요양기관번호',
    value2: detailInfo.value.hospCd || '',
  },
  {
    label1: '원장명',
    value1: detailInfo.value.mainDoctorNm || '',
    label2: '원장핸드폰번호',
    value2: formatPhoneKR(detailInfo.value.doctTel) || '',
  },
  {
    label1: '주소지',
    value1: detailInfo.value.hospAddr || '',
    colspan: true,
  },
  {
    label1: '담당대리점',
    value1: `${detailInfo.value.corpNm}(${detailInfo.value.branchNm})` || '',
    colspan: true,
  },
  {
    label1: '계약자',
    value1: detailInfo.value.contractUserNm || '',
    label2: '계약자 핸드폰번호',
    value2: formatPhoneKR(detailInfo.value.contractUserTel) || '',
  },
  {
    label1: '유지보수 담당자',
    value1: detailInfo.value.serviceUserNm || '',
    label2: '유지보수 담당자 핸드폰번호',
    value2: formatPhoneKR(detailInfo.value.serviceUserTel) || '',
  },
  {
    label1: '계약상태',
    value1: formatYmd(detailInfo.value.startYmd) ? '유지보수 시작' : '계약완료',
    label2: '계약서 작성일',
    value2: formatYmd(detailInfo.value.setupYmd) || '',
  },
  {
    label1: '오픈일',
    value1: formatYmd(detailInfo.value.openYmd) || '',
    label2: '유지보수 시작일',
    value2: formatYmd(detailInfo.value.startYmd) || '',
  },
  {
    label1: '폐기일',
    value1: formatYmd(detailInfo.value.expYmd) || '',
    label2: '헬로100',
    value2: detailInfo.value.hello100Yn || '',
  },
  {
    label1: '키오스크 홈페이지 신청여부',
    value1: detailInfo.value.receiveHomeYn || '',
    label2: '키오스크 라이선스 수량',
    value2: detailInfo.value.licenseKioskCnt || '',
  },
]);

const COLUMNS = [
  { key: 'reportNo', label: '영업번호' },
  { key: 'completeDt', label: '계약완료일(계약서)' },
  { key: 'categoryNm', label: '제품명(계약서)', width: '10%' },
  { key: 'itemNm', label: '제품-아이템명(계약서)', width: '20%', align: left },
  { key: 'itemCopy', label: '신청수량(계약서)', align: right },
  { key: 'insCnt', label: '설치수량', align: right, colSpan: true },
  { key: 'expCnt', label: '폐기수량', align: right },
  { key: 'kioskStep', label: '진행현황' },
  { key: 'insExpYmd', label: '설치예정일' },
  { key: 'insEndYmd', label: '설치완료일' },
  { key: 'amtStartYmd', label: '과금시작일' },
  { key: 'memo', label: '메모', width: '20%', align: left },
];

const isColSpan = ({ itemNm }) => Boolean(['키오스크 월회비', '키오스크 관련 설치비'].includes(itemNm));

const fetchDetail = async () => {
  if (!licenseCd.value)
    return;

  isLoading.value = true;

  const params = {
    licenseCd: licenseCd.value,
    menuType: base.storeMenuType,
  };

  try {
    const res = await KioskAPI.getDetail(params);
    if (!res.ok)
      return toastApi.errorFromResult(res);

    detailInfo.value = res.data?.resultData ?? {};

    const contractRes = await KioskAPI.getContractList(params);
    if (!res.ok)
      return toastApi.errorFromResult(res);

    itemContract.value = contractRes.data?.resultData ?? {};
  } catch (e) {
    toastApi.errorFromException(e);
  } finally {
    isLoading.value = false;
  }
};

const goModify = () => {
  const routeName = base.storeMenuType === 'E' ? ROUTE.Etcbiz.Kiosk.Modify : ROUTE.NixEtcbiz.Kiosk.Modify;

  router.push({
    name: routeName,
    query: { ...route.query, licenseCd: licenseCd.value, menuType: base.storeMenuType },
  });
};

onMounted(() => {
  fetchDetail();
});
</script>

<template>
  <CCard class="mb-3">
    <CCardHeader><h6 class="mb-0">회원정보</h6></CCardHeader>
    <CCardBody>
      <div class="loading" v-if="isLoading">
        <UiLoading />
      </div>
      <UiGridTable :fields="applyInfoFields" />
    </CCardBody>
  </CCard>

  <CCard class="mb-3">
    <CCardHeader>
      <h6 class="mb-0">설치 정보</h6>
      <div>진행상태 참고</div>
      <div>1) 신청 - 계약완료 2) 설치대기 - 설치예정일 입력 3) 설치완료 - 설치완료일 입력 또는 설치완료 버튼 4) 과금시작 - 과금시작일 입력 4) 부분폐기 - 폐기수량 입력(설치수량보다 작을
        때) 5) 폐기 - 폐기수량 입력(설치수량과 같을 때)
      </div>
      <div class="text-danger">* 설치 완료일 입력시 설치수량이 0이면 신청수량 값으로 자동으로 입력됩니다.</div>
    </CCardHeader>
    <CCardBody>
      <UiDataTable :columns="COLUMNS" :items="itemContract.list" :isColSpan="isColSpan">
        <!-- 진행현황 -->
        <template #cell-kioskStep="{ item }">
          <div v-if="item.kioskStep === 'A2701' || item.kioskStep === null">신청</div>
          <div v-else-if="item.kioskStep === 'A2702'">설치대기</div>
          <div v-else-if="item.kioskStep === 'A2703'">설치완료</div>
          <div v-else-if="item.kioskStep === 'A2704'">과금시작</div>
          <div v-else-if="item.kioskStep === 'A2705'">부분철거</div>
          <div v-else-if="item.kioskStep === 'A2706'">철거</div>
          <div v-else></div>
        </template>

        <!-- 과금시작일 -->
        <template #cell-amtStartYmd="{ item }">
          {{ formatYmd(item?.amtStartYmd) }}
        </template>
      </UiDataTable>
    </CCardBody>
  </CCard>
  <div class="d-flex justify-content-end gap-2">
    <CButton color="secondary" @click="() => router.back()">뒤로</CButton>
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
