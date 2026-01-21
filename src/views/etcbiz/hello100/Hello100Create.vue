<script setup>
import UiGridTable from '@/components/ui/UiGridTable.vue';
import UiLoading from '@/components/ui/UiLoading.vue';
import { CFormSelect, CFormTextarea } from '@coreui/vue';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { useApiToast } from '@/composables/useApiToast';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { ROUTE } from '@/constants/routeName';
import { datepickerFixed, logFormData, toYmdCompact } from '@/utils/common';
import { Hello100 } from '@/api/hello100';
import { useAuthStore } from '@/stores/auth';
import { useBaseStore } from '@/stores/base';
import { CommonAPI } from '@/api/temp/common';
import Datepicker from '@vuepic/vue-datepicker';

// ----------------------
// ✨ composable / store
// ----------------------
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const toast = useToast();
const toastApi = useApiToast();
const modal = useConfirmModal();
const base = useBaseStore();

// ----------------------
// ✨ reactive state
// ----------------------
const isLoading = ref(false);
const isSubmitting = ref(false);
const statusOptions = ref([]);
const deptNm = ref('FM');
const procFinalYn = ref(false);
const procTrsYn = ref(false);
const hello100Yn = ref(false);
const confirmYn = ref(false);
const procSetYn = ref(false);
const procSetYmd = ref(new Date().toISOString().slice(0, 10));
const confirmYmd = ref(new Date().toISOString().slice(0, 10));

const procAccStepOptions = ref([
  { value: 'ready', name: '연동전' },
  { value: 'accept', name: '연동완료' },
  { value: 'cancel', name: '설치취소' },
  { value: 'etc', name: '보류' },
]);
const procAccStepNm = ref('ready');

const form = reactive({
  licenseCd: '',
  hospNo: '',
  hospNm: '',
  addr: '',
  capNm: '',
  telNo: '',
  entEmplNm: '',
  memo: '',
});

const statusInfoFields = computed(() => {
  const fields = [
    {
      label1: '라이선스번호',
      key1: 'licenseCd',
      label2: '요양기관번호',
      key2: 'hospNo',
    },
    {
      label1: '병원명',
      key1: 'hospNm',
      label2: '진료과',
      key2: 'deptNm',
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
      key1: 'procAccStepNm',
      label2: '설치완료여부',
      key2: 'procFinalYn',
    },
    {
      label1: '대리점 전달사항',
      key: 'memo',
      colspan: true,
    },
  ];

  return fields;
});

const handleSubmit = async () => {
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

    const params = buildParams();
    const formData = createFormData(params);
    logFormData(formData);

    const res = await Hello100.postCreate(formData);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return;
    }

    toast.success('저장되었습니다.');
    handleBack();
  } catch (e) {
    toastApi.errorFromException(e);
  } finally {
    isSubmitting.value = false;
  }
};

const buildParams = () => {
  return {
    licenseCd: form.licenseCd,
    hospNo: form.hospNo,
    hospNm: form.hospNm,
    addr: form.addr,
    capNm: form.capNm,
    telNo: form.telNo,
    entEmplNm: form.entEmplNm,
    deptCd: deptNm.value,
    userId: auth?.userInfo?.userId ?? '',
    confirmYn: confirmYn.value ? toYmdCompact(confirmYmd.value) : 'N',
    procSetYn: procSetYn.value ? toYmdCompact(procSetYmd.value) : 'N',
    procTrsYn: procTrsYn.value ? 'Y' : 'N',
    hello100Yn: hello100Yn.value ? 'Y' : 'N',
    procAccStep: procAccStepNm.value,
    procFinalYn: procFinalYn.value ? 'Y' : 'N',
    menuType: base.storeMenuType,
  };
};

const createFormData = (p) => {
  const fd = new FormData();

  const append = (k, v) => fd.append(k, v ?? '');
  append('licenseCd', p.licenseCd);
  append('hospNo', p.hospNo);
  append('hospNm', p.hospNm);
  append('addr', p.addr);
  append('capNm', p.capNm);
  append('telNo', p.telNo);
  append('entEmplNm', p.entEmplNm);
  append('deptCd', p.deptCd);
  append('userId', p.userId);
  append('confirmYn', p.confirmYn);
  append('procSetYn', p.procSetYn);
  append('procTrsYn', p.procTrsYn);
  append('hello100Yn', p.hello100Yn);
  append('procAccStep', p.procAccStep);
  append('procFinalYn', p.procFinalYn);
  append('storeMenuType', p.storeMenuType);

  return fd;
};

const handleBack = () => {
  const routeName = base.storeMenuType === 'E' ? ROUTE.Etcbiz.Hello100.List : ROUTE.NixEtcbiz.Hello100.List;

  router.push({
    name: routeName,
    query: route.query,
  });
};

const getSearchOptions = async () => {
  const params = {
    path: 'A0002',
    menuType: base.storeMenuType,
  };
  const res = await CommonAPI.getPmMstKey1(params);
  if (!res.ok) {
    toastApi.errorFromResult(res);
    return;
  }

  const writeUserList = res.data?.resultData?.list ?? [];
  const wuOptions = writeUserList.map((it) => ({
    codeId: it.codeId ?? '',
    codeNm: it.codeNm ?? '',
  }));

  statusOptions.value = [...wuOptions];
};

onMounted(() => {
  getSearchOptions();
});

watch(
  () => form.procSetYn,
  (checked) => {
    if (!checked) form.happyCallYmd = null;
  },
);
</script>

<template>
  <CCard class="mb-3">
    <CCardHeader class="d-flex justify-content-between align-items-center">
      <h6 class="mb-0">헬로100 등록</h6>
      <div class="d-flex justify-content-end gap-2">
        <CButton color="secondary" size="sm" @click="router.back()">뒤로</CButton>
        <CButton color="primary" size="sm" @click="handleSubmit">저장</CButton>
      </div>
    </CCardHeader>
    <CCardBody>
      <div class="loading" v-if="isLoading">
        <UiLoading />
      </div>
      <UiGridTable :fields="statusInfoFields">
        <template #value-licenseCd>
          <CFormInput v-model="form.licenseCd" size="sm"> </CFormInput>
        </template>
        <template #value-hospNo>
          <CFormInput v-model="form.hospNo" size="sm"> </CFormInput>
        </template>
        <template #value-hospNm>
          <CFormInput v-model="form.hospNm" size="sm"> </CFormInput>
        </template>
        <template #value-deptNm>
          <CFormSelect v-model="deptNm" size="sm">
            <option v-for="(opt, idx) in statusOptions" :key="idx" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
        </template>
        <template #value-addr>
          <CFormInput v-model="form.addr" size="sm"> </CFormInput>
        </template>
        <template #value-capNm>
          <CFormInput v-model="form.capNm" size="sm"> </CFormInput>
        </template>
        <template #value-telNo>
          <CFormInput v-model="form.telNo" size="sm"> </CFormInput>
        </template>
        <template #value-entEmplNm>
          <CFormInput v-model="form.entEmplNm" size="sm"> </CFormInput>
        </template>
        <template #value-confirmYn>
          <div class="d-flex align-items-center">
            <CFormCheck class="checkbox" id="confirmYn" v-model="confirmYn" />

            <div v-if="confirmYn" class="ms-2">
              <Datepicker v-model="confirmYmd" v-bind="datepickerFixed" locale="ko" :ui="{ input: 'form-control form-control-sm' }" />
            </div>
          </div>
        </template>
        <template #value-procTrsYn>
          <CFormCheck class="checkbox" id="procTrsYn" v-model="procTrsYn" />
        </template>
        <template #value-procSetYn>
          <div class="d-flex align-items-center">
            <CFormCheck class="checkbox" id="procSetYn" v-model="procSetYn" />

            <div v-if="procSetYn" class="ms-2">
              <Datepicker v-model="procSetYmd" v-bind="datepickerFixed" locale="ko" :ui="{ input: 'form-control form-control-sm' }" />
            </div>
          </div>
        </template>
        <template #value-hello100Yn>
          <CFormCheck
            class="checkbox"
            id="hello100Yn"
            v-model="hello100Yn"
            label="※ 라이선스는 한 번 발급 이후 취소되지 않으며 취소 070-7170-9229 연락주세요."
          />
        </template>
        <template #value-procAccStepNm>
          <CFormSelect v-model="procAccStepNm" size="sm">
            <option v-for="opt in procAccStepOptions" :key="opt.value" :value="opt.value">
              {{ opt.name }}
            </option>
          </CFormSelect>
        </template>
        <template #value-procFinalYn>
          <CFormCheck v-model="procFinalYn" size="sm">
            <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
              {{ opt.name }}
            </option>
          </CFormCheck>
        </template>
        <template #value-memo>
          <CFormTextarea v-model="form.memo" rows="3" />
        </template>
      </UiGridTable>
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
