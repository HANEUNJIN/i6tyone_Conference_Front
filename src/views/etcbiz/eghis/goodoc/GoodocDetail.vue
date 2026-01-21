<script setup>
import UiGridTable from '@/components/ui/UiGridTable.vue';
import UiLoading from '@/components/ui/UiLoading.vue';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApiToast } from '@/composables/useApiToast';
import { useBaseStore } from '@/stores/base';
import { ROUTE } from '@/constants/routeName';
import { GoodocAPI } from '@/api/goodoc';
import { formatPhoneKR, formatYmd } from '@/utils/common';

// ----------------------
// ✨ composable / store
// ----------------------
const route = useRoute();
const router = useRouter();
const toastApi = useApiToast();
const base = useBaseStore();

// ----------------------
// ✨ reactive state
// ----------------------
const licenseCd = computed(() => route.query.licenseCd || '');

const detailInfo = ref({});
const isLoading = ref(false);

const statusInfoFields = computed(() => [
  {
    label1: '라이선스 번호',
    value1: detailInfo.value.licenseCd,
    label2: '요양기관 번호',
    value2: detailInfo.value.hospNo,
  },
  {
    label1: '병원명',
    value1: detailInfo.value.hospNm,
    label2: '진료과',
    value2: detailInfo.value.deptCd,
  },
  {
    label1: '주소',
    value1: detailInfo.value.addr,
    colspan: true,
  },
  {
    label1: '전화번호',
    value1: detailInfo.value.telNo,
    label2: 'wifi 적용여부',
    value2: detailInfo.value.wifiYn,
  },
  {
    label1: '대표자 명',
    value1: detailInfo.value.capNm,
    label2: '대표자 전화번호',
    value2: formatPhoneKR(detailInfo.value.capTelNo),
  },
  {
    label1: '카톡플러스 친구아이디',
    value1: detailInfo.value.plusId,
    label2: '카톡플러스 친구연락처',
    value2: formatYmd(detailInfo.value.plusTelNo),
  },
  {
    label1: '신청일자',
    value1: detailInfo.value.entYmd,
    label2: '신청시간',
    value2: detailInfo.value.entTime,
  },
  {
    label1: '신청자명',
    value1: detailInfo.value.entEmplNm,
    label2: '신청자아이피',
    value2: detailInfo.value.entIp,
  },
  {
    label1: '굿닥접수상태',
    value1: formatAcceptStatus(detailInfo.value.goodocAccStep),
    label2: '굿닥장비 배송여부',
    value2: formatYmd(detailInfo.value.goodocTrsYn),
  },
  {
    label1: '담당대리점',
    value1: detailInfo.value.branchNm,
    label2: '대리점세팅여부',
    value2: formatYmd(detailInfo.value.branchSetYn),
  },
  {
    label1: '굿닥확인',
    value1: detailInfo.value.goodocFinalYn,
    label2: '',
    value2: '',
  },
  {
    label1: '메모',
    value1: detailInfo.value.memo,
    colspan: true,
  },
]);

const formatAcceptStatus = (step) => {
  const map = {
    accept: '승인완료',
    ready: '승인전',
    cancel: '취소',
    etc: '보류',
  };
  return map[step] || '';
};

const fetchDetail = async () => {
  if (!licenseCd.value) return;

  isLoading.value = true;

  try {
    const res = await GoodocAPI.getDetail(licenseCd.value);
    if (!res.ok) return toastApi.errorFromResult(res);

    detailInfo.value = res.data?.resultData ?? {};
  } catch (e) {
    toastApi.errorFromException(e);
  } finally {
    isLoading.value = false;
  }
};

const goBackToList = () => {
  router.push({ name: ROUTE.Etcbiz.Goodoc.List, query: route.query });
};

const goModify = () => {
  router.push({
    name: ROUTE.Etcbiz.Goodoc.Modify,
    query: { ...route.query, licenseCd: licenseCd.value },
  });
};

onMounted(() => {
  fetchDetail();
});
</script>

<template>
  <CCard class="mb-3">
    <CCardHeader class="d-flex justify-content-between align-items-center">
      <h6 class="mb-0">상세정보</h6>
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
