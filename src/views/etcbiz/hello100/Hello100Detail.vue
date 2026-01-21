<script setup>
import { computed, onMounted, ref } from 'vue';
import UiGridTable from '@/components/ui/UiGridTable.vue';
import UiLoading from '@/components/ui/UiLoading.vue';
import { ROUTE } from '@/constants/routeName';
import { useRoute, useRouter } from 'vue-router';
import { useApiToast } from '@/composables/useApiToast';
import { useBaseStore } from '@/stores/base';
import { Hello100 } from '@/api/hello100';
import { formatYmd } from '@/utils/common';

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
const isLoading = ref(false);

const fmtAddress = (addr, zoneCode) => {
  if (!addr) return '';

  const z =
    zoneCode && zoneCode !== 'null' && String(zoneCode).trim() !== ''
      ? ` [우편번호 : ${zoneCode}]`
      : '';
  return `${addr}${z}`;
};

const statusInfoFields = computed(() => [
  {
    label1: '라이선스번호',
    value1: detailInfo.value.licenseCd,
    label2: '요양기관번호',
    value2: detailInfo.value.hospNo,
  },
  {
    label1: '병원명',
    value1: detailInfo.value.hospNm,
    label2: '진료과',
    value2: detailInfo.value.deptNm,
  },
  {
    label1: '주소',
    value1: fmtAddress(detailInfo.value.addr, detailInfo.value.zoneCode),
    colspan: true,
  },
  {
    label1: '대표자명',
    value1: detailInfo.value.capNm,
    label2: '전화번호',
    value2: detailInfo.value.telNo,
  },
  {
    label1: '신청자명',
    value1: detailInfo.value.entEmplNm,
    label2: '신청일자',
    value2: detailInfo.value.entYmd,
  },
  {
    label1: '대리점 승인여부',
    value1: detailInfo.value.confirmYn,
    label2: '병원패키지 전달여부',
    value2: detailInfo.value.procTrsYn,
  },
  {
    label1: '대리점 세팅여부',
    value1: detailInfo.value.procSetYn,
    label2: '라이선스 발급여부',
    value2: detailInfo.value.hello100Yn,
  },
  {
    label1: 'hello100 연동여부',
    value1: `${detailInfo.value.procAccStepNm ?? ''}
             ${detailInfo.value.procAccStepNm === '연동완료' ? ` ${detailInfo.value.procAccYn ?? ''}` : ''}
            `,
    label2: '설치완료여부',
    value2: detailInfo.value.procFinalYn,
  },
  {
    label1: '담당대리점',
    value1: detailInfo.value.branchNm,
    label2: '담당자',
    value2: detailInfo.value.manager,
  },
  {
    label1: '알림톡(접수) 발송여부',
    value1: `${detailInfo.value.sendYn}
             ${printPeriod(detailInfo.value.sendStartYmd, detailInfo.value.sendEndYmd)}`,
    label2: '알림톡(검사) 발송여부',
    value2: detailInfo.value.sendTestResultYn,
  },
  {
    label1: '대리점 전달사항',
    value1: detailInfo.value.memo,
    colspan: true,
  },
]);

const printPeriod = (startYmd, endYmd) => {
  if (startYmd && endYmd) {
    return `${formatYmd(startYmd)} ~ ${formatYmd(endYmd)}`;
  }
  return '';
};

const fetchDetail = async () => {
  if (!licenseCd.value) return;

  isLoading.value = true;

  const params = {
    licenseCd: licenseCd.value,
    menuType: base.storeMenuType,
  };

  try {
    const res = await Hello100.getDetail(params);
    if (!res.ok) return toastApi.errorFromResult(res);

    detailInfo.value = res.data?.resultData ?? {};
  } catch (e) {
    toastApi.errorFromException(e);
  } finally {
    isLoading.value = false;
  }
};

const goBackToList = () => {
  const routeName = base.storeMenuType === 'E' ? ROUTE.Etcbiz.Hello100.List : ROUTE.NixEtcbiz.Hello100.List;

  router.push({
    name: routeName,
    query: route.query,
  });
};

const goModify = () => {
  const routeName = base.storeMenuType === 'E' ? ROUTE.Etcbiz.Hello100.Modify : ROUTE.NixEtcbiz.Hello100.Modify;

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
