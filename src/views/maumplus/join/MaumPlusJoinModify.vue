<script setup>
import UiGridTable from '@/components/ui/UiGridTable.vue';
import UiLoading from '@/components/ui/UiLoading.vue';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApiToast } from '@/composables/useApiToast';
import { useBaseStore } from '@/stores/base';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { useToast } from '@/composables/useToast';
import { MaumPlusAPI } from '@/api/maumPlus';
import { formatMoney } from '@/utils/common';
import { CFormSelect, CFormTextarea } from '@coreui/vue';
import { CommonAPI } from '@/api/temp/common';

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
const bizNo = computed(() => route.query.bizNo || '');

const detailInfo = ref({});
const isLoading = ref(false);
const isSubmitting = ref(false);
const procFinalCdNm = ref('');

const procAccYnOptions = ref([
  { codeId: 'Y', codeNm: '완료' },
  { codeId: 'N', codeNm: '미완료' },
]);

const procSetYnOptions = ref([
  { codeId: 'N', codeNm: '선택' },
  { codeId: 'I', codeNm: '진행' },
  { codeId: 'E', codeNm: '완료' },
  { codeId: 'H', codeNm: '보류' },
]);

const memberInfoFields = computed(() => [
  {
    label1: '센터명',
    value1: detailInfo.value.centerName || '',
    label2: '도메인',
    value2: detailInfo.value.domain || '',
  },
  {
    label1: '이름',
    value1: detailInfo.value.name || '',
    label2: '핸드폰(센터전화번호)',
    value2: `${detailInfo.value.phone} (${detailInfo.value.centerPhone})` || '',
  },
  {
    label1: '이메일',
    value1: detailInfo.value.adminEmail || '',
    label2: '상담사이메일',
    value2: detailInfo.value.partnerEmail || '',
  },
  {
    label1: '요금',
    value1: detailInfo.value.birthday === 'clify' ? '별도 협의' : formatMoney(detailInfo.value.adminPrice) || '',
    label2: '유입경로',
    value2: detailInfo.value.funnels || '',
  },
  {
    label1: '사업자번호',
    value1: detailInfo.value.bizNo || '',
    label2: '생년월일',
    value2: detailInfo.value.birthday || '',
  },
  {
    label1: '1인센터여부',
    value1: detailInfo.value.onePersonYn || '',
    label2: '문자서비스',
    value2: detailInfo.value.smsYn || '',
  },
  {
    label1: '주소',
    value1: `${detailInfo.value.roadAddress} ${detailInfo.value.detailAddress} [우편번호: ${detailInfo.value.postCode}]` || '',
    colspan: true,
  },
  {
    label1: '센터생성여부',
    value1: detailInfo.value.centerSeq > 0 ? `센터 생성 완료 [센터코드 : ${detailInfo.value.centerSeq}]` : '미생성' || '',
    label2: 'Clify 가맹',
    value2: detailInfo.value.clifyYn || '',
  },
]);

const statusInfoFields = computed(() => [
  {
    label1: '피드백여부',
    key: 'procAccYn',
    colspan: true,
  },
  {
    label1: '진행상태',
    key: 'procSetYn',
    colspan: true,
  },
  {
    label1: '계약상태',
    key: 'procFinalCdNm',
    colspan: true,
  },
  {
    label1: '특이사항',
    key: 'memo',
    colspan: true,
  },
]);

const procFinalCdNmOptions = ref([]);

const getCommonCode = async () => {
  try {
    //계약현황
    const procFinalCdNmRes = await CommonAPI.getCode('A31');
    if (!procFinalCdNmRes.ok) {
      toastApi.errorFromResult(procFinalCdNmRes);
      return;
    }
    procFinalCdNmOptions.value = [
      { codeId: '', codeNm: '선택' },
      ...(procFinalCdNmRes.data?.resultData?.list ?? []),
    ];
  } catch (e) {
    toast.error(e?.message || '계약현황 정보를 불러오지 못했습니다.');
  }
};

const fetchDetail = async () => {
  if (!bizNo.value)
    return;

  isLoading.value = true;

  const params = {
    bizNo: bizNo.value,
  };

  try {
    const res = await MaumPlusAPI.getJoinDetail(params);
    if (!res.ok)
      return toastApi.errorFromResult(res);

    detailInfo.value = res.data?.resultData ?? {};
    detailInfo.value.oriProcFinalCd = detailInfo.value.procFinalCd;
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
      bizNo: bizNo.value,
      ProcAccYn: detailInfo.value.procAccYn,
      ProcSetYn: detailInfo.value.procSetYn,
      ProcFinalCd: detailInfo.value.procFinalCd,
      memo: detailInfo.value.memo,
      OriProcFinalCd: detailInfo.value.oriProcFinalCd,
    };

    const res = await MaumPlusAPI.putJoinModify(params);
    if (!res.ok)
      return toastApi.errorFromResult(res);

    toast.success('저장되었습니다.');
    router.back();
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

onMounted(() => {
  getCommonCode();
  fetchDetail();
});
</script>

<template>
  <CCard class="mb-3">
    <CCardHeader class="d-flex justify-content-between align-items-center">
      <h6 class="mb-0">가입신청정보</h6>
    </CCardHeader>
    <CCardBody>
      <div class="loading" v-if="isLoading">
        <UiLoading />
      </div>
      <UiGridTable :fields="memberInfoFields" />
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
        <!--피드백여부-->
        <template #value-procAccYn>
          <CFormSelect v-model="detailInfo.procAccYn" size="sm">
            <option v-for="opt in procAccYnOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
        </template>

        <!--진행상태-->
        <template #value-procSetYn>
          <CFormSelect v-model="detailInfo.procSetYn" size="sm">
            <option v-for="opt in procSetYnOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
        </template>

        <!--계약상태-->
        <template #value-procFinalCdNm>
          <span v-if="detailInfo.oriProcFinalCd === 'A3103'">
            {{ detailInfo.procFinalCdNm }}
          </span>
          <CFormSelect v-else v-model="detailInfo.procFinalCd" size="sm">
            <option v-for="opt in procFinalCdNmOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
        </template>

        <!--특이사항-->
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
