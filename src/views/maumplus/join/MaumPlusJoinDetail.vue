<script setup>
import UiGridTable from '@/components/ui/UiGridTable.vue';
import UiLoading from '@/components/ui/UiLoading.vue';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApiToast } from '@/composables/useApiToast';
import { useBaseStore } from '@/stores/base';
import { ROUTE } from '@/constants/routeName';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { useToast } from '@/composables/useToast';
import { MaumPlusAPI } from '@/api/maumPlus';
import { formatMoney } from '@/utils/common';
import { useFileActions } from '@/composables/useFileActions';

// ----------------------
// ✨ composable / store
// ----------------------
const route = useRoute();
const router = useRouter();
const toastApi = useApiToast();
const base = useBaseStore();
const modal = useConfirmModal();
const toast = useToast();
const { handleFile } = useFileActions();

// ----------------------
// ✨ reactive state
// ----------------------
const bizNo = computed(() => route.query.bizNo || '');

const detailInfo = ref({});
const isLoading = ref(false);

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
    label2: 'van 신청여부',
    value2: detailInfo.value.emailAdd || '',
  },
  {
    label1: '솔루션도입 전자계약서 파일',
    key1: 'joinSignPdf',
    label2: 'Clify 가맹',
    value2: detailInfo.value.clifyYn || '',
  },
]);

const statusInfoFields = computed(() => [
  {
    label1: '피드백여부',
    value1: detailInfo.value.procAccYn === 'Y' ? '완료' : '미완료',
    colspan: true,
  },
  {
    label1: '진행상태',
    value1: detailInfo.value.procSetYn === 'N' ? ''
      : detailInfo.value.procSetYn === 'I' ? '진행'
        : detailInfo.value.procSetYn === 'E' ? '완료'
          : detailInfo.value.procSetYn === 'H' ? '보류'
            : '',

    colspan: true,
  },
  {
    label1: '계약상태',
    value1: detailInfo.value.procFinalCdNm,
    colspan: true,
  },
  {
    label1: '특이사항',
    value1: detailInfo.value.memo,
    colspan: true,
  },
]);

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
  } catch (e) {
    toastApi.errorFromException(e);
  } finally {
    isLoading.value = false;
  }
};

const fileOpen = (pdfUrl) => {
  handleFile(pdfUrl, {
    fileName: '',
    confirmTitle: '',
    confirmMessage: 'pdf 파일을 여시겠습니까?',
  });
};

const goBackToList = () => {
  router.push({ name: ROUTE.Maumplus.MaumPlusJoin.List, query: route.query });
};

const goModify = () => {
  router.push({ name: ROUTE.Maumplus.MaumPlusJoin.Modify, query: { ...route.query, bizNo: bizNo.value }, });
};

onMounted(() => {
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
      <UiGridTable :fields="memberInfoFields">
        <template #value-joinSignPdf>
          <span v-if="detailInfo.joinSignPdf === null">파일없음</span>
          <CButton v-else color="success" size="sm" type="button" @click.stop="fileOpen(detailInfo.joinSignPdf)">
            <CIcon name="cil-file" />
            열기
          </CButton>
        </template>
      </UiGridTable>
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
      <UiGridTable :fields="statusInfoFields" />
    </CCardBody>
  </CCard>
  <div class="d-flex justify-content-end gap-2">
    <CButton color="secondary" @click="goBackToList">뒤로</CButton>
    <CButton color="warning" @click="goModify">수정</CButton>
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
