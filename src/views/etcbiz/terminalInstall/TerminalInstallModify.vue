<script setup>
import { computed, onMounted, ref } from 'vue';
import UiGridTable from '@/components/ui/UiGridTable.vue';
import UiLoading from '@/components/ui/UiLoading.vue';
import { TerminalInstallAPI } from '@/api/temp/terminalInstall';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { useApiToast } from '@/composables/useApiToast';
import { useConfirmModal } from '@/composables/useConfirmModal';
import {
  datepickerFixed,
  formatPhoneKR,
  formatYmd,
  logFormData,
  toYmdCompact,
} from '@/utils/common';
import Datepicker from '@vuepic/vue-datepicker';
import { CFormSelect, CFormTextarea } from '@coreui/vue';
import { CommonAPI } from '@/api/temp/common';
import { useBaseStore } from '@/stores/base';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const toastApi = useApiToast();
const modal = useConfirmModal();
const base = useBaseStore();

const contractNo = computed(() => route.query.contractNo || '');
const licenseCd = computed(() => route.query.licenseCd || '');

const detailInfo = ref({});
const isLoading = ref(false);
const isSubmitting = ref(false);

const vanStepCdNm = ref('');
const vanStepCdNmOptions = ref([]);

const insStepCdNm = ref('');
const insStepCdNmOptions = ref([]);

const chartYnOptions = ref([
  { value: '', name: '선택' },
  { value: 'Y', name: '연동' },
  { value: 'N', name: '비연동' },
]);

const insConfirmYnOptions = ref([
  { value: 'Y', name: '확인' },
  { value: 'N', name: '미확인' },
]);

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
  { label1: '연동현황', colspan: true, key: 'chartYn' },
  { label1: '계약현황', colspan: true, key: 'vanStepCdNm' },
  { label1: '계약일자', colspan: true, key: 'signYmd' },
  { label1: '설치현황', colspan: true, key: 'insStepCdNm' },
  { label1: '설치일자', colspan: true, key: 'insEndYmd' },
  { label1: '설치확인서', colspan: true, key: 'insConfirmYn' },
  { label1: '메모', colspan: true, key: 'memo' },
]);

const getCommonCode = async () => {
  try {
    //계약현황
    const vanStepCdNmRes = await CommonAPI.getCode('A33');
    if (!vanStepCdNmRes.ok) {
      toastApi.errorFromResult(vanStepCdNmRes);
      return;
    }
    vanStepCdNmOptions.value = [
      { codeId: '', codeNm: '선택' },
      ...(vanStepCdNmRes.data?.resultData?.list ?? []),
    ];

    //설치현황
    const insStepCdNmRes = await CommonAPI.getCode('A34');
    if (!insStepCdNmRes.ok) {
      toastApi.errorFromResult(insStepCdNmRes);
      return;
    }
    insStepCdNmOptions.value = [
      { codeId: '', codeNm: '선택' },
      ...(insStepCdNmRes.data?.resultData?.list ?? []),
    ];
  } catch (e) {
    toast.error(e?.message || '계약현황 정보를 불러오지 못했습니다.');
  }
};

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

const handleSubmit = async () => {
  if (isSubmitting.value) return;

  const confirm = await modal.show({
    title: '저장',
    message: '수정 내용을 저장하시겠습니까?',
    confirmText: '저장',
  });
  if (!confirm) return;

  try {
    isSubmitting.value = true;

    const params = buildParams();
    const formData = createFormData(params);
    logFormData(formData);

    const res = await TerminalInstallAPI.putModify(params);
    if (!res.ok) return toastApi.errorFromResult(res);

    toast.success('저장되었습니다.');
    router.back();
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

const buildParams = () => {
  return {
    licenseCd: licenseCd.value,
    contractNo: contractNo.value,
    vanStep: detailInfo.value.vanStep,
    signYmd: detailInfo.value.vanStep === 'A3303' ? toYmdCompact(detailInfo.value.signYmd) : '',
    insEndYmd: detailInfo.value.insStep === 'A3402' ? toYmdCompact(detailInfo.value.insEndYmd) : '',
    insStep: detailInfo.value.insStep,
    insConfirmYn: detailInfo.value.insConfirmYn,
    chartYn: detailInfo.value.chartYn,
    memo: detailInfo.value.memo,
  };
};

const createFormData = (p) => {
  const fd = new FormData();
  const append = (k, v) => fd.append(k, v ?? '');
  append('LicenseCd', p.licenseCd);
  append('ContractNo', p.contractNo);
  append('VanStep', p.vanStep);
  append('SignYmd', p.signYmd);
  append('InsEndYmd', p.insEndYmd);
  append('InsStep', p.insStep);
  append('InsConfirmYn', p.insConfirmYn);
  append('ChartYn', p.chartYn);
  append('Memo', p.memo);
  return fd;
};

onMounted(() => {
  getCommonCode();
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
      <UiGridTable :fields="statusInfoFields">
        <template #value-chartYn>
          <CFormSelect v-model="detailInfo.chartYn" size="sm">
            <option v-for="opt in chartYnOptions" :key="opt.value" :value="opt.value">
              {{ opt.name }}
            </option>
          </CFormSelect>
        </template>
        <template #value-vanStepCdNm>
          <CFormSelect v-model="detailInfo.vanStepCdNm" size="sm">
            <option v-for="opt in vanStepCdNmOptions" :key="opt.value" :value="opt.value">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
        </template>
        <template #value-signYmd>
          <Datepicker v-model="detailInfo.signYmd" v-bind="datepickerFixed" locale="ko" :ui="{ input: 'form-control form-control-sm' }" />
        </template>
        <template #value-insStepCdNm>
          <CFormSelect v-model="detailInfo.insStepCdNm" size="sm">
            <option v-for="opt in insStepCdNmOptions" :key="opt.value" :value="opt.value">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
        </template>
        <template #value-insEndYmd>
          <Datepicker v-model="detailInfo.insEndYmd" v-bind="datepickerFixed" locale="ko" :ui="{ input: 'form-control form-control-sm' }" />
        </template>
        <template #value-insConfirmYn>
          <CFormSelect v-model="detailInfo.insConfirmYn" size="sm">
            <option v-for="opt in insConfirmYnOptions" :key="opt.value" :value="opt.value">
              {{ opt.name }}
            </option>
          </CFormSelect>
        </template>
        <template #value-memo>
          <CFormTextarea v-model="detailInfo.memo" rows="3" />
        </template>
      </UiGridTable>
    </CCardBody>
  </CCard>
  <div class="d-flex justify-content-end gap-2">
    <CButton color="secondary" @click="router.back()">뒤로</CButton>
    <CButton color="primary" @click="handleSubmit">저장</CButton>
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
