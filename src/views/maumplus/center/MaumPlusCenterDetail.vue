<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApiToast } from '@/composables/useApiToast';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { useToast } from '@/composables/useToast';
import { useBaseStore } from '@/stores/base';
import { ROUTE } from '@/constants/routeName';
import { MaumPlusAPI } from '@/api/maumPlus';
import { formatMoney, formatYmd, logFormData } from '@/utils/common';
import { useFileActions } from '@/composables/useFileActions';
import UiGridTable from '@/components/ui/UiGridTable.vue';
import UiLoading from '@/components/ui/UiLoading.vue';
import UiDataTable from '@/components/ui/UiDataTable.vue';
import UiModal from '@/components/ui/UiModal.vue';
import UiAttachments from '@/components/ui/UiAttachments.vue';

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
const licenseCd = computed(() => route.query.licenseCd || '');

const detailInfo = ref({});
const isLoading = ref(false);
const applyItems = ref([]);
const revocationItems = ref([]);
const fareItem = ref([]);
const counselorItem = ref([]);
const isShowUploadModal = ref(false);
const isShowUploadModal2 = ref(false);
const fileInfo = ref([]);

const centerInfoFields = computed(() => [
  {
    label1: '라이선스코드',
    value1: detailInfo.value.licenseCd || '',
    label2: '생성일자',
    value2: detailInfo.value.regDt || '',
  },
  {
    label1: '센터명',
    value1: detailInfo.value.centerNm || '',
    label2: '도메인',
    value2: detailInfo.value.domain || '',
  },
  {
    label1: '이름',
    value1: detailInfo.value.repNm || '',
    label2: '핸드폰(센터전화번호)',
    value2: `${detailInfo.value.repPhone} (${detailInfo.value.centerPhone})` || '',
  },
  {
    label1: '이메일',
    value1: detailInfo.value.repEmail || '',
    label2: '상담사이메일',
    value2: detailInfo.value.partnerEmail || '',
  },
  {
    label1: '신청서작성시요금',
    value1: detailInfo.value.clifyYn === 'O' ? '별도 협의' : `${formatMoney(detailInfo.value.joinPrice)}`,
    label2: '유입경로',
    value2: detailInfo.value.inboundInfo || '',
  },
  {
    label1: '사업자번호',
    value1: detailInfo.value.businessNo || '',
    label2: '생년월일',
    value2: '',
  },
  {
    label1: '1인센터여부',
    value1: detailInfo.value.onePersonYn || '',
    label2: '문자서비스',
    value2: detailInfo.value.smsYn || '',
  },
  {
    label1: '주소',
    value1: `${detailInfo.value.addrHd} ${detailInfo.value.addrDt} [우편번호: ${detailInfo.value.postCode}]` || '',
    colspan: true,
  },
  {
    label1: '센터생성여부',
    value1: detailInfo.value.centerSeq > 0 ? `센터 생성 완료 [센터코드 : ${detailInfo.value.centerSeq}]` : '미생성',
    colspan: true,
  },
  {
    label1: '요금제',
    value1: detailInfo.value.prodNm || '',
    label2: 'Clify 가맹',
    value2: detailInfo.value.clifyYn || '',
  },
  {
    label1: '메모',
    value1: detailInfo.value.memo,
    colspan: true,
  },
]);

const COLUMNS = [
  { key: 'no', label: '순번', width: '4%' },
  { key: 'oriFileName', label: '파일명', width: '10%', align: 'left' },
  { key: 'regDt', label: '등록일', width: '5%' },
  { key: 'fileUri', label: '파일', width: '5%' },
];

const FARE_COLUMNS = [
  { key: 'regYmd', label: '날짜', width: '4%' },
  { key: 'prodId', label: '코드', width: '4%' },
  { key: 'prodNm', label: '요금제', width: '10%', align: 'left' },
  { key: 'prodAmt', label: '요금금액', width: '4%', align: 'right' },
];

const COUNSELOR_COLUMNS = [
  { key: 'chk', label: '선택', width: '4%' },
  { key: 'no', label: '순번', width: '4%' },
  { key: 'inputType', label: '타입', width: '10%' },
  { key: 'expireYmd', label: '삭제일', width: '10%' },
  { key: 'inputYmd', label: '등록일', width: '10%' },
];

const fetchDetail = async () => {
  if (!licenseCd.value)
    return;

  isLoading.value = true;

  const params = {
    licenseCd: licenseCd.value,
  };

  try {
    const res = await MaumPlusAPI.getCenterDetail(params);
    if (!res.ok)
      return toastApi.errorFromResult(res);

    detailInfo.value = res.data?.resultData ?? {};
  } catch (e) {
    toastApi.errorFromException(e);
  } finally {
    isLoading.value = false;
  }
};

const fetchList = async () => {
  try {
    //신청 계약서
    const applyParams = {
      licenseCd: licenseCd.value,
      fileType: 'A4001',
    };

    const applyRes = await MaumPlusAPI.getFileList(applyParams);
    if (!applyRes.ok) {
      return toastApi.errorFromResult(applyRes);
    }
    let applyList = applyRes.data?.resultData?.list ?? [];
    applyItems.value = applyList.map((item, index) => ({ ...item, no: index + 1 }));

    //해지 계약서
    const revocationParams = {
      licenseCd: licenseCd.value,
      fileType: 'A4002',
    };

    const revocationRes = await MaumPlusAPI.getFileList(revocationParams);
    if (!revocationRes.ok) {
      return toastApi.errorFromResult(revocationRes);
    }
    let revocationList = revocationRes.data?.resultData?.list ?? [];
    revocationItems.value = revocationList.map((item, index) => ({ ...item, no: index + 1 }));

    //요금변경내역
    const fareParams = {
      licenseCd: licenseCd.value,
    };

    const fareRes = await MaumPlusAPI.getProdLogList(fareParams);
    if (!fareRes.ok) {
      return toastApi.errorFromResult(fareRes);
    }
    let fareList = fareRes.data?.resultData?.list ?? [];
    fareItem.value = fareList.map((item, index) => ({ ...item, no: index + 1 }));

    //상담사 수
    const counselorParams = {
      licenseCd: licenseCd.value,
    };

    const counselorRes = await MaumPlusAPI.getPartnerList(counselorParams);
    if (!counselorRes.ok) {
      return toastApi.errorFromResult(counselorRes);
    }
    let counselorList = counselorRes.data?.resultData?.list ?? [];
    counselorItem.value = counselorList.map((item, index) => ({ ...item, no: index + 1, checked: false }));
  } catch (e) {
    return toastApi.errorFromException(e);
  }
};

const goBackToList = () => {
  router.push({ name: ROUTE.Maumplus.MaumPlusCenter.List, query: route.query });
};

//Todo: 센터 생성 테스트 필요.
const onCenterCreate = async () => {
  const confirm = await modal.show({
    title: '센터 생성',
    message: '센터 생성 하시겠습니까?',
    confirmText: '센터 생성',
  });

  if (!confirm)
    return;

  const params = {
    bizNo: detailInfo.value.businessNo,
    centerSeq: detailInfo.value.centerSeq,
  };

  try {
    const res = await MaumPlusAPI.putCenterSeq(params);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return;
    }

    toast.success('센터 생성 성공했습니다.');
    handleBack();
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

const goModify = () => {
  router.push({
    name: ROUTE.Maumplus.MaumPlusCenter.Modify,
    query: { ...route.query, licenseCd: licenseCd.value },
  });
};

const handlePdfOpenConfirm = (pdfUrl, pdfTitle) => {
  handleFile(pdfUrl, {
    fileName: `${pdfTitle}.pdf`,
    confirmTitle: '계약서',
    confirmMessage: `${pdfTitle} 파일을 여시겠습니까?`,
  });
};

const handleUpload = async (pdfTitle, FileType) => {
  if (!fileInfo.value[0])
    return toast.error(`${pdfTitle}를 첨부해주세요.`);

  await uploadFile(FileType);
};

const uploadFile = async (FileType) => {
  let formData = new FormData();
  formData.append('LicenseCd', licenseCd.value);
  formData.append('FileType', FileType);
  formData.append('upload', fileInfo.value[0]);
  logFormData(formData);

  try {
    const res = await MaumPlusAPI.postFileInfo(formData);
    if (!res.ok)
      return toastApi.errorFromException(res);

    if(FileType === 'A4001')
      isShowUploadModal.value = false;
    else
      isShowUploadModal2.value = false;

    await fetchList();
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

const addCounselor = async () => {
  const confirm = await modal.show({
    title: '추가',
    message: '상담사를 추가하시겠습니까?',
    confirmText: '추가',
  });
  if (!confirm)
    return;

  try{
    const params = {
      licenseCd: licenseCd.value,
    };
    const res = await MaumPlusAPI.postCounselor(params);
    if (!res.ok)
      return toastApi.errorFromException(res);

    await fetchList();
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

const deleteCounselor = async () => {
  if (counselorItem.value.filter(item => item.checked).length <= 0)
    return toast.error('삭제할 상담사를 선택해주세요.');

  const confirm = await modal.show({
    title: '제거',
    message: '상담사를 제거하시겠습니까?',
    confirmText: '제거',
  });
  if (!confirm)
    return;

  try{
    const formattedCounselors = counselorItem.value.map(item => ({ ...item, checked: item.checked ? 'Y' : 'N' }));
    const res = await MaumPlusAPI.putCounselor(formattedCounselors);
    if (!res.ok)
      return toastApi.errorFromException(res);

    toast.success('삭제되었습니다.');
    await fetchList();
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

onMounted(() => {
  fetchDetail();
  fetchList();
});
</script>

<template>
  <CCard class="mb-3">
    <CCardHeader class="d-flex justify-content-between align-items-center">
      <h6 class="mb-0">센터정보</h6>
    </CCardHeader>
    <CCardBody>
      <div class="loading" v-if="isLoading">
        <UiLoading />
      </div>
      <UiGridTable :fields="centerInfoFields" />
    </CCardBody>
    <CCardFooter class="d-flex justify-content-end gap-1">
      <CButton color="secondary" size="sm" @click="goBackToList">뒤로</CButton>
      <CButton color="primary" size="sm" @click="onCenterCreate" :disabled="detailInfo.centerSeq > 0">센터생성</CButton>
      <CButton color="warning" size="sm" @click="goModify">수정</CButton>
    </CCardFooter>
  </CCard>

  <CCard class="mb-3">
    <CCardHeader class="d-flex justify-content-between align-items-center">
      <h6 class="mb-0">신청 계약서</h6>
    </CCardHeader>
    <CCardBody>
      <div class="loading" v-if="isLoading">
        <UiLoading />
      </div>
      <UiDataTable :loading="isLoading" :columns="COLUMNS" :items="applyItems">
        <!-- 등록일 -->
        <template #cell-regDt="{ item }">
          {{ formatYmd(item.regDt) }}
        </template>

        <!-- 파일 -->
        <template #cell-fileUri="{ item }">
          <CButton color="success" size="sm" @click="handlePdfOpenConfirm(item.fileUri, '신청 계약서')">
            <CIcon name="cil-file" />
          </CButton>
        </template>
      </UiDataTable>
    </CCardBody>
    <CCardFooter class="d-flex justify-content-end gap-1">
      <CButton variant="primary" size="sm" @click="() => (isShowUploadModal = true)">등록</CButton>
    </CCardFooter>
  </CCard>

  <UiModal
    v-model:visible="isShowUploadModal"
    title="신청 계약서 변경"
    @confirm="handleUpload('신청 계약서', 'A4001')"
  >
    <template #body>
      <UiAttachments v-model="fileInfo" :accept="['image/*']" :max-count="1" helper-text="" />
    </template>
  </UiModal>

  <CCard class="mb-3">
    <CCardHeader class="d-flex justify-content-between align-items-center">
      <h6 class="mb-0">해지 계약서</h6>
    </CCardHeader>
    <CCardBody>
      <div class="loading" v-if="isLoading">
        <UiLoading />
      </div>
      <UiDataTable :loading="isLoading" :columns="COLUMNS" :items="revocationItems">
        <!-- 등록일 -->
        <template #cell-regDt="{ item }">
          {{ formatYmd(item.regDt) }}
        </template>

        <!-- 파일 -->
        <template #cell-fileUri="{ item }">
          <CButton color="success" size="sm" @click="handlePdfOpenConfirm(item.fileUri, '해지 계약서')">
            <CIcon name="cil-file" />
          </CButton>
        </template>
      </UiDataTable>
    </CCardBody>
    <CCardFooter class="d-flex justify-content-end gap-1">
      <CButton variant="primary" size="sm" @click="() => (isShowUploadModal2 = true)">등록</CButton>
    </CCardFooter>
  </CCard>

  <UiModal
    v-model:visible="isShowUploadModal2"
    title="해지 계약서 변경"
    @confirm="handleUpload('해지 계약서', 'A4002')"
  >
    <template #body>
      <UiAttachments v-model="fileInfo" :accept="['image/*']" :max-count="1" helper-text="" />
    </template>
  </UiModal>

  <CCard class="mb-3">
    <CCardHeader class="d-flex justify-content-between align-items-center">
      <h6 class="mb-0">요금변경내역</h6>
    </CCardHeader>
    <CCardBody>
      <div class="loading" v-if="isLoading">
        <UiLoading />
      </div>
      <UiDataTable :loading="isLoading" :columns="FARE_COLUMNS" :items="fareItem" >
        <!-- 요금금액 -->
        <template #cell-regYmd="{ item }">
          {{ formatYmd(item.regYmd) }}
        </template>

        <!-- 요금금액 -->
        <template #cell-prodAmt="{ item }">
          {{ formatMoney(item.prodAmt) }}
        </template>
      </UiDataTable>
    </CCardBody>
  </CCard>

  <CCard class="mb-3">
    <CCardHeader class="d-flex justify-content-between align-items-center">
      <h6 class="mb-0">상담사 수</h6>
    </CCardHeader>
    <CCardBody>
      <div class="loading" v-if="isLoading">
        <UiLoading />
      </div>
      <UiDataTable :loading="isLoading" :columns="COUNSELOR_COLUMNS" :items="counselorItem">
        <!-- 선택 -->
        <template #cell-chk="{ item }">
          <CFormCheck v-model="item.checked" v-if="item.expireYmd === null" />
        </template>

        <!-- 타입 -->
        <template #cell-inputType="{ item }">
          {{ item.inputType === 'D' ? '기본' : item.inputType === 'A' ? '추가' : '' }}
        </template>

        <!-- 삭제일 -->
        <template #cell-expireYmd="{ item }">
          {{ formatYmd(item.expireYmd) }}
        </template>

        <!-- 등록일 -->
        <template #cell-inputYmd="{ item }">
          {{ formatYmd(item.inputYmd) }}
        </template>
      </UiDataTable>
    </CCardBody>
    <CCardFooter class="d-flex justify-content-end gap-1">
      <CButton color="primary" size="sm" @click="addCounselor">추가</CButton>
      <CButton color="danger" size="sm" @click="deleteCounselor">삭제</CButton>
    </CCardFooter>
  </CCard>
</template>
