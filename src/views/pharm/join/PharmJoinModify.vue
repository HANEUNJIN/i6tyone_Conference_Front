<script setup>
import UiGridTable from '@/components/ui/UiGridTable.vue';
import UiLoading from '@/components/ui/UiLoading.vue';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApiToast } from '@/composables/useApiToast';
import { useBaseStore } from '@/stores/base';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { useToast } from '@/composables/useToast';
import { PharmAPI } from '@/api/temp/pharm';
import { CFormSelect, CFormTextarea } from '@coreui/vue';
import { logFormData } from '@/utils/common';

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
const isSubmitting = ref(false);

const etc1Options = ref([
  { value: '', name: '선택하세요' },
  { value: '엔에스팜', name: '엔에스팜' },
  { value: '유팜', name: '유팜' },
  { value: '이지스팜', name: '이지스팜' },
  { value: 'PM+20', name: 'PM+20' },
  { value: 'Pharm IT3000', name: 'Pharm IT3000' },
  { value: '데이팜솔루션', name: '데이팜솔루션' },
  { value: 'PharmClickPLUS', name: 'PharmClickPLUS' },
  { value: '베스트팜', name: '베스트팜' },
  { value: '비즈팜', name: '비즈팜' },
  { value: '윈팜', name: '윈팜' },
  { value: '팜시스', name: '팜시스' },
  { value: '온팜', name: '온팜' },
  { value: '위드팜', name: '위드팜' },
  { value: '이팜', name: '이팜' },
  { value: '이팜 플러스', name: '이팜 플러스' },
  { value: '이지팜', name: '이지팜' },
  { value: '스피드팜', name: '스피드팜' },
  { value: '팜오피스', name: '팜오피스' },
  { value: '기타', name: '기타' },
]);

const procSetYnNmOptions = ref([
  { value: 'N', name: '미처리' },
  { value: 'C', name: '상담완료' },
  { value: 'I', name: '계약진행중' },
  { value: 'E', name: '계약완료' },
  { value: 'S', name: '설치완료' },
]);

const memberInfoFields = computed(() => [
  {
    label1: '약국명',
    key: 'hospNm',
    colspan: true,
  },
  {
    label1: '핸드폰',
    key: 'capTelNo',
    colspan: true,
  },
  {
    label1: '청구프로그램',
    key: 'etc1',
    colspan: true,
  },
]);

const statusInfoFields = computed(() => [
  {
    label1: '진행상태',
    key: 'procSetYn',
    colspan: true,
  },
  {
    label1: '메모',
    key: 'memo',
    colspan: true,
  },
]);

const fetchDetail = async () => {
  if (!licenseCd.value)
    return;

  isLoading.value = true;

  const params = { licenseCd: licenseCd.value };

  try {
    const res = await PharmAPI.getDetail(params);
    if (!res.ok)
      return toastApi.errorFromResult(res);

    detailInfo.value = res.data?.resultData ?? {};
  } catch (e) {
    toastApi.errorFromException(e);
  } finally {
    isLoading.value = false;
  }
};

const handleSubmit = async () => {
  if (isSubmitting.value)
    return;

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

    const res = await PharmAPI.putModify(formData);
    if (!res.ok)
      return toastApi.errorFromResult(res);

    toast.success('저장되었습니다.');
    router.back();
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

const buildParams = () => {
  let optionJson = ` [{"Step1":"${detailInfo.value.step1}","Bacord":"${detailInfo.value.bacord}"}]`;
  return {
    hospNm: detailInfo.value.hospNm,
    hospNo: detailInfo.value.hospNo,
    capNm: detailInfo.value.capNm,
    licenseCd: detailInfo.value.licenseCd,
    doctNo: detailInfo.value.doctNo,
    birthday: detailInfo.value.birthday,
    telNo: detailInfo.value.telNo,
    capTelNo: detailInfo.value.capTelNo,
    email: detailInfo.value.email,
    etc1: detailInfo.value.etc1,
    deptCd: detailInfo.value.deptCd,
    entEmplNm: detailInfo.value.entEmplNm,
    step1: detailInfo.value.step1,
    bacord: detailInfo.value.bacord,
    memo: detailInfo.value.memo,
    optionJson: optionJson,
    procSetYn: detailInfo.value.procSetYn,
  };
};

const createFormData = (p) => {
  const fd = new FormData();
  const append = (k, v) => fd.append(k, v ?? '');

  append('HospNm', p.hospNm);
  append('HospNo', p.hospNo);
  append('CapNm', p.capNm);
  append('LicenseCd', p.licenseCd);
  append('DoctNo', p.doctNo);
  append('Birthday', p.birthday);
  append('TelNo', p.telNo);
  append('CapTelNo', p.capTelNo);
  append('Email', p.email);
  append('Etc1', p.etc1);
  append('DeptCd', p.deptCd);
  append('EntEmplNm', p.entEmplNm);
  append('Step1', p.step1);
  append('Bacord', p.bacord);
  append('Memo', p.memo);
  append('OptionJson', p.optionJson);
  append('ProcSetYn', p.procSetYn);

  return fd;
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
      <UiGridTable :fields="memberInfoFields">
        <!-- 약국명 -->
        <template #value-hospNm>
          <CFormInput v-model="detailInfo.hospNm" size="sm" />
        </template>

        <!-- 핸드폰 -->
        <template #value-capTelNo>
          <CFormInput v-model="detailInfo.capTelNo" size="sm" />
        </template>

        <!-- 청구프로그램	-->
        <template #value-etc1>
          <CFormSelect v-model="detailInfo.etc1" size="sm">
            <option v-for="opt in etc1Options" :key="opt.value" :value="opt.value">
              {{ opt.name }}
            </option>
          </CFormSelect>
        </template>
      </UiGridTable>
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
      <UiGridTable :fields="statusInfoFields">
        <!-- 진행상태 -->
        <template #value-procSetYn>
          <CFormSelect v-model="detailInfo.procSetYn" size="sm">
            <option v-for="opt in procSetYnNmOptions" :key="opt.value" :value="opt.value">
              {{ opt.name }}
            </option>
          </CFormSelect>
        </template>

        <!-- 메모 -->
        <template #value-memo="{ item }">
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
