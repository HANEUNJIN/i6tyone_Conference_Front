<script setup>
import UiGridTable from '@/components/ui/UiGridTable.vue';
import UiLoading from '@/components/ui/UiLoading.vue';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApiToast } from '@/composables/useApiToast';
import { useBaseStore } from '@/stores/base';
import { ROUTE } from '@/constants/routeName';
import { HelloMediaAPI } from '@/api/helloMedia';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { useToast } from '@/composables/useToast';

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

const detailInfo = ref({});
const isLoading = ref(false);

const memberInfoFields = computed(() => [
  {
    label1: '라이선스번호',
    value1: detailInfo.value.licenseCd || '',
    colspan: true,
  },
  {
    label1: '병원명',
    value1: detailInfo.value.hospNm || '',
    label2: '요양기관번호',
    value2: detailInfo.value.hospNo || '',
  },
  {
    label1: '대표자성명',
    value1: detailInfo.value.capNm || '',
    label2: '전화번호',
    value2: detailInfo.value.telNo || '',
  },
  {
    label1: '주소지',
    value1: detailInfo.value.addr || '',
    colspan: true,
  },
  {
    label1: '담당대리점',
    value1: `${detailInfo.value.corpNm}(${detailInfo.value.branchNm})` || '',
    label2: '타대리점',
    value2: detailInfo.value.branchNmEtc || '',
  },
  {
    label1: '신청인',
    value1: detailInfo.value.entEmplNm || '',
    label2: '가입형태',
    value2: `${detailInfo.value.procType}${detailInfo.value.preAppYn === 'Y' ? '(사전)' : ''}`,
  },
  {
    label1: 'FAX',
    value1: detailInfo.value.faxNo || '',
    label2: '진료과',
    value2: detailInfo.value.deptNm || '',
  },
  {
    label1: '헬로100',
    value1: detailInfo.value.hello100UseYn || '',
    colspan: true,
  },
]);

const optionsInfoFields = computed(() => [
  {
    label1: '제품유형',
    value1: detailInfo.value.step1 || '',
  },
  {
    label1: '서비스화면타입',
    value1: detailInfo.value.step2 || '',
  },
  {
    label1: '세부옵션',
    value1: detailInfo.value.step3 || '',
  },
]);

const installInfoFields = computed(() => [
  {
    label1: '와이파이 사용여부',
    value1: detailInfo.value.wifiYn || '',
  },
  {
    label1: '인터넷공유기 거리',
    value1: detailInfo.value.routerDis || '',
  },
  {
    label1: '전원콘센트 거리',
    value1: detailInfo.value.socketDis || '',
  },
  {
    label1: '주차가능여부',
    value1: detailInfo.value.parkingYn || '',
  },
  {
    label1: '승강시사용여부',
    value1: detailInfo.value.elevatorYn || '',
  },
]);

const statusInfoFields = computed(() => [
  {
    label1: '연동현황',
    value1: detailInfo.value.helloMediaYnNm,
    colspan: true,
  },
  {
    label1: '신청현황',
    value1: detailInfo.value.procTrsYnNm,
    colspan: true,
  },
  {
    label1: '배송현황',
    value1: detailInfo.value.procAccStepNm,
    colspan: true,
  },
  {
    label1: '설치현황',
    value1: detailInfo.value.procSetYnNm,
    colspan: true,
  },
  {
    label1: '설치일자',
    value1: detailInfo.value.reviewStNm,
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
    licenseCd: licenseCd.value,
  };

  try {
    const res = await HelloMediaAPI.getDetail(params);
    if (!res.ok) return toastApi.errorFromResult(res);

    detailInfo.value = res.data?.resultData ?? {};
  } catch (e) {
    toastApi.errorFromException(e);
  } finally {
    isLoading.value = false;
  }
};

const goBackToList = () => {
  router.push({ name: ROUTE.Etcbiz.HelloMedia.List, query: route.query });
};

const goModify = () => {
  router.push({
    name: ROUTE.Etcbiz.HelloMedia.Modify,
    query: { ...route.query, licenseCd: licenseCd.value },
  });
};

const onDelete = async () => {
  const ok = await modal.show({
    title: '삭제',
    message: '삭제 하시겠습니까?',
    confirmText: '삭제',
  });

  if (!ok) return;

  try {
    const res = await HelloMediaAPI.delete({ LicenseCd: licenseCd.value });
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return;
    }

    toast.success('삭제되었습니다.');
    goBackToList();
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

onMounted(() => {
  fetchDetail();
});
</script>

<template>
  <CCard class="mb-3">
    <CCardHeader class="d-flex justify-content-between align-items-center">
      <h6 class="mb-0">회원정보</h6>
    </CCardHeader>
    <CCardBody>
      <div class="loading" v-if="isLoading">
        <UiLoading />
      </div>
      <UiGridTable :fields="memberInfoFields" />
    </CCardBody>
  </CCard>

  <CCard class="mb-3">
    <CCardHeader><h6 class="mb-0">옵션 정보</h6></CCardHeader>
    <CCardBody>
      <div class="loading" v-if="isLoading">
        <UiLoading />
      </div>
      <UiGridTable :fields="optionsInfoFields" />
    </CCardBody>
  </CCard>

  <CCard class="mb-3">
    <CCardHeader><h6 class="mb-0">설치환경</h6></CCardHeader>
    <CCardBody>
      <div class="loading" v-if="isLoading">
        <UiLoading />
      </div>
      <UiGridTable :fields="installInfoFields" />
    </CCardBody>
  </CCard>

  <CCard class="mb-3">
    <CCardHeader class="d-flex justify-content-between align-items-center">
      <h6 class="mb-0">상태</h6>
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
    <CButton color="danger" @click="onDelete">삭제</CButton>
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
