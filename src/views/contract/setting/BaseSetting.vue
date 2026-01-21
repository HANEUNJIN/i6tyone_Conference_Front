<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useBaseStore } from '@/stores/base';
import { ContractApi } from '@/api/temp/contract';
import { storeToRefs } from 'pinia';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { useApiToast } from '@/composables/useApiToast';
import { useToast } from '@/composables/useToast';
import UiDataTable from '@/components/ui/UiDataTable.vue';
// ----------------------
//  ✨composable / store
// ----------------------
const base = useBaseStore();
const modal = useConfirmModal();
const { storeMenuType } = storeToRefs(base); // ref 형태로 추출
const toastApi = useApiToast();
const toast = useToast();

// ----------------------
//  ✨reactive, ref state
// ----------------------
const form = reactive({
  supplyPer: 0,
  device: 0,
  periodInfo: {
    reInspectDay: 0,
    expireDay: 0,
    payModDay: 0,
    nextMeetDay: 0,
    menuType: '',
  },
  freePassItems: [{}],
});

const isLoading = ref(false); // 상세 본문용 로딩 (스피너)
const isSubmitting = ref(false); //중복 제출 방지용
// 테이블 헤더 정의
const COLUMNS = [
  { key: 'no', label: 'No', width: '5%' },
  { key: 'branchNm', label: '지역', width: '10%' },
  { key: 'corpNm', label: '지사', width: '20%' },
  { key: 'targetCnt', label: '영업목표', width: '5%' },
  { key: 'supplyBaseCnt', label: '기본발급', width: '5%' },
  { key: 'supplyAddCnt', label: '추가발급', width: '5%' },
  { key: 'supplyTotalCnt', label: '총발급', width: '5%' },
  { key: 'useCnt', label: '사용', width: '5%' },
  { key: 'nowCnt', label: '남은 수', width: '5%' },
];

// ----------------------
//  ✨ methods / functions/
// ----------------------

//기간 제한 설정 정보
const fetchReportPeriodSetting = async () => {
  try {
    const response = await ContractApi.getReportPeriod(storeMenuType.value);
    form.periodInfo = response?.data?.resultData ?? [];
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

//기간 제한 설정 저장
const periodSettingSave = async () => {
  try {
    const confirm = await modal.show({
      title: '기잔 제한 설정',
      message: '저장 하시겠습니까?',
      confirmText: '저장',
    });

    if (!confirm) {
      return;
    }

    form.periodInfo.storeMenuType = storeMenuType.value;
    const res = await ContractApi.putReportPeriod(form.periodInfo);
    if (!res.ok) return toastApi.errorFromResult(res);
    toast.success('저장되었습니다.');
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
};

//프리패스 정보
const fetchReportFreePassInfo = async () => {
  isLoading.value = true;
  const params = {
    year: new Date().getFullYear(),
    menuType: storeMenuType.value,
  };

  try {
    const res = await ContractApi.getReportFreePassInfo(params);
    form.freePassItems = res?.data?.resultData ?? [];
    form.supplyPer = form.freePassItems.list[0].supplyPer;
  } catch (e) {
    toastApi.errorFromException(e);
  } finally {
    isLoading.value = false;
  }
};

//프리패스 정보 저장
const freePassInfoSave = async () => {
  const confirm = await modal.show({
    title: '프리패스 관리',
    message: '저장 하시겠습니까?',
    confirmText: '저장',
  });

  if (!confirm) {
    return;
  }

  try {
    if (isSubmitting.value) return;
    let year = new Date().getFullYear();
    const params = {
      SupplyPer: form.supplyPer,
      Year: String(year),
      FreePassList: form.freePassItems.list,
      MenuType: storeMenuType.value,
    };
    const res = await ContractApi.postReportFreePassInfo(params);
    if (!res.ok) return toastApi.errorFromResult(res);

    toast.success('저장되었습니다.');
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
};

onMounted(() => {
  fetchReportPeriodSetting();
  fetchReportFreePassInfo();
});
</script>
<template>
  <CCard class="mb-3">
    <CCardHeader>
      <h6 class="mb-0">기간 제한 설정</h6>
    </CCardHeader>
    <CCardBody>
      <CRow class="mb-3">
        <CCol sm="6">
          <CFormLabel>재검수 요청 제한 기한일</CFormLabel>
          <CFormInput v-model="form.periodInfo.reInspectDay" type="number" />
        </CCol>
        <CCol sm="6">
          <CFormLabel>최대 영업권 상실 기한일</CFormLabel>
          <CFormInput v-model="form.periodInfo.expireDay" type="number" />
        </CCol>
      </CRow>
    </CCardBody>
    <CCardFooter class="d-flex justify-content-end">
      <CButton color="primary" size="sm" @click="periodSettingSave">저장</CButton>
    </CCardFooter>
  </CCard>

  <CCard>
    <CCardHeader><h6 class="mb-0">프리패스 관리</h6></CCardHeader>
    <CCardBody>
      <div class="mb-3 d-flex align-items-center justify-content-end gap-2">
        <div>기본 발급 수량</div>
        <div class="d-flex align-items-center gap-1">
          <CFormInput
            v-model="form.supplyPer"
            type="number"
            style="width: 70px; text-align: right"
          />
          <span>%</span>
        </div>
      </div>
      <UiDataTable :loading="isLoading" :columns="COLUMNS" :items="form.freePassItems.list">
        <template #cell-no="{ index }">
          {{ index + 1 }}
        </template>
        <template #cell-supplyAddCnt="{ item }">
          <CFormInput v-model="item.supplyAddCnt" type="number" size="sm" class="text-center" />
        </template>
        <template #cell-supplyTotalCnt="{ item }">
          {{ parseInt(item.supplyBaseCnt) + parseInt(item.supplyAddCnt) }}
        </template>
      </UiDataTable>
    </CCardBody>
    <CCardFooter class="d-flex justify-content-end">
      <CButton color="primary" size="sm" @click="freePassInfoSave()">저장</CButton>
    </CCardFooter>
  </CCard>
</template>
