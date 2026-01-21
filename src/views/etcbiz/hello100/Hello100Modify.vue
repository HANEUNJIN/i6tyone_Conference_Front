<script setup>
import { computed, onMounted, ref } from 'vue';
import UiGridTable from '@/components/ui/UiGridTable.vue';
import UiLoading from '@/components/ui/UiLoading.vue';
import { useRoute, useRouter } from 'vue-router';
import { useApiToast } from '@/composables/useApiToast';
import { useBaseStore } from '@/stores/base';
import { Hello100 } from '@/api/hello100';
import { datepickerFixed, formatYmd, isValidateEmpty, logFormData, toYmdCompact } from '@/utils/common';
import { CFormSelect, CFormTextarea } from '@coreui/vue';
import Datepicker from '@vuepic/vue-datepicker';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';

// ----------------------
// ✨ composable / store
// ----------------------
const base = useBaseStore();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const toastApi = useApiToast();
const modal = useConfirmModal();
const auth = useAuthStore();

const licenseCd = computed(() => route.query.licenseCd || '');
const storeMenuType = computed(() => route.query.storeMenuType || '');

// ----------------------
// ✨ reactive state
// ----------------------
const isLoading = ref(false);
const isSubmitting = ref(false);

const detailInfo = ref({});
const confirmYn = ref(false);
const procSetYn = ref(false);
const sendYn = ref(false);

const isConfirmYn = computed({
  get: () => detailInfo.value.confirmYn !== 'N',
  set: (val) => {
    detailInfo.value.confirmYn = val ? 'Y' : 'N';
  },
});

const isProcTrsYn = computed({
  get: () => detailInfo.value.procTrsYn === 'Y',
  set: (val) => {
    detailInfo.value.procTrsYn = val ? 'Y' : 'N';
  },
});

const isProcSetYn = computed({
  get: () => detailInfo.value.procSetYn !== 'N',
  set: (val) => {
    detailInfo.value.procSetYn = val ? 'Y' : 'N';
  },
});

const isHello100Yn = computed({
  get: () => detailInfo.value.hello100Yn === 'Y',
  set: (val) => {
    detailInfo.value.hello100Yn = val ? 'Y' : 'N';
  },
});

const isProcFinalYn = computed({
  get: () => detailInfo.value.procFinalYn === 'Y',
  set: (val) => {
    detailInfo.value.procFinalYn = val ? 'Y' : 'N';
  },
});

const isSendYn = computed({
  get: () => detailInfo.value.sendYn === 'Y',
  set: (val) => {
    detailInfo.value.sendYn = val ? 'Y' : 'N';
  },
});

const isSendTestResultYn = computed({
  get: () => detailInfo.value.sendTestResultYn === 'Y',
  set: (val) => {
    detailInfo.value.sendTestResultYn = val ? 'Y' : 'N';
  },
});

const procAccStepOptions = ref([
  { value: '', name: '선택' },
  { value: 'ready', name: '연동전' },
  { value: 'accept', name: '연동완료' },
  { value: 'cancel', name: '설치취소' },
  { value: 'etc', name: '보류' },
]);

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
    key: 'addr',
    colspan: true,
  },
  {
    label1: '대표자명',
    key1: 'capNm',
    label2: '전화번호',
    key2: 'telNo',
  },
  {
    label1: '신청자명',
    key1: 'entEmplNm',
    label2: '신청일자',
    value2: '자동입력',
  },
  {
    label1: '대리점 승인여부',
    key1: 'confirmYn',
    label2: '병원패키지 전달여부',
    key2: 'procTrsYn',
  },
  {
    label1: '대리점 세팅여부',
    key1: 'procSetYn',
    label2: '라이선스 발급여부',
    key2: 'hello100Yn',
  },
  {
    label1: 'hello100 연동여부',
    key1: 'procAccStep',
    label2: '설치완료여부',
    key2: 'procFinalYn',
  },
  {
    label1: '알림톡(접수) 발송여부',
    key1: 'sendYn',
    label2: '알림톡(검사) 발송여부',
    key2: 'sendTestResultYn',
  },
  {
    label1: '대리점 전달사항',
    key: 'memo',
    colspan: true,
  },
]);

const handleDateReset = () => {
  detailInfo.value.sendStartYmd = '';
  detailInfo.value.sendEndYmd = '';
};

const validateForm = (f) => {
  if (isConfirmYn.value && isValidateEmpty(f.confirmYmYmd)) {
    return '대리점 승인여부 일자를 입력해주세요.';
  }

  if (isProcSetYn.value && isValidateEmpty(f.procSetYnYmd)) {
    return '대리점 세팅여부 일자를 입력해주세요.';
  }

  if (isSendYn.value) {
    if(isValidateEmpty(f.sendStartYmd)) {
      return '알림톡 시작일을 입력 해주세요.';
    }

    if(isValidateEmpty(f.sendEndYmd)) {
      return '알림톡 종료일을 입력 해주세요.';
    }
  }

  if(f.procAccStep === 'accept' && f.procAccYn === 'Y') {
    return '연동완료 날짜를 선택해주세요.';
  }
};

const handleSubmit = async () => {
  if (isSubmitting.value)
    return;

  const msg = validateForm(detailInfo.value);
  if (msg)
    return toast.error(msg);

  const confirm = await modal.show({
    title: '저장',
    message: '수정 내용을 저장하시겠습니까?',
    confirmText: '저장',
  });
  if (!confirm)
    return;

  try {
    isSubmitting.value = true;

    const params = buildParams();
    const formData = createFormData(params);
    logFormData(formData);

    const res = await Hello100.putModify(formData);
    if (!res.ok)
      return toastApi.errorFromResult(res);

    toast.success('저장되었습니다.');
    router.back();
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

const buildParams = () => {
  return {
    licenseCd: licenseCd.value,
    hospNo: detailInfo.value.hospNo,
    hospNm: detailInfo.value.hospNm,
    addr: detailInfo.value.addr,
    capNm: detailInfo.value.capNm,
    telNo: detailInfo.value.telNo,
    entEmplNm: detailInfo.value.entEmplNm,
    deptCd: detailInfo.value.deptCd,
    userId: auth?.userInfo?.userId ?? '',
    procAccStep: detailInfo.value.procAccStep,
    confirmYn: detailInfo.value.confirmYn !== 'N' ? toYmdCompact(detailInfo.value.confirmYmYmd) : 'N',
    procSetYn: detailInfo.value.procSetYn !== 'N' ? toYmdCompact(detailInfo.value.procSetYnYmd) : 'N',
    procAccYn: detailInfo.value.procAccStep === 'accept' && detailInfo.value.procAccYn !== 'N' ? toYmdCompact(detailInfo.value.procAccYn) : 'Y',
    procTrsYn: detailInfo.value.procTrsYn,
    hello100Yn: detailInfo.value.hello100Yn,
    procFinalYn: detailInfo.value.procFinalYn,
    memo: detailInfo.value.memo,
    sendYn: detailInfo.value.sendYn,
    endYn: detailInfo.value.endYn,
    sendStartYmd: toYmdCompact(detailInfo.value.sendStartYmd),
    sendEndYmd: toYmdCompact(detailInfo.value.sendEndYmd),
    oriSendTestResultYn: detailInfo.value.oriSendTestResultYn,
    sendTestResultYn: detailInfo.value.sendTestResultYn,
    oriSendYn: detailInfo.value.oriSendYn,
    oriSendStartYmd: detailInfo.value.oriSendStartYmd,
    oriSendEndYmd: detailInfo.value.oriSendEndYmd,
    menuType: base.storeMenuType,
  };
};

const createFormData = (p) => {
  const fd = new FormData();
  const append = (k, v) => fd.append(k, v ?? '');

  append('LicenseCd', p.licenseCd);
  append('HospNo', p.hospNo);
  append('HospNm', p.hospNm);
  append('addr', p.addr);
  append('CapNm', p.capNm);
  append('TelNo', p.telNo);
  append('EntEmplNm', p.entEmplNm);
  append('DeptCd', p.deptCd);
  append('UserId', p.userId);
  append('ProcAccStep', p.procAccStep);
  append('ConfirmYn', p.confirmYn);
  append('ProcSetYn', p.procSetYn);
  append('ProcAccYn', p.procAccYn);
  append('ProcTrsYn', p.procTrsYn);
  append('Hello100Yn', p.hello100Yn);
  append('ProcAccStep', p.procAccStep);
  append('ProcFinalYn', p.procFinalYn);
  append('Memo', p.memo);
  append('SendYn', p.sendYn);
  append('EndYn', p.endYn);
  append('SendStartYmd', p.sendStartYmd);
  append('SendEndYmd', p.sendEndYmd);
  append('oriSendTestResultYn', p.oriSendTestResultYn);
  append('SendTestResultYn', p.sendTestResultYn);
  append('oriSendYn', p.oriSendYn);
  append('oriSendStartYmd', p.oriSendStartYmd);
  append('oriSendEndYmd', p.oriSendEndYmd);
  append('menuType', p.menuType);

  return fd;
};

const fetchDetail = async () => {
  if (!licenseCd.value)
    return;

  isLoading.value = true;

  const params = {
    licenseCd: licenseCd.value,
    menuType: base.storeMenuType,
  };

  try {
    const res = await Hello100.getDetail(params);
    if (!res.ok)
      return toastApi.errorFromResult(res);

    detailInfo.value = res.data?.resultData ?? {};
    detailInfo.value.confirmYmYmd = formatYmd(detailInfo.value.confirmYn);
    detailInfo.value.procSetYnYmd = formatYmd(detailInfo.value.procSetYn);
    detailInfo.value.procAccYn = formatYmd(detailInfo.value.procAccYn);
    detailInfo.value.sendStartYmd = formatYmd(detailInfo.value.sendStartYmd);
    detailInfo.value.sendEndYmd = formatYmd(detailInfo.value.sendEndYmd);
    detailInfo.value.oriSendTestResultYn = detailInfo.value.sendTestResultYn;
    detailInfo.value.oriSendYn = detailInfo.value.sendYn;
  } catch (e) {
    toastApi.errorFromException(e);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchDetail();
});
</script>

<template>
  <CCard class="mb-3">
    <CCardHeader class="d-flex justify-content-between align-items-center">
      <h6 class="mb-0">수정</h6>
    </CCardHeader>
    <CCardBody>
      <div class="loading" v-if="isLoading">
        <UiLoading />
      </div>
      <UiGridTable :fields="statusInfoFields">
        <!--주소-->
        <template #value-addr>
          <CFormInput v-model="detailInfo.addr" size="sm" />
        </template>

        <!--대표자명-->
        <template #value-capNm>
          <CFormInput v-model="detailInfo.capNm" size="sm" />
        </template>

        <!--신청자명-->
        <template #value-entEmplNm>
          <CFormInput v-model="detailInfo.entEmplNm" size="sm" />
        </template>

        <!--대리점 승인여부-->
        <template #value-confirmYn>
          <div class="d-flex align-items-center">
            <CFormCheck
              class="checkbox"
              id="procSetYn"
              v-model="isConfirmYn"
            />
            <div v-if="isConfirmYn" class="ms-2">
              <Datepicker
                v-model="detailInfo.confirmYmYmd"
                v-bind="datepickerFixed"
                locale="ko"
                :ui="{ input: 'form-control form-control-sm' }"
              />
            </div>
          </div>
        </template>

        <!--전화번호-->
        <template #value-telNo>
          <CFormInput v-model="detailInfo.telNo" size="sm" />
        </template>

        <!--병원패키지 전달여부-->
        <template #value-procTrsYn>
          <CFormCheck
            class="checkbox"
            id="procTrsYn"
            v-model="isProcTrsYn"
          />
        </template>

        <!--대리점 세팅여부-->
        <template #value-procSetYn>
          <div class="d-flex align-items-center">
            <CFormCheck
              class="checkbox"
              id="procSetYn"
              v-model="isProcSetYn"
            />
            <div v-if="isProcSetYn" class="ms-2">
              <Datepicker
                v-model="detailInfo.procSetYnYmd"
                v-bind="datepickerFixed"
                locale="ko"
                :ui="{ input: 'form-control form-control-sm' }"
              />
            </div>
          </div>
        </template>

        <!--라이선스 발급여부-->
        <template #value-hello100Yn>
          <CFormCheck
            class="checkbox"
            id="hello100Yn"
            v-model="isHello100Yn"
            label="※ 라이선스는 한 번 발급 이후 취소되지 않으며 취소 070-7170-9229 연락주세요."
          />
        </template>

        <!--hello100 연동여부-->
        <template #value-procAccStep>
          <div class="d-flex align-items-center">
            <CFormSelect v-model="detailInfo.procAccStep" size="sm">
              <option v-for="opt in procAccStepOptions" :key="opt.value" :value="opt.value">
                {{ opt.name }}
              </option>
            </CFormSelect>

            <div class="ms-2">
              <Datepicker
                v-model="detailInfo.procAccYn"
                v-bind="datepickerFixed"
                locale="ko"
                :ui="{ input: 'form-control form-control-sm' }"
              />
            </div>
          </div>
        </template>

        <!--설치완료여부-->
        <template #value-procFinalYn>
          <CFormCheck
            class="checkbox"
            id="procFinalYn"
            v-model="isProcFinalYn"
          />
        </template>

        <!--알림톡(접수) 발송여부-->
        <template #value-sendYn>
          <div class="d-flex align-items-center">
            <CFormCheck
              class="checkbox"
              id="sendYn"
              v-model="isSendYn"
            />
            <div class="ms-2 d-flex flex-row align-items-center gap-1">
              <Datepicker
                v-model="detailInfo.sendStartYmd"
                v-bind="datepickerFixed"
                locale="ko"
                :ui="{ input: 'form-control form-control-sm' }"
              />
              <span>~</span>
              <Datepicker
                v-model="detailInfo.sendEndYmd"
                v-bind="datepickerFixed"
                locale="ko"
                :ui="{ input: 'form-control form-control-sm' }"
              />

              <CButton color="secondary" size="sm" @click="handleDateReset">날짜 초기화</CButton>
            </div>
          </div>
        </template>

        <!--알림톡(검사) 발송여부-->
        <template #value-sendTestResultYn>
          <CFormCheck
            class="checkbox"
            id="sendTestResultYn"
            v-model="isSendTestResultYn"
          />
        </template>

        <!--대리점 전달사항-->
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
