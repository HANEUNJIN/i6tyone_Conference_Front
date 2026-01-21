<script setup>
import { onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useBaseStore } from '@/stores/base';
import { HospApi } from '@/api/temp/hosp';
import { useApiToast } from '@/composables/useApiToast';
import { useToast } from '@/composables/useToast';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { formatYmd } from '@/utils/common';
import UiDataTable from '@/components/ui/UiDataTable.vue';
import titleIcon from '@/assets/images/common/title-icon.png';
import { useFileActions } from '@/composables/useFileActions';

// 테이블 헤더 정의
const CONTRACT_HISTORY_COLUMN = [
  { key: 'contractStNm', label: '타입', width: '8%' },
  { key: 'regDt', label: '계약일', width: '12%' },
  { key: 'userNm', label: '담당', width: '6%' },
  { key: 'requestMemo', label: '검수요청', width: '10%' },
  { key: 'inspectMemo', label: '검수메모', width: '15%', align: 'left' },
  { key: 'remark', label: '특이사항', width: '15%', align: 'left' },
  { key: 'pdfUrl', label: 'PDF', width: '8%' },
];
// ----------------------
//  ✨composable / store
// ----------------------
const base = useBaseStore();
const { storeMenuType, storeLicenseCd } = storeToRefs(base); // ref 형태로 추출
const modal = useConfirmModal();
const toastApi = useApiToast();
const toast = useToast();
const { handleFile } = useFileActions();
// ----------------------
//  ✨reactive, ref state
// ----------------------
const contractLogList = ref([]);
const isLoading = ref(false);
// ----------------------
//  ✨ methods / functions/
// ----------------------
const fetchContractLogList = async () => {
  isLoading.value = true;
  try {
    const res = await HospApi.getContractLog({
      licenseCd: storeLicenseCd.value,
      menuType: storeMenuType.value,
    });
    if (!res.ok) return toastApi.errorFromResult(res);
    contractLogList.value = res.data?.resultData?.list ?? [];
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  } finally {
    isLoading.value = false;
  }
};

const handlePdfOpenConfirm = (pdfUrl) => {
  handleFile(pdfUrl, {
    fileName: '이지스_솔루션_전자계약서.pdf',
    confirmTitle: '계약서',
    confirmMessage: '계약서 PDF 파일을 여시겠습니까?',
  });
};

onMounted(() => {
  fetchContractLogList();
});
</script>

<template>
  <CCard class="h-100">
    <CCardHeader>
      <h6 class="d-flex align-content-center gap-1 mb-0">
        <CImage :src="titleIcon" width="20" /> <span>거래내역</span>
      </h6>
    </CCardHeader>
    <CCardBody>
      <UiDataTable :loading="isLoading" :columns="CONTRACT_HISTORY_COLUMN" :items="contractLogList">
        <template #cell-regDt="{ item }">
          {{ formatYmd(item.regDt) }}
        </template>
        <template #cell-pdfUrl="{ item }">
          <CButton color="success" size="sm" @click="handlePdfOpenConfirm(item.pdfUrl)"
            ><CIcon name="cil-file"
          /></CButton>
        </template>
      </UiDataTable>
    </CCardBody>
  </CCard>
</template>

<style scoped></style>
