<script setup>
import { computed, onMounted, ref } from 'vue';
import UiGridTable from '@/components/ui/UiGridTable.vue';
import UiLoading from '@/components/ui/UiLoading.vue';
import { useRoute, useRouter } from 'vue-router';
import { useApiToast } from '@/composables/useApiToast';
import { useBaseStore } from '@/stores/base';
import { KioskAPI } from '@/api/kiosk';
import { datepickerFixed, formatPhoneKR, formatYmd, isValidateEmpty, toYmdCompact } from '@/utils/common';
import UiDataTable from '@/components/ui/UiDataTable.vue';
import { left, right } from '@popperjs/core';
import Datepicker from '@vuepic/vue-datepicker';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { useToast } from '@/composables/useToast';
import { useAuthStore } from '@/stores/auth';

// ----------------------
// ✨ composable / store
// ----------------------
const base = useBaseStore();
const route = useRoute();
const router = useRouter();
const toastApi = useApiToast();
const modal = useConfirmModal();
const toast = useToast();
const auth = useAuthStore();

const licenseCd = computed(() => route.query.licenseCd || '');
const storeMenuType = computed(() => route.query.storeMenuType || '');

// ----------------------
// ✨ reactive state
// ----------------------
const detailInfo = ref({});
const itemContract = ref({});
const isLoading = ref(false);
const isSubmitting = ref(false);

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

const amtManagerStart = async (item) => {
  if (isSubmitting.value)
    return;

  const msg = validateForm(item);
  if (msg)
    return toast.error(msg);

  const confirm = await modal.show({
    title: '과금 시작',
    message: '과금 시작 하시겠습니까?',
    confirmText: '과금 시작',
  });
  if (!confirm)
    return;

  try {
    isSubmitting.value = true;

    item.amtStartYmdInput = toYmdCompact(item.amtStartYmdInput);
    item.menuType = base.storeMenuType;

    const res = await KioskAPI.postManagerProgramStart(item);
    if (!res.ok)
      return toastApi.errorFromResult(res);

    toast.success('과금이 시작되었습니다.');
    router.back();
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

const validateForm = (f) => {
  if (isValidateEmpty(f.amtStartYmdInput)) {
    return '과금시작일을 입력해주세요.';
  }

  if (f.insCnt < f.itemCopy)
    return toast.error('설치수량이 신청수량보다 적습니다.');
};

const onSave = async () => {
  if (isSubmitting.value)
    return;

  const confirm = await modal.show({
    title: '저장',
    message: '저장 하시겠습니까?',
    confirmText: '저장',
  });
  if (!confirm)
    return;

  try {
    isSubmitting.value = true;

    const { list } = itemContract.value;

    // 설치수량 체크
    const overInsItem = list.find(e => e.insCnt > e.itemCopy);
    if (overInsItem) {
      toast.error(`[${overInsItem.itemNm}] 설치수량이 신청수량보다 많습니다.`);
      return;
    }

    // 폐기수량 체크
    const overExpItem = list.find(e => e.expCnt > e.insCnt);
    if (overExpItem) {
      toast.error(`[${overExpItem.itemNm}] 폐기수량이 설치수량보다 많습니다.`);
      return;
    }

    // 키오스크 월회비 제외 후 날짜 포맷 변환
    const temp = list
      .filter(e => e.itemNm !== '키오스크 월회비')
      .map(e => ({
        ...e,
        insExpYmd: toYmdCompact(e.insExpYmd),
        insEndYmd: toYmdCompact(e.insEndYmd),
      }));

    const params = {
      InsReq: temp,
      UserId: auth.userInfo.userId,
      MenuType: base.storeMenuType,
    };

    const res = await KioskAPI.postInstallList(params);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return;
    }

    toast.success('저장되었습니다.');
  } catch (e) {
    toastApi.errorFromException(e);
  } finally {
    isSubmitting.value = false;
  }
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
        <!-- 설치수량 -->
        <template #cell-insCnt="{ item }">
          <CFormInput v-model="item.insCnt" type="number" size="sm" class="text-center" />
        </template>

        <!-- 폐기수량 -->
        <template #cell-expCnt="{ item }">
          <CFormInput v-model="item.expCnt" type="number" size="sm" class="text-center" />
        </template>

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
          <div v-if="item?.amtStartYmd === '' || item?.amtStartYmd === null" class="d-flex gap-1">
            <Datepicker v-model="item.amtStartYmdInput" v-bind="datepickerFixed" locale="ko" style="width:140px;" :ui="{ input: 'form-control form-control-sm' }" />
            <CButton color="success" size="sm" @click="amtManagerStart(item)">과금시작</CButton>
          </div>

          <div v-else>
            {{ formatYmd(item?.amtStartYmd) }}
          </div>
        </template>

        <!-- 메모 -->
        <template #cell-memo="{ item }">
          <CFormInput v-model="item.memo" size="sm" />
        </template>
      </UiDataTable>
    </CCardBody>
  </CCard>
  <div class="d-flex justify-content-end gap-2">
    <CButton color="secondary" @click="() => router.back()">뒤로</CButton>
    <CButton color="primary" @click="onSave">저장</CButton>
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
