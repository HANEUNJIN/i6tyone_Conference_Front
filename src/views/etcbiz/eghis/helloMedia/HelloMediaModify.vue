<script setup>
import { useRoute, useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { useApiToast } from '@/composables/useApiToast';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { computed, onMounted, ref } from 'vue';
import { datepickerFixed, logFormData, toYmdCompact } from '@/utils/common';
import UiGridTable from '@/components/ui/UiGridTable.vue';
import UiLoading from '@/components/ui/UiLoading.vue';
import { CFormSelect, CFormTextarea } from '@coreui/vue';
import { CommonAPI } from '@/api/temp/common';
import { HelloMediaAPI } from '@/api/helloMedia';
import { useBaseStore } from '@/stores/base';
import Datepicker from '@vuepic/vue-datepicker';

// ----------------------
// ✨ composable / store
// ----------------------
const route = useRoute();
const router = useRouter();
const toast = useToast();
const toastApi = useApiToast();
const base = useBaseStore();
const modal = useConfirmModal();

// ----------------------
// ✨ reactive state
// ----------------------
const licenseCd = computed(() => route.query.licenseCd || '');

const detailInfo = ref({});
const isLoading = ref(false);
const isSubmitting = ref(false);

const displayprocSetYn = computed({
  get: () => (detailInfo.value.procSetYn !== 'N' ? '2' : '1'),
  set: (val) => {
    detailInfo.value.procSetYn = val;
  },
});

const branchOptions = ref([]);
const deptCdOptions = ref([]);

const helloMediaYnOptions = ref([
  { codeId: '', codeNm: '연동현황' },
  { codeId: 'Y', codeNm: '완료' },
  { codeId: 'N', codeNm: '미완료' },
]);

const branchEtcOptions = ref([
  { codeId: '', codeNm: '선택' },
  { codeId: '1', codeNm: '이원의료재단' },
  { codeId: '2', codeNm: '녹십자' },
  { codeId: '3', codeNm: '씨젠' },
  { codeId: '4', codeNm: '아름누리' },
]);

const procTrsYnOptions = ref([
  { codeId: '', codeNm: '선택' },
  { codeId: '1', codeNm: '신청' },
  { codeId: '2', codeNm: '접수확인' },
  { codeId: '3', codeNm: '접수완료' },
  { codeId: '4', codeNm: '신청취소' },
]);

const procAccStepOptions = ref([
  { codeId: '', codeNm: '배송현황' },
  { codeId: '1', codeNm: '배송계획 중' },
  { codeId: '2', codeNm: '배송계획 완료' },
  { codeId: '3', codeNm: '배송계획 확정' },
]);

const procSetYnOptions = ref([
  { codeId: '', codeNm: '선택' },
  { codeId: '1', codeNm: '설치일자확정' },
  { codeId: '2', codeNm: '설치완료' },
]);

const reviewStOptions = ref([
  { codeId: '', codeNm: '선택' },
  { codeId: '1', codeNm: '조사 전' },
  { codeId: '2', codeNm: '조사 완료' },
]);

const memberInfoFields = computed(() => [
  {
    label1: '라이선스번호',
    value1: detailInfo.value.licenseCd || '',
    colspan: true,
  },
  {
    label1: '병원명',
    key1: 'hospNm',
    label2: '요양기관번호',
    key2: 'hospNo',
  },
  {
    label1: '대표자성명',
    value1: detailInfo.value.capNm || '',
    label2: '전화번호',
    key2: 'telNo',
  },
  {
    label1: '주소지',
    key: 'addr',
    colspan: true,
  },
  {
    label1: '담당대리점',
    key1: 'branchCd',
    label2: '타대리점',
    key2: 'branchCdEtc',
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
    key2: 'deptCd',
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
    key: 'helloMediaYn',
    colspan: true,
  },
  {
    label1: '신청현황',
    key: 'procTrsYn',
    colspan: true,
  },
  {
    label1: '배송현황',
    key: 'procAccStep',
    colspan: true,
  },
  {
    label1: '설치현황',
    key: 'procSetYn',
    colspan: true,
  },
  {
    label1: '만족도',
    key: 'reviewSt',
    colspan: true,
  },
  {
    label1: '메모',
    key: 'memo',
    colspan: true,
  },
]);

const getCommonCode = async () => {
  try {
    //진료과목
    const deptParams = {
      path: 'A0002',
      menuType: base.storeMenuType,
    };
    const vanStepCdNmRes = await CommonAPI.getPmMstKey1(deptParams);
    if (!vanStepCdNmRes.ok) {
      toastApi.errorFromResult(vanStepCdNmRes);
      return;
    }
    deptCdOptions.value = [
      { codeId: '', codeNm: '선택' },
      ...(vanStepCdNmRes.data?.resultData?.list ?? []),
    ];

    //담당대리점
    const branchRes = await CommonAPI.getBranchCorp({
      bonsaFlag: '',
      menuType: base.storeMenuType,
    });
    if (!branchRes.ok) {
      toastApi.errorFromResult(branchRes);
    }
    const branchList = branchRes.data?.resultData?.list ?? [];
    branchOptions.value = [{ codeId: '', codeNm: '선택' }, ...branchList];
  } catch (e) {
    toast.error(e?.message || '계약현황 정보를 불러오지 못했습니다.');
  }
};

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

const handleSubmit = async () => {
  if (isSubmitting.value) return;

  if (displayprocSetYn.value === '2' && detailInfo.value.procSetYnNm === '') {
    toast.error('설치완료 날짜를 입력해주세요.');
    return;
  }

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

    const res = await HelloMediaAPI.putModify(formData);
    if (!res.ok) return toastApi.errorFromResult(res);

    toast.success('저장되었습니다.');
    router.back();
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

const buildParams = () => {
  return {
    hospNo: detailInfo.value.hospNo,
    procAccYn: '',
    procTrsYn: detailInfo.value.procTrsYn,
    procAccStep: detailInfo.value.procAccStep,
    branchCd: detailInfo.value.branchCd,
    branchCdEtc: detailInfo.value.branchCdEtc,
    memo: detailInfo.value.memo,
    deptCd: detailInfo.value.deptCd,
    procSetYn:
      detailInfo.value.procSetYn === '1' ? '1' : toYmdCompact(detailInfo.value.procSetYnNm),
    reviewSt: detailInfo.value.reviewSt,
    licenseCd: detailInfo.value.licenseCd,
    addr: detailInfo.value.addr,
    telNo: detailInfo.value.telNo,
    hospNm: detailInfo.value.hospNm,
    helloMediaYn: detailInfo.value.helloMediaYn,
    procCode: detailInfo.value.procCode,
  };
};

const createFormData = (p) => {
  const fd = new FormData();
  const append = (k, v) => fd.append(k, v ?? '');

  append('HospNo', p.hospNo);
  append('ProcAccYn', p.procAccYn);
  append('ProcTrsYn', p.procTrsYn);
  append('ProcAccStep', p.procAccStep);
  append('BranchCd', p.branchCd);
  append('BranchCdEtc', p.branchCdEtc);
  append('Memo', p.memo);
  append('DeptCd', p.deptCd);
  append('ProcSetYn', p.procSetYn);
  append('ReviewSt', p.reviewSt);
  append('LicenseCd', licenseCd.value);
  append('Addr', p.addr);
  append('TelNo', p.telNo);
  append('HospNm', p.hospNm);
  append('HelloMediaYn', p.helloMediaYn);
  append('ProcCode', p.procCode);
  return fd;
};

onMounted(() => {
  getCommonCode();
  fetchDetail();
});
</script>

<template>
  <!--회원정보-->
  <CCard class="mb-3">
    <CCardHeader class="d-flex justify-content-between align-items-center">
      <h6 class="mb-0">회원정보</h6>
    </CCardHeader>
    <CCardBody>
      <div class="loading" v-if="isLoading">
        <UiLoading />
      </div>
      <UiGridTable :fields="memberInfoFields">
        <!--병원명-->
        <template #value-hospNm>
          <CFormInput v-model="detailInfo.hospNm" size="sm" />
        </template>

        <!--요양기관번호-->
        <template #value-hospNo>
          <CFormInput v-model="detailInfo.hospNo" size="sm" />
        </template>

        <!--전화번호-->
        <template #value-telNo>
          <CFormInput v-model="detailInfo.telNo" size="sm" />
        </template>

        <!--주소지-->
        <template #value-addr>
          <CFormInput v-model="detailInfo.addr" size="sm" />
        </template>

        <!--담당대리점-->
        <template #value-branchCd>
          <CFormSelect v-model="detailInfo.branchCd" size="sm">
            <option v-for="opt in branchOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
        </template>

        <!--타대리점-->
        <template #value-branchCdEtc>
          <CFormSelect v-model="detailInfo.branchCdEtc" size="sm">
            <option v-for="opt in branchEtcOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
        </template>

        <!--진료과목-->
        <template #value-deptCd>
          <CFormSelect v-model="detailInfo.deptCd" size="sm">
            <option v-for="opt in deptCdOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
        </template>
      </UiGridTable>
    </CCardBody>
  </CCard>

  <!--옵션 정보-->
  <CCard class="mb-3">
    <CCardHeader><h6 class="mb-0">옵션 정보</h6></CCardHeader>
    <CCardBody>
      <div class="loading" v-if="isLoading">
        <UiLoading />
      </div>
      <UiGridTable :fields="optionsInfoFields" />
    </CCardBody>
  </CCard>

  <!--설치환경-->
  <CCard class="mb-3">
    <CCardHeader><h6 class="mb-0">설치환경</h6></CCardHeader>
    <CCardBody>
      <div class="loading" v-if="isLoading">
        <UiLoading />
      </div>
      <UiGridTable :fields="installInfoFields" />
    </CCardBody>
  </CCard>

  <!--상태-->
  <CCard class="mb-3">
    <CCardHeader class="d-flex justify-content-between align-items-center">
      <h6 class="mb-0">상태</h6>
    </CCardHeader>
    <CCardBody>
      <div class="loading" v-if="isLoading">
        <UiLoading />
      </div>
      <UiGridTable :fields="statusInfoFields">
        <!--연동현황-->
        <template #value-helloMediaYn>
          <CFormSelect v-model="detailInfo.helloMediaYn" size="sm">
            <option v-for="opt in helloMediaYnOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
        </template>

        <!--신청현황-->
        <template #value-procTrsYn>
          <CFormSelect v-model="detailInfo.procTrsYn" size="sm">
            <option v-for="opt in procTrsYnOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
        </template>

        <!--배송현황-->
        <template #value-procAccStep>
          <CFormSelect v-model="detailInfo.procAccStep" size="sm">
            <option v-for="opt in procAccStepOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
        </template>

        <!--설치현황-->
        <template #value-procSetYn>
          <div class="d-flex align-items-center">
            <CFormSelect v-model="displayprocSetYn" size="sm">
              <option v-for="opt in procSetYnOptions" :key="opt.codeId" :value="opt.codeId">
                {{ opt.codeNm }}
              </option>
            </CFormSelect>
            <div v-if="displayprocSetYn === '2'" class="ms-2">
              <Datepicker v-model="detailInfo.procSetYnNm" v-bind="datepickerFixed" locale="ko" :ui="{ input: 'form-control form-control-sm' }" />
            </div>
          </div>
        </template>

        <!--만족도-->
        <template #value-reviewSt>
          <CFormSelect v-model="detailInfo.reviewSt" size="sm">
            <option v-for="opt in reviewStOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
        </template>

        <!--메모-->
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
