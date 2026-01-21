<script setup>
import UiGridTable from '@/components/ui/UiGridTable.vue';
import UiLoading from '@/components/ui/UiLoading.vue';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApiToast } from '@/composables/useApiToast';
import { useBaseStore } from '@/stores/base';
import { MaumPlusAPI } from '@/api/maumPlus';
import { CFormSelect } from '@coreui/vue';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { useToast } from '@/composables/useToast';
import { formatMoney } from '@/utils/common';

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
const prodId = computed(() => route.query.prodId || '');

const detailInfo = ref({});
const isLoading = ref(false);
const isSubmitting = ref(false);

const payTypeOptions = ref([
  { codeId: 'M', codeNm: '월결제' },
  { codeId: 'Y', codeNm: '년결제' },
]);

const statusYnOptions = ref([
  { codeId: 'Y', codeNm: '사용' },
  { codeId: 'N', codeNm: '미사용' },
]);

const statusInfoFields = computed(() => [
  {
    label1: '상품코드',
    value1: detailInfo.value.prodId,
    colspan: true,
  },
  {
    label1: '상품타입',
    key: 'payType',
    colspan: true,
  },
  {
    label1: '상품명',
    key: 'prodNm',
    colspan: true,
  },
  {
    label1: '기본상담사수',
    key: 'partnerCnt',
    colspan: true,
  },
  {
    label1: '상품가격',
    value1: formatMoney(detailInfo.value.prodAmt),
    colspan: true,
  },
  {
    label1: '상담사추가 가격',
    key: 'partnerAddAmt',
    colspan: true,
  },
  {
    label1: '상태값',
    key: 'statusYn',
    colspan: true,
  },
]);

const fetchDetail = async () => {
  if (!prodId.value)
    return;

  isLoading.value = true;

  try {
    const params = {
      prodId: prodId.value,
    };

    const res = await MaumPlusAPI.getProdDetail(params);
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

    const params = {
      prodId: detailInfo.value.prodId,
      payType: detailInfo.value.payType,
      prodNm: detailInfo.value.prodNm,
      partnerCnt: detailInfo.value.partnerCnt,
      partnerAddAmt: detailInfo.value.partnerAddAmt,
      statusYn: detailInfo.value.statusYn
    };

    const res = await MaumPlusAPI.putProdModify(params);
    if (!res.ok)
      return toastApi.errorFromResult(res);

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
      <h6 class="mb-0">상세정보</h6>
    </CCardHeader>
    <CCardBody>
      <div class="loading" v-if="isLoading">
        <UiLoading />
      </div>
      <UiGridTable :fields="statusInfoFields">
        <!--상품타입-->
        <template #value-payType>
          <CFormSelect v-model="detailInfo.payType" size="sm">
            <option v-for="opt in payTypeOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
        </template>

        <!--상품명-->
        <template #value-prodNm>
          <CFormInput v-model="detailInfo.prodNm" size="sm" />
        </template>

        <!-- 기본상담사수-->
        <template #value-partnerCnt>
          <CFormInput v-model="detailInfo.partnerCnt" type="number" size="sm" />
        </template>

        <!-- 상담사추가 가격	-->
        <template #value-partnerAddAmt>
          <CFormInput v-model="detailInfo.partnerAddAmt" type="number" size="sm" />

        </template>

        <!-- 상태값	-->
        <template #value-statusYn>
          <CFormSelect v-model="detailInfo.statusYn" size="sm">
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
