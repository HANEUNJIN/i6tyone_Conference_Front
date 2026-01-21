<script setup>
import UiLoading from '@/components/ui/UiLoading.vue';
import UiGridTable from '@/components/ui/UiGridTable.vue';
import { computed, onMounted, ref } from 'vue';
import { formatYmd } from '@/utils/common';
import { NixEtcbizApi } from '@/api/nixetcbiz';
import { useRoute, useRouter } from 'vue-router';
import { useApiToast } from '@/composables/useApiToast';
import { ROUTE } from '@/constants/routeName';

const route = useRoute();
const router = useRouter();
const toastApi = useApiToast();

const licenseCd = computed(() => route.query.licenseCd || '');
const procCode = computed(() => route.query.procCode || '');

const detailInfo = ref({});
const isLoading = ref(false);

const fmtAddress = (addr, zoneCode) => {
  if (!addr) return '';
  const z =
    zoneCode && zoneCode !== 'null' && String(zoneCode).trim() !== ''
      ? ` [우편번호 : ${zoneCode}]`
      : '';
  return `${addr}${z}`;
};

const applyInfoFields = computed(() => [
  {
    label1: '병원명',
    value1: detailInfo.value.hospNm || '',
    colspan: true,
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
    label1: '제품',
    value1: detailInfo.value.etc1 || '',
    label2: '',
    value2: '',
  },
]);

const procSetLabelMap = {
  N: '-',
  I: '진행',
  E: '완료',
  H: '보류',
};

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

const fetchDetail = async () => {
  if (!licenseCd.value) return;

  isLoading.value = true;

  const params = {
    licenseCd: licenseCd.value,
    procCode: procCode.value,
  };

  try {
    const res = await NixEtcbizApi.getApplicationDetail(params);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return;
    }

    detailInfo.value = res.data?.resultData ?? {};
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  } finally {
    isLoading.value = false;
  }
};

const goBackToList = async () => {
  router.push({
    name: ROUTE.NixEtcbiz.Application.List,
    query: route.query,
  });
};

const goModify = () => {
  router.push({
    name: ROUTE.NixEtcbiz.Application.Modify,
    query: { ...route.query, licenseCd: licenseCd.value, procCode: procCode.value },
  });
};

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
      <div class="d-flex justify-content-end gap-2">
        <CButton color="secondary" size="sm" @click="goBackToList">뒤로</CButton>
        <CButton color="warning" size="sm" @click="goModify">수정</CButton>
      </div>
    </CCardHeader>
    <CCardBody>
      <div class="loading" v-if="isLoading">
        <UiLoading />
      </div>
      <UiGridTable :fields="statusInfoFields" />
    </CCardBody>
  </CCard>
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
