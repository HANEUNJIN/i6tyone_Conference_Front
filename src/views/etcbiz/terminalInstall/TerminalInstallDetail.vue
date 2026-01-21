<script setup>
import UiGridTable from '@/components/ui/UiGridTable.vue';
import UiLoading from '@/components/ui/UiLoading.vue';
import { computed, onMounted, ref } from 'vue';
import { formatPhoneKR, formatYmd } from '@/utils/common';
import { useRoute, useRouter } from 'vue-router';
import { useApiToast } from '@/composables/useApiToast';
import { TerminalInstallAPI } from '@/api/temp/terminalInstall';
import { useBaseStore } from '@/stores/base';
import { ROUTE } from '@/constants/routeName';

const route = useRoute();
const router = useRouter();
const toastApi = useApiToast();
const base = useBaseStore();

const contractNo = computed(() => route.query.contractNo || '');
const licenseCd = computed(() => route.query.licenseCd || '');

const detailInfo = ref({});
const isLoading = ref(false);

const applyInfoFields = computed(() => [
  {
    label1: '라이선스번호',
    value1: detailInfo.value.licenseCd || '',
    label2: '요양기관번호',
    value2: detailInfo.value.hospCd || '',
  },
  {
    label1: '요양기관명',
    value1: detailInfo.value.hospNm || '',
    label2: '사업자등록증',
    value2: detailInfo.value.businessNo || '',
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
    label2: '단말기 신청접수 일자',
    value2: formatYmd(detailInfo.value.regDt) || '',
  },
]);

const statusInfoFields = computed(() => [
  {
    label1: '연동현황',
    value1: detailInfo.value.chartYn === 'Y' ? '연동' : '비연동',
    colspan: true,
  },
  {
    label1: '계약현황',
    value1: detailInfo.value.vanStepCdNm,
    colspan: true,
  },
  {
    label1: '계약일자',
    value1: formatYmd(detailInfo.value.signYmd),
    colspan: true,
  },
  {
    label1: '설치현황',
    value1: detailInfo.value.insStepCdNm,
    colspan: true,
  },
  {
    label1: '설치일자',
    value1: formatYmd(detailInfo.value.insEndYmd),
    colspan: true,
  },
  {
    label1: '설치확인서',
    value1: detailInfo.value.insConfirmYn === 'Y' ? '확인' : '미확인',
    colspan: true,
  },
  {
    label1: '메모',
    value1: detailInfo.value.memo,
    colspan: true,
  },
]);

const fetchDetail = async () => {
  if (!licenseCd.value) return;

  isLoading.value = true;

  const params = {
    contractNo: contractNo.value,
    licenseCd: licenseCd.value,
    menuType: base.storeMenuType,
  };

  try {
    const res = await TerminalInstallAPI.getDetail(params);
    if (!res.ok) return toastApi.errorFromResult(res);

    detailInfo.value = res.data?.resultData ?? {};
  } catch (e) {
    toastApi.errorFromException(e);
  } finally {
    isLoading.value = false;
  }
};

const goBackToList = () => {
  const routeName = base.storeMenuType === 'E' ? ROUTE.Etcbiz.TerminalInstall.List : ROUTE.NixEtcbiz.TerminalInstall.List;
  router.push({ name: routeName, query: route.query });
};

const goModify = () => {
  const routeName = base.storeMenuType === 'E' ? ROUTE.Etcbiz.TerminalInstall.Modify : ROUTE.NixEtcbiz.TerminalInstall.Modify;

  router.push({
    name: routeName,
    query: { ...route.query, contractNo: contractNo.value, licenseCd: licenseCd.value },
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
