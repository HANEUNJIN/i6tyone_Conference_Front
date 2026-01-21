<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApiToast } from '@/composables/useApiToast';
import { useBaseStore } from '@/stores/base';
import { useAuthStore } from '@/stores/auth';
import { SalesAPI } from '@/api/temp/sales';
import { ROUTE } from '@/constants/routeName';
import UiDataTable from '@/components/ui/UiDataTable.vue';
import UiGridTable from '@/components/ui/UiGridTable.vue';
import UiLoading from '@/components/ui/UiLoading.vue';
import { maskLast4 } from '@/utils/common';

const props = defineProps({
  seq: { type: String, required: true }, // 라우터 props에서 전달됨
});

const route = useRoute();
const router = useRouter();
const toastApi = useApiToast();

const auth = useAuthStore();
const base = useBaseStore();
const detailInfo = ref({}); // 상세 정보
const logs = ref([]); // 영업로그
const isLoading = ref(false); // 상세 본문용 로딩 (스피너)

const salesInfoFields = computed(() => [
  {
    label1: '지사/담당자',
    value1: detailInfo.value.userNm || '',
    label2: '영업 시작일',
    value2: detailInfo.value.regDt || '',
  },
  {
    label1: '유입경로',
    value1: `${detailInfo.value.inRouteNm || ''} ${detailInfo.value.inRouteEtc || ''}`,
    label2: '대상자/연락처',
    key2: 'cType',
  },
  {
    label1: '내용',
    value1: detailInfo.value.memo || '',
    colspan: true,
  },
]);

const hopsInfoFields = computed(() => {
  const fields = [
    {
      label1: '진행상태',
      value1: detailInfo.value.progressNm || '',
      label2: '사업자번호',
      value2: detailInfo.value.businessNo || '',
    },
    {
      label1: '오픈지역',
      value1: `${detailInfo.value.areaNm || ''} ${detailInfo.value.areaBackup || ''}`,
      label2: '계약예정일',
      value2: detailInfo.value.startYmd || '',
    },
    {
      label1: '진료과목',
      value1: detailInfo.value.deptNm || '',
      label2: '요양기관명',
      value2: detailInfo.value.hospNm || '',
    },
    {
      label1: '기존차트업체',
      value1: `${detailInfo.value.chartCustNm || ''} ${detailInfo.value.chartEtc || ''}`,
      label2: '신규여부',
      value2: detailInfo.value.chartInfoNm || '',
    },
    {
      label1: '요양기관번호',
      value1: detailInfo.value.hospCd || '',
      label2: 'PC사용대수',
      value2: detailInfo.value.pcCnt || '',
    },
  ];

  if (detailInfo.value.progress === '03') {
    fields.splice(5, 0, {
      label1: '의사수',
      value1: detailInfo.value.doctorCnt || '',
      label2: '불발사유',
      value2: detailInfo.value.failedSales || '',
    });
  } else {
    fields.splice(5, 0, {
      label1: '의사수',
      value1: detailInfo.value.doctorCnt || '',
    });
  }

  return fields;
});

// 테이블 헤더 정의
const COLUMNS = [
  { key: 'regDt', label: '로그 변경일' },
  { key: 'modname', label: '최종 수정자' },
];

// 상세 정보
async function fetchDetail() {
  if (!props.seq) return;
  isLoading.value = true;
  const params = {
    seq: props.seq,
    menuType: base.storeMenuType,
  };
  try {
    const res = await SalesAPI.getDetail(params);
    if (!res.ok) return toastApi.errorFromResult(res);
    detailInfo.value = res.data?.resultData ?? {};

    const PRIVILEGED_USERS = ['dongha', 'hiyasora'];
    const PHONE_KEYS = ['cPhoneNoHyphen', 'cPhoneNo2Hyphen', 'cPhoneNo3Hyphen'];

    if (PRIVILEGED_USERS.includes(auth?.userInfo?.userId)) return;

    //본사일 경우 (00,01) 전화 번호 전부 노출
    //본사가 아니고 대리점일 경우 같은 대리점끼리는 전화번호 공유 다른 대리점것은 공유 안함
    if (auth?.userInfo?.branch === '00' || auth?.userInfo?.branch === '01') {
      PHONE_KEYS.forEach((k) => {
        if (detailInfo.value[k] != null) detailInfo.value[k] = maskLast4(detailInfo.value[k]);
      });
      return;
    }

    if (auth?.userInfo?.branch !== detailInfo?.value.branch) {
      PHONE_KEYS.forEach((k) => {
        if (detailInfo.value[k] != null) detailInfo.value[k] = maskLast4(detailInfo.value[k]);
      });
    }
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  } finally {
    isLoading.value = false;
  }
}

// 영업 로그
async function fetchLogs() {
  if (!props.seq) return;
  isLoading.value = true;
  const params = {
    seq: props.seq,
  };
  try {
    const res = await SalesAPI.getLogs(params);
    if (!res.ok) return toastApi.errorFromResult(res);
    logs.value = res.data?.resultData.list ?? [];
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  } finally {
    isLoading.value = false;
  }
}

function goModify() {
  router.push({
    name: ROUTE.Sales.Report.Modify,
    query: { ...route.query, seq: props.seq },
  });
}

onMounted(() => {
  fetchDetail();
  fetchLogs();
});
</script>

<template>
  <CCard class="mb-3">
    <CCardHeader>
      <h6 class="mb-0">영업정보</h6>
    </CCardHeader>
    <CCardBody>
      <div class="loading" v-if="isLoading">
        <UiLoading />
      </div>
      <UiGridTable :fields="salesInfoFields">
        <template #value-cType>
          [{{ detailInfo.cTypeNm }}] {{ detailInfo.cNm }} / {{ detailInfo.cPhoneNoHyphen }}
          <template v-if="detailInfo.cNm2 !== null">
            <br />
            [{{ detailInfo.cTypeNm2 }}] {{ detailInfo.cNm2 }} / {{ detailInfo.cPhoneNo2Hyphen }}
          </template>
          <template v-if="detailInfo.cNm3 !== null">
            <br />
            [{{ detailInfo.cTypeNm3 }}] {{ detailInfo.cNm3 }} / {{ detailInfo.cPhoneNo3Hyphen }}
          </template>
        </template>
      </UiGridTable>
    </CCardBody>
  </CCard>
  <CCard class="mb-3">
    <CCardHeader>
      <h6 class="mb-0">병원정보</h6>
    </CCardHeader>
    <CCardBody>
      <div class="loading" v-if="isLoading">
        <UiLoading />
      </div>
      <UiGridTable :fields="hopsInfoFields" />
    </CCardBody>
  </CCard>
  <CCard class="mb-3">
    <CCardHeader>
      <h6 class="mb-0">영업로그</h6>
    </CCardHeader>
    <CCardBody>
      <UiDataTable :columns="COLUMNS" :items="logs" :row-key="(row) => row.regDt" />
    </CCardBody>
  </CCard>
  <Crow class="d-flex justify-content-end">
    <CButton color="secondary" @click="() => router.back()">뒤로</CButton>&nbsp;
    <CButton color="primary" @click="goModify" v-if="auth.userInfo.userId === detailInfo?.userId"
      >수정</CButton
    >
  </Crow>
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
