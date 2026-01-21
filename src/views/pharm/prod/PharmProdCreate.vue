<script setup>
import UiGridTable from '@/components/ui/UiGridTable.vue';
import UiLoading from '@/components/ui/UiLoading.vue';
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApiToast } from '@/composables/useApiToast';
import { useBaseStore } from '@/stores/base';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { useToast } from '@/composables/useToast';
import { PharmAPI } from '@/api/temp/pharm';
import { CFormSelect } from '@coreui/vue';
import { logFormData } from '@/utils/common';
import { CommonAPI } from '@/api/temp/common';
import { useAuthStore } from '@/stores/auth';

// ----------------------
// ✨ composable / store
// ----------------------
const route = useRoute();
const router = useRouter();
const toastApi = useApiToast();
const base = useBaseStore();
const modal = useConfirmModal();
const toast = useToast();
const auth = useAuthStore();

// ----------------------
// ✨ reactive state
// ----------------------
const licenseCd = computed(() => route.query.licenseCd || '');

const optionsLoading = ref(false);
const isLoading = ref(false);
const isSubmitting = ref(false);

const form = reactive({
  prodNm: '',
  prodCd: '',
  prodAmt: '',
  maxCnt: '',
  unitAmt: '',
  statusYn: 'Y',
});

const prodCdOptions = ref([]);
const statusYnOptions = ref([
  { codeId: 'Y', codeNm: '사용' },
  { codeId: 'N', codeNm: '미사용' },
]);

const memberInfoFields = computed(() => [
  {
    label1: '상품타입',
    key: 'prodCd',
    colspan: true,
  },
  {
    label1: '상품명',
    key: 'prodNm',
    colspan: true,
  },
  {
    label1: '상품가격',
    key: 'prodAmt',
    colspan: true,
  },
  {
    label1: '건수',
    key: 'maxCnt',
    colspan: true,
  },
  {
    label1: '건당 가격',
    key: 'unitAmt',
    colspan: true,
  },
  {
    label1: '상태값',
    key: 'statusYn',
    colspan: true,
  },
]);

const fetchSearchOptions = async () => {
  optionsLoading.value = true;

  try {
    const prodCdRes = await CommonAPI.getCodePharmList('02');
    if (!prodCdRes.ok) {
      toastApi.errorFromResult(prodCdRes);
    }
    const prodCdList = prodCdRes.data?.resultData?.list ?? [];
    prodCdOptions.value = [{ codeId: '', codeNm: '상품선택' }, ...prodCdList];
  } catch (e) {
    toastApi.errorFromException(e);
  } finally {
    optionsLoading.value = false;
  }
};

const handleSubmit = async () => {
  if (isSubmitting.value)
    return;

  const msg = validateForm(form);
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

    const res = await PharmAPI.postProd(formData);
    if (!res.ok)
      return toastApi.errorFromResult(res);

    toast.success('저장되었습니다.');
    router.back();
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

const validateForm = (f) => {
  if (!f.prodNm?.trim())
    return '상품명을 입력하세요.';

  if (!f.prodCd?.trim())
    return '상품타입을 입력하세요.';

  if (!f.prodAmt?.trim())
    return '상품가격을 입력하세요.';

  if (!f.maxCnt?.trim())
    return '건수를 입력하세요.';

  if (!f.unitAmt?.trim())
    return '건당 가격을 입력하세요.';

  return '';
};

const buildParams = () => {
  return {
    prodNm: form.prodNm,
    prodCd: form.prodCd,
    prodAmt: form.prodAmt,
    maxCnt: form.maxCnt,
    unitAmt: form.unitAmt,
    statusYn: form.statusYn,
    regUserId: auth?.userInfo?.userId,
  };
};

const createFormData = (p) => {
  const fd = new FormData();
  const append = (k, v) => fd.append(k, v ?? '');

  append('ProdNm', p.prodNm);
  append('ProdCd', p.prodCd);
  append('ProdAmt', p.prodAmt);
  append('MaxCnt', p.maxCnt);
  append('UnitAmt', p.unitAmt);
  append('StatusYn', p.statusYn);
  append('RegUserId', p.regUserId);

  return fd;
};

onMounted(() => {
  fetchSearchOptions();
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
        <!-- 상품타입	-->
        <template #value-prodCd>
          <CFormSelect v-model="form.prodCd" size="sm">
            <option v-for="opt in prodCdOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
        </template>

        <!-- 상품명 -->
        <template #value-prodNm>
          <CFormInput v-model="form.prodNm" size="sm" />
        </template>

        <!-- 상품가격 -->
        <template #value-prodAmt>
          <CFormInput v-model="form.prodAmt" type="number" size="sm" />
        </template>

        <!-- 건수 -->
        <template #value-maxCnt>
          <CFormInput v-model="form.maxCnt" type="number" size="sm" />
        </template>

        <!-- 건당 가격	 -->
        <template #value-unitAmt>
          <CFormInput v-model="form.unitAmt" type="number" size="sm" />
        </template>

        <!-- 상태값	-->
        <template #value-statusYn>
          <CFormSelect v-model="form.statusYn" size="sm">
            <option v-for="opt in statusYnOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
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
