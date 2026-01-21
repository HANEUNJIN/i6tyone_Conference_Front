<script setup>
import { computed, onMounted, ref } from 'vue';
import UiGridTable from '@/components/ui/UiGridTable.vue';
import { useRoute, useRouter } from 'vue-router';
import { useApiToast } from '@/composables/useApiToast';
import UiLoading from '@/components/ui/UiLoading.vue';
import { CFormSelect, CFormTextarea } from '@coreui/vue';
import { datepickerFixed, formatYmd, logFormData, toYmdCompact } from '@/utils/common';
import Datepicker from '@vuepic/vue-datepicker';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { useToast } from '@/composables/useToast';
import { GoodocAPI } from '@/api/goodoc';

// ----------------------
// ✨ composable / store
// ----------------------
const route = useRoute();
const router = useRouter();
const toast = useToast();
const toastApi = useApiToast();
const modal = useConfirmModal();

// ----------------------
// ✨ reactive state
// ----------------------
const licenseCd = computed(() => route.query.licenseCd || '');
const displayGoodocTrsYn = computed({
  get: () => (detailInfo.value.goodocTrsYn !== 'N' ? 'Y' : 'N'),
  set: (val) => {
    detailInfo.value.goodocTrsYn = val;
  },
});

const displayBranchSetYn = computed({
  get: () => (detailInfo.value.branchSetYn !== 'N' ? 'Y' : 'N'),
  set: (val) => {
    detailInfo.value.branchSetYn = val;
  },
});

const detailInfo = ref({});
const isLoading = ref(false);
const isSubmitting = ref(false);

const wifiYnOptions = ref([
  { codeId: 'Y', codeNm: 'Y' },
  { codeId: 'N', codeNm: 'N' },
]);

const goodocAccStepOptions = ref([
  { codeId: '', codeNm: '선택' },
  { codeId: 'accept', codeNm: '승인완료' },
  { codeId: 'ready', codeNm: '승인전' },
  { codeId: 'cancel', codeNm: '취소' },
  { codeId: 'etc', codeNm: '보류' },
]);

const goodocTrsYnOptions = ref([
  { codeId: 'Y', codeNm: 'Y' },
  { codeId: 'N', codeNm: 'N' },
]);

const branchSetYnOptions = ref([
  { codeId: 'Y', codeNm: 'Y' },
  { codeId: 'N', codeNm: 'N' },
]);

const goodocFinalYnOptions = ref([
  { codeId: 'Y', codeNm: 'Y' },
  { codeId: 'N', codeNm: 'N' },
]);

const statusInfoFields = computed(() => {
  const fields = [
    {
      label1: '라이선스 번호',
      value1: detailInfo.value.licenseCd,
      label2: '요양기관 번호',
      key2: 'hospNo',
    },
    {
      label1: '병원명',
      key1: 'hospNm',
      label2: '진료과',
      key2: 'deptCd',
    },
    {
      label1: '주소',
      key: 'addr',
      colspan: true,
    },
    {
      label1: '전화번호',
      key1: 'telNo',
      label2: 'wifi 적용여부',
      key2: 'wifiYn',
    },
    {
      label1: '대표자 명',
      key1: 'capNm',
      label2: '대표자 전화번호',
      key2: 'capTelNo',
    },
    {
      label1: '카톡플러스 친구아이디',
      key1: 'plusId',
      label2: '카톡플러스 친구연락처',
      key2: 'plusTelNo',
    },
    {
      label1: '신청일자',
      key1: 'entYmd',
      label2: '신청시간',
      key2: 'entTime',
    },
    {
      label1: '신청자명',
      key1: 'entEmplNm',
      label2: '신청자아이피',
      key2: 'entIp',
    },
    {
      label1: '굿닥접수상태',
      key1: 'goodocAccStep',
      label2: '굿닥장비 배송여부',
      key2: 'goodocTrsYn',
    },
    {
      label1: '담당대리점',
      value1: detailInfo.value.branchNm,
      label2: '대리점세팅여부',
      key2: 'branchSetYn',
    },
    {
      label1: '굿닥확인',
      key1: 'goodocFinalYn',
      label2: '',
      key2: '',
    },
    {
      label1: '메모',
      key: 'memo',
      colspan: true,
    },
  ];
  return fields;
});

const fetchDetail = async () => {
  if (!licenseCd.value) return;

  isLoading.value = true;

  try {
    const res = await GoodocAPI.getDetail(licenseCd.value);
    if (!res.ok) return toastApi.errorFromResult(res);

    detailInfo.value = res.data?.resultData ?? {};
    detailInfo.value.goodocTrsYnYmd = formatYmd(detailInfo.value.goodocTrsYn);
    detailInfo.value.branchSetYnYmd = formatYmd(detailInfo.value.branchSetYn);
  } catch (e) {
    toastApi.errorFromException(e);
  } finally {
    isLoading.value = false;
  }
};

const buildParams = () => {
  return {
    licenseCd: licenseCd.value,
    hospNo: detailInfo.value.hospNo,
    hospNm: detailInfo.value.hospNm,
    deptCd: detailInfo.value.deptCd,
    addr: detailInfo.value.addr,
    telNo: detailInfo.value.telNo,
    wifiYn: detailInfo.value.wifiYn,

    capNm: detailInfo.value.capNm,
    capTelNo: detailInfo.value.capTelNo,
    plusId: detailInfo.value.plusId,
    plusTelNo: detailInfo.value.plusTelNo,
    entYmd: toYmdCompact(detailInfo.value.entYmd),
    entTime: detailInfo.value.entTime,
    entEmplNm: detailInfo.value.entEmplNm,
    entIp: detailInfo.value.entIp,

    goodocAccStep: detailInfo.value.goodocAccStep,
    GoodocTrsYn:
      detailInfo.value.goodocTrsYn !== 'N' ? toYmdCompact(detailInfo.value.goodocTrsYnYmd) : 'N',
    branchSetYn:
      detailInfo.value.branchSetYn !== 'N' ? toYmdCompact(detailInfo.value.branchSetYnYmd) : 'N',
    goodocFinalYn: detailInfo.value.goodocFinalYn,
    memo: detailInfo.value.memo,
  };
};

const createFormData = (p) => {
  const fd = new FormData();
  const append = (k, v) => fd.append(k, v ?? '');
  append('LicenseCd', p.licenseCd);
  append('HospNo', p.hospNo);
  append('HospNm', p.hospNm);
  append('DeptCd', p.deptCd);
  append('Addr', p.addr);
  append('TelNo', p.telNo);
  append('WifiYn', p.wifiYn);

  append('CapNm', p.capNm);
  append('CapTelNo', p.capTelNo);
  append('PlusId', p.plusId);
  append('PlusTelNo', p.plusTelNo);
  append('EntYmd', p.entYmd);
  append('EntTime', p.entTime);
  append('EntEmplNm', p.entEmplNm);
  append('EntIp', p.entIp);

  append('goodocAccStep', p.goodocAccStep);
  append('GoodocTrsYn', p.GoodocTrsYn);
  append('branchSetYn', p.branchSetYn);
  append('goodocFinalYn', p.goodocFinalYn);
  append('memo', p.memo);

  return fd;
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

    const res = await GoodocAPI.getModify(formData);
    if (!res.ok) return toastApi.errorFromResult(res);

    toast.success('저장되었습니다.');
    router.back();
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
      <h6 class="mb-0">진행상태</h6>
    </CCardHeader>
    <CCardBody>
      <div class="loading" v-if="isLoading">
        <UiLoading />
      </div>
      <UiGridTable :fields="statusInfoFields">
        <!--요양기관번호-->
        <template #value-hospNo>
          <CFormInput v-model="detailInfo.hospNo" size="sm" />
        </template>

        <!--병원명-->
        <template #value-hospNm>
          <CFormInput v-model="detailInfo.hospNm" size="sm" />
        </template>

        <!--진료과-->
        <template #value-deptCd>
          <CFormInput v-model="detailInfo.deptCd" size="sm" />
        </template>

        <!--주소-->
        <template #value-addr>
          <CFormInput v-model="detailInfo.addr" size="sm" />
        </template>

        <!--전화번호-->
        <template #value-telNo>
          <CFormInput v-model="detailInfo.telNo" size="sm" />
        </template>

        <!--wifi적용여부-->
        <template #value-wifiYn>
          <CFormSelect v-model="detailInfo.wifiYn" size="sm">
            <option v-for="opt in wifiYnOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
        </template>

        <!--대표자명-->
        <template #value-capNm>
          <CFormInput v-model="detailInfo.capNm" size="sm" />
        </template>

        <!--대표자전화번호-->
        <template #value-capTelNo>
          <CFormInput v-model="detailInfo.capTelNo" size="sm" />
        </template>

        <!--카톡플러스 친구아이디-->
        <template #value-plusId>
          <CFormInput v-model="detailInfo.plusId" size="sm" />
        </template>

        <!--카톡플러스 친구연락처-->
        <template #value-plusTelNo>
          <CFormInput v-model="detailInfo.plusTelNo" size="sm" />
        </template>

        <!--신청일자-->
        <template #value-entYmd>
          <Datepicker v-model="detailInfo.entYmd" v-bind="datepickerFixed" locale="ko" :ui="{ input: 'form-control form-control-sm' }"/>
        </template>

        <!--신청시간-->
        <template #value-entTime>
          <Datepicker v-model="detailInfo.entTime" v-bind="datepickerFixed" locale="ko" :ui="{ input: 'form-control form-control-sm' }"/>
        </template>

        <!--신청자명-->
        <template #value-entEmplNm>
          <CFormInput v-model="detailInfo.entEmplNm" size="sm" />
        </template>

        <!--신청자아이피-->
        <template #value-entIp>
          <CFormInput v-model="detailInfo.entIp" size="sm" />
        </template>

        <!--굿닥 접수상태-->
        <template #value-goodocAccStep>
          <CFormSelect v-model="detailInfo.goodocAccStep" size="sm">
            <option v-for="opt in goodocAccStepOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
        </template>

        <!--굿닥장비 배송여부-->
        <template #value-goodocTrsYn>
          <div class="d-flex align-items-center">
            <CFormSelect v-model="displayGoodocTrsYn" size="sm">
              <option v-for="opt in goodocTrsYnOptions" :key="opt.codeId" :value="opt.codeId">
                {{ opt.codeNm }}
              </option>
            </CFormSelect>
            <div v-if="displayGoodocTrsYn === 'Y'" class="ms-2">
              <Datepicker
                v-model="detailInfo.goodocTrsYnYmd"
                v-bind="datepickerFixed"
                locale="ko"
                :ui="{ input: 'form-control form-control-sm' }"
              />
            </div>
          </div>
        </template>

        <!--대리점세팅여부-->
        <template #value-branchSetYn>
          <div class="d-flex align-items-center">
            <CFormSelect v-model="displayBranchSetYn" size="sm">
              <option v-for="opt in branchSetYnOptions" :key="opt.codeId" :value="opt.codeId">
                {{ opt.codeNm }}
              </option>
            </CFormSelect>
            <div v-if="displayBranchSetYn === 'Y'" class="ms-2">
              <Datepicker
                v-model="detailInfo.branchSetYnYmd"
                v-bind="datepickerFixed"
                locale="ko"
                :ui="{ input: 'form-control form-control-sm' }"
              />
            </div>
          </div>
        </template>

        <!--굿닥확인-->
        <template #value-goodocFinalYn>
          <CFormSelect v-model="detailInfo.goodocFinalYn" size="sm">
            <option v-for="opt in goodocFinalYnOptions" :key="opt.codeId" :value="opt.codeId">
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
